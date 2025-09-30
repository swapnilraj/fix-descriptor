"use client";
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { abi as DataFactoryAbi } from '@/lib/abis/DataContractFactory';
import { abi as TokenFactoryAbi } from '@/lib/abis/AssetTokenFactory';
import { abi as AssetTokenAbi } from '@/lib/abis/AssetTokenERC20';
import { chainFromEnv } from '@/lib/viemClient';
import { createWalletClient, custom, type Address, createPublicClient, http, decodeEventLog } from 'viem';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

type ProofResult = {
  pathCBORHex: string;
  valueHex: string;
  proof: string[];
  directions: boolean[];
} | null;

// Tree visualization types
type TreeNodeData = {
  tag?: string;
  name?: string;
  value?: string;
  type: 'scalar' | 'group' | 'entry' | 'root';
  children?: TreeNodeData[];
  path?: number[];
  isExpanded?: boolean;
};

type MerkleNodeData = {
  hash: string;
  type: 'leaf' | 'parent' | 'root';
  path?: number[];
  left?: MerkleNodeData;
  right?: MerkleNodeData;
  isHighlighted?: boolean;
};

// Example FIX messages for educational purposes
const EXAMPLES = {
  treasury: {
    name: "US Treasury Bond",
    description: "A simple government security with basic fields",
    fix: "8=FIX.4.4|9=0000|35=d|55=USTB-2030-11-15|48=US91282CEZ76|22=4|167=TBOND|461=DBFTFR|541=20301115|223=4.250|15=USD|10=000"
  },
  corporate: {
    name: "Corporate Bond",
    description: "Corporate bond with nested groups and multiple identifiers",
    fix: "8=FIX.4.4|9=0000|35=d|55=ACME-CORP-2028|48=US000402AJ19|22=1|167=CORP|461=DBFXXX|15=USD|541=20280515|223=3.750|454=2|455=000402AJ1|456=1|455=US000402AJ19|456=4|453=2|448=ISSUER_ACME|447=D|452=1|448=TRUSTEE_BANK|447=D|452=24|10=000"
  },
  simple: {
    name: "Simple Equity",
    description: "Basic equity instrument with minimal fields",
    fix: "8=FIX.4.4|9=0000|35=d|55=AAPL|48=US0378331005|22=1|167=CS|15=USD|10=000"
  }
};

// FIX Tag reference
const FIX_TAGS: Record<string, { name: string; description: string }> = {
  "8": { name: "BeginString", description: "FIX protocol version (session - excluded)" },
  "9": { name: "BodyLength", description: "Message length (session - excluded)" },
  "10": { name: "CheckSum", description: "Message checksum (session - excluded)" },
  "15": { name: "Currency", description: "Currency of the instrument" },
  "22": { name: "SecurityIDSource", description: "Source of SecurityID (1=CUSIP, 4=ISIN)" },
  "35": { name: "MsgType", description: "Message type (d=Security Definition)" },
  "48": { name: "SecurityID", description: "Primary security identifier" },
  "55": { name: "Symbol", description: "Ticker or common symbol" },
  "167": { name: "SecurityType", description: "Type of security (TBOND, CORP, CS, etc.)" },
  "223": { name: "CouponRate", description: "Interest rate for fixed income" },
  "447": { name: "PartyIDSource", description: "Source of PartyID" },
  "448": { name: "PartyID", description: "Party identifier" },
  "452": { name: "PartyRole", description: "Role of the party (1=Issuer, 24=Trustee)" },
  "453": { name: "NoPartyIDs", description: "Number of party entries" },
  "454": { name: "NoSecurityAltID", description: "Number of alternative security IDs" },
  "455": { name: "SecurityAltID", description: "Alternative security identifier" },
  "456": { name: "SecurityAltIDSource", description: "Source of alternative ID" },
  "461": { name: "CFICode", description: "ISO 10962 Classification of Financial Instruments" },
  "541": { name: "MaturityDate", description: "Maturity date (YYYYMMDD)" },
  "802": { name: "NoPartySubIDs", description: "Number of party sub-identifiers" }
};

// Tree Node Component
function TreeNode({ 
  node, 
  level = 0, 
  onToggle,
  onPathClick 
}: { 
  node: TreeNodeData; 
  level?: number; 
  onToggle?: (path: number[]) => void;
  onPathClick?: (path: number[]) => void;
}) {
  const indent = level * 24;
  const hasChildren = node.children && node.children.length > 0;
  const tagInfo = node.tag ? FIX_TAGS[node.tag] : null;

  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem 0.75rem',
          background: level % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          borderRadius: '4px',
          cursor: hasChildren || node.path ? 'pointer' : 'default',
          transition: 'background 0.2s'
        }}
        onClick={() => {
          if (hasChildren && node.path && onToggle) {
            onToggle(node.path);
          } else if (node.type === 'scalar' && node.path && onPathClick) {
            onPathClick(node.path);
          }
        }}
        onMouseEnter={(e) => {
          if (hasChildren || node.path) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = level % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        }}
      >
        {hasChildren && (
          <span style={{ 
            marginRight: '0.5rem', 
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            width: '12px'
          }}>
            {node.isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span style={{ width: '20px' }} />}
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {node.type === 'root' && (
            <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
              FIX Descriptor
            </span>
          )}
          
          {node.type === 'entry' && (
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'ui-monospace, monospace'
            }}>
              Entry {node.name}
            </span>
          )}
          
          {(node.type === 'scalar' || node.type === 'group') && (
            <>
              <span style={{ 
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                minWidth: '30px'
              }}>
                {node.tag}
              </span>
              {tagInfo && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  {tagInfo.name}
                </span>
              )}
              {node.value && (
                <span style={{ 
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.9)',
                  marginLeft: 'auto'
                }}>
                  {node.value}
                </span>
              )}
              {node.type === 'group' && node.children && (
                <span style={{ 
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginLeft: node.value ? '0.5rem' : 'auto'
                }}>
                  [{node.children.length} {node.children.length === 1 ? 'entry' : 'entries'}]
                </span>
              )}
            </>
          )}
          
          {node.path && node.type === 'scalar' && (
            <span style={{ 
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'ui-monospace, monospace',
              marginLeft: 'auto'
            }}>
              {JSON.stringify(node.path)}
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && node.isExpanded && node.children?.map((child, idx) => (
        <TreeNode 
          key={idx} 
          node={child} 
          level={level + 1} 
          onToggle={onToggle}
          onPathClick={onPathClick}
        />
      ))}
    </div>
  );
}

// Merkle Tree Visualization Component
function MerkleTreeNode({ 
  node, 
  level = 0,
  onLeafClick 
}: { 
  node: MerkleNodeData; 
  level?: number;
  onLeafClick?: (path: number[]) => void;
}) {
  const isLeaf = node.type === 'leaf';
  const isRoot = node.type === 'root';
  const childContainerRef = useRef<HTMLDivElement | null>(null);
  const [connectors, setConnectors] = useState<{ width: number; leftX: number | null; rightX: number | null }>({
    width: 0,
    leftX: null,
    rightX: null,
  });

  useLayoutEffect(() => {
    const container = childContainerRef.current;
    if (!container) return;

    const measure = () => {
      if (!childContainerRef.current) return;
      const width = childContainerRef.current.offsetWidth;
      const childElements = Array.from(childContainerRef.current.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el.tagName.toLowerCase() !== 'svg'
      );
      const [leftEl, rightEl] = childElements;
      const next = {
        width,
        leftX: leftEl ? leftEl.offsetLeft + leftEl.offsetWidth / 2 : null,
        rightX: rightEl ? rightEl.offsetLeft + rightEl.offsetWidth / 2 : null,
      };

      setConnectors((prev) => {
        if (
          prev.width === next.width &&
          prev.leftX === next.leftX &&
          prev.rightX === next.rightX
        ) {
          return prev;
        }
        return next;
      });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => {
      observer.disconnect();
    };
  }, [node.left, node.right]);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '1.5rem',
      flexShrink: 0,
      minWidth: 'max-content'
    }}>
      {/* Node Box */}
      <div
        style={{
          padding: isRoot ? '1rem 1.5rem' : isLeaf ? '0.875rem 1.25rem' : '0.75rem 1.25rem',
          background: node.isHighlighted 
            ? 'rgba(255,255,255,0.1)' 
            : isRoot 
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.03)',
          border: `1px solid ${node.isHighlighted 
            ? 'rgba(255,255,255,0.4)' 
            : isRoot
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(255,255,255,0.1)'}`,
          borderRadius: isRoot ? '8px' : '6px',
          cursor: isLeaf && node.path ? 'pointer' : 'default',
          transition: 'all 0.2s',
          textAlign: 'center',
          minWidth: isLeaf ? '140px' : '160px',
          position: 'relative'
        }}
        onClick={() => {
          if (isLeaf && node.path && onLeafClick) {
            onLeafClick(node.path);
          }
        }}
        onMouseEnter={(e) => {
          if (isLeaf && node.path) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (isLeaf && !node.isHighlighted) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        {/* Node Type Label */}
        <div style={{ 
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '500'
        }}>
          {isRoot ? 'Root' : isLeaf ? 'Leaf' : 'Parent'}
        </div>
        
        {/* Path for leaves */}
        {isLeaf && node.path && (
          <div style={{ 
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: '500'
          }}>
            {JSON.stringify(node.path)}
          </div>
        )}
        
        {/* Hash Value */}
        <div style={{ 
          fontSize: isRoot ? '0.8rem' : '0.75rem',
          fontFamily: 'ui-monospace, monospace',
          color: node.isHighlighted ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
          wordBreak: 'break-all',
          lineHeight: '1.4',
          fontWeight: node.isHighlighted ? '500' : '400'
        }}>
          {isRoot ? node.hash : `${node.hash.slice(0, 12)}...`}
        </div>
      </div>
      
      {/* Children */}
      {(node.left || node.right) && (
        <div
          style={{ 
            position: 'relative', 
            display: 'flex', 
            gap: '3rem',
            flexShrink: 0,
            minWidth: 'max-content'
          }}
          ref={childContainerRef}
        >
          {/* Connecting Lines */}
          <svg 
            style={{ 
              position: 'absolute', 
              top: '-1.5rem', 
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${Math.max(connectors.width, 1)}px`,
              height: '1.5rem',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
            viewBox={`0 0 ${Math.max(connectors.width, 1)} 30`}
            preserveAspectRatio="xMidYMin meet"
          >
            {connectors.width > 0 && connectors.leftX !== null && (
              <path
                d={`M ${connectors.width / 2} 0 Q ${(connectors.width / 2 + connectors.leftX) / 2} 10 ${connectors.leftX} 30`}
                fill="none"
                stroke={node.isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
                strokeWidth={node.isHighlighted ? '2' : '1.5'}
              />
            )}
            {connectors.width > 0 && connectors.rightX !== null && (
              <path
                d={`M ${connectors.width / 2} 0 Q ${(connectors.width / 2 + connectors.rightX) / 2} 10 ${connectors.rightX} 30`}
                fill="none"
                stroke={node.isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
                strokeWidth={node.isHighlighted ? '2' : '1.5'}
              />
            )}
          </svg>
          
          {/* Child Nodes */}
          {node.left && (
            <MerkleTreeNode 
              node={node.left} 
              level={level + 1} 
              onLeafClick={onLeafClick} 
            />
          )}
          {node.right && (
            <MerkleTreeNode 
              node={node.right} 
              level={level + 1} 
              onLeafClick={onLeafClick} 
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [fixRaw, setFixRaw] = useState('');
  const [preview, setPreview] = useState<{ 
    root: string; 
    cborHex: string; 
    leavesCount: number; 
    paths: number[][]; 
    merkleTree: MerkleNodeData;
    treeData?: TreeNodeData;
    parsedFields?: Array<{ tag: string; value: string; tagInfo?: typeof FIX_TAGS[string] }>;
  } | null>(null);
  const [pathInput, setPathInput] = useState('');
  const [proof, setProof] = useState<ProofResult>(null);
  const [txInfo, setTxInfo] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hex' | 'tree' | 'merkle'>('hex');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Token deployment state
  const [showTokenDeploy, setShowTokenDeploy] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string | null>(null);
  const [onChainVerificationStatus, setOnChainVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

  // Check wallet connection on mount and listen for account changes
  useEffect(() => {
    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accountsArray[0]);
        } else {
          setWalletConnected(false);
          setWalletAddress(null);
        }
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);

      // Cleanup listener on unmount
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const steps = [
    { 
      name: "Input", 
      description: "FIX Message",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    },
    { 
      name: "Parse", 
      description: "Extract Fields",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    },
    { 
      name: "Canonicalize", 
      description: "Build Tree",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
    { 
      name: "Encode", 
      description: "CBOR Binary",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )
    },
    { 
      name: "Merkle", 
      description: "Generate Root",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="2" />
          <path d="M12 10v4" />
          <circle cx="8" cy="16" r="2" />
          <circle cx="16" cy="16" r="2" />
          <path d="M12 14l-2 2" />
          <path d="M12 14l2 2" />
        </svg>
      )
    },
    { 
      name: "Deploy", 
      description: "Onchain",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      )
    }
  ];

  function loadExample(key: keyof typeof EXAMPLES) {
    setFixRaw(EXAMPLES[key].fix);
    setPreview(null);
    setProof(null);
    setCurrentStep(0);
  }

  function toggleSection(section: string) {
    setExpandedSection(prev => prev === section ? null : section);
  }

  async function switchToHoodi() {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x88BB0' }],
      });
    } catch (switchError: unknown) {
      if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x88BB0',
                chainName: 'Hoodi Testnet',
                rpcUrls: ['https://ethereum-hoodi-rpc.publicnode.com'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://hoodi.ethpandaops.io'],
              },
            ],
          });
        } catch {
          alert('Failed to add Hoodi testnet to wallet');
        }
      } else {
        alert('Failed to switch to Hoodi testnet');
      }
    }
  }

  async function doPreview() {
    setProof(null);
    setOnChainVerificationStatus(null); // Reset verification status when preview changes
    setLoading(true);
    setCurrentStep(1);
    
    try {
      const res = await fetch('/api/preview', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ fixRaw }) 
      });
      
    if (!res.ok) {
      const text = await res.text();
      alert(`Preview failed: ${text}`);
        setCurrentStep(0);
      return;
    }
      
    const json = await res.json();
    setPreview(json);
      setCurrentStep(4);
      
      // Use tree data from backend
      if (json.treeData) {
        setTreeData(json.treeData);
        setExpandedNodes(new Set(['[]'])); // Expand root by default
      }
    } finally {
      setLoading(false);
    }
  }

  async function doProof() {
    if (!preview) return;
    setLoading(true);
    setOnChainVerificationStatus(null); // Reset verification status when generating new proof
    
    try {
    const parsedPath = JSON.parse(pathInput || '[]');
      const res = await fetch('/api/proof', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ fixRaw, path: parsedPath }) 
      });
    const json: ProofResult = await res.json();
    setProof(json);
    } finally {
      setLoading(false);
    }
  }

  interface Eip1193Provider {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  }

  function getProvider(): Eip1193Provider {
    const eth = (window as unknown as { ethereum?: unknown }).ethereum as unknown;
    return eth as Eip1193Provider;
  }

  async function getAccount(): Promise<Address> {
    const provider = getProvider();
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    return accounts[0] as Address;
  }

  async function checkWalletConnection() {
    if (!window.ethereum) {
      setWalletConnected(false);
      setWalletAddress(null);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      } else {
        setWalletConnected(false);
        setWalletAddress(null);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setWalletConnected(false);
      setWalletAddress(null);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install MetaMask to continue.');
      return;
    }

    try {
      // First switch to Hoodi network
      await switchToHoodi();
      
      // Then request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  }

  async function deployCBOR() {
    if (!preview) return;
    setCurrentStep(5);
    
    const account = await getAccount();
    const provider = getProvider();
    const wallet = createWalletClient({ account, chain: chainFromEnv, transport: custom(provider as never) });
    const dataHex = preview.cborHex as `0x${string}`;
    type Abi = readonly unknown[];
    const factoryAbi: Abi = DataFactoryAbi;
    const hash = await wallet.writeContract({ 
      address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`, 
      abi: factoryAbi, 
      functionName: 'deploy', 
      args: [dataHex] 
    });
    setTxInfo(`Deploy tx: ${hash}`);
  }

  async function deployWithFactory() {
    if (!preview || !walletConnected) {
      alert('Please connect wallet and generate preview first');
      return;
    }

    if (!tokenName || !tokenSymbol || !tokenSupply) {
      alert('Please fill in all token fields');
      return;
    }

    const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS;
    if (!factoryAddress) {
      alert('Token factory not configured. Please set NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS in your environment.');
      return;
    }

    try {
      setLoading(true);
      
    const account = await getAccount();
    const provider = getProvider();
    const wallet = createWalletClient({ account, chain: chainFromEnv, transport: custom(provider as never) });
      
      // Dictionary hash for DEMO_FIX_SCHEMA
      const dictHash = '0xb24215c985384ddaa6767272d452780aa4352201a1df669564cde3905cb6a215' as `0x${string}`;
      
      // Prepare descriptor (factory will set fixCBORPtr and fixCBORLen)
      const descriptor = {
        fixMajor: 4,
        fixMinor: 4,
        dictHash: dictHash,
        fixRoot: preview.root as `0x${string}`,
        fixCBORPtr: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        fixCBORLen: 0,
        fixURI: ''
      };

      // Convert supply to wei (18 decimals)
      const supplyInWei = BigInt(tokenSupply) * BigInt(10 ** 18);
    
    type Abi = readonly unknown[];
      const factoryAbi: Abi = TokenFactoryAbi;
      
      // Ensure CBOR hex has 0x prefix
      const cborHexData = preview.cborHex.startsWith('0x') 
        ? preview.cborHex as `0x${string}`
        : `0x${preview.cborHex}` as `0x${string}`;
      
      // Call deployWithDescriptor
      const hash = await wallet.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: factoryAbi,
        functionName: 'deployWithDescriptor',
        args: [
          tokenName,
          tokenSymbol,
          supplyInWei,
          cborHexData,
          descriptor
        ]
      });

      setTxInfo(`Token deployment transaction: ${hash}\nWaiting for confirmation...`);
      
      // Wait for transaction receipt to get token address
      const publicClient = createPublicClient({
        chain: chainFromEnv,
        transport: http()
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Decode the AssetTokenDeployed event from the receipt logs
      // Event signature: AssetTokenDeployed(address indexed tokenAddress, address indexed deployer, string name, string symbol, uint256 initialSupply)
      let tokenAddress = 'Check transaction';
      
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: factoryAbi,
            data: log.data,
            topics: log.topics
          });
          
          if (decoded.eventName === 'AssetTokenDeployed') {
            // Extract tokenAddress from decoded event args
            const args = decoded.args as { tokenAddress?: Address; deployer?: Address; name?: string; symbol?: string; initialSupply?: bigint };
            if (args.tokenAddress) {
              tokenAddress = args.tokenAddress;
              setDeployedTokenAddress(tokenAddress);
              
              console.log('✅ Decoded AssetTokenDeployed event:', {
                tokenAddress: args.tokenAddress,
                deployer: args.deployer,
                name: args.name,
                symbol: args.symbol,
                initialSupply: args.initialSupply?.toString()
              });
              break;
            }
          }
        } catch {
          // Skip logs that don't match our ABI
          continue;
        }
      }

      setTxInfo(`✅ Token deployed successfully!\n\nToken Address: ${tokenAddress}\nCBOR Deployed: ✓\nDescriptor Set: ✓\n\nTransaction: ${hash}\n\nYou can now verify proofs onchain using this token!`);
      setShowTokenDeploy(false);
      setCurrentStep(5); // Update step indicator to show deployment complete
      
      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setTokenSupply('1000000');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTxInfo(`❌ Deployment failed: ${errorMessage}`);
      alert(`Deployment failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function verifyProofOnChain() {
    if (!proof || !deployedTokenAddress) {
      alert('Please generate a proof and deploy a token first');
      return;
    }

    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setOnChainVerificationStatus('pending');
      
      const publicClient = createPublicClient({
        chain: chainFromEnv,
        transport: http()
      });

      type Abi = readonly unknown[];
      const tokenAbi: Abi = AssetTokenAbi;

      // First, check if the descriptor is initialized by trying to get the root
      let descriptorRoot;
      try {
        descriptorRoot = await publicClient.readContract({
          address: deployedTokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: 'getFixRoot',
          args: []
        });
      } catch (rootError) {
        const errorMsg = rootError instanceof Error ? rootError.message : 'Unknown error';
        if (errorMsg.includes('Descriptor not initialized')) {
          setOnChainVerificationStatus('failed');
          setTxInfo(`❌ Descriptor Not Initialized\n\nThe token at ${deployedTokenAddress} does not have a descriptor set yet.\n\nThis can happen if:\n- The token was deployed without a descriptor\n- The descriptor setup transaction failed\n- You're using a different token\n\nTry deploying a new token using the "Quick Deploy Token" button.`);
          return;
        }
        throw rootError;
      }

      // Now verify the proof
      const isValid = await publicClient.readContract({
        address: deployedTokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'verifyField',
        args: [
          proof.pathCBORHex as `0x${string}`,
          proof.valueHex as `0x${string}`,
          proof.proof.map(p => p as `0x${string}`),
          proof.directions
        ]
      });

      if (isValid) {
        setOnChainVerificationStatus('success');
        setTxInfo(`✅ Onchain Verification SUCCESSFUL!\n\nToken Address: ${deployedTokenAddress}\nDescriptor Root: ${descriptorRoot}\nPath: ${proof.pathCBORHex}\nValue: ${proof.valueHex}\nProof Length: ${proof.proof.length}\n\nThe proof is cryptographically valid onchain! 🎉`);
      } else {
        setOnChainVerificationStatus('failed');
        setTxInfo(`❌ Onchain Verification FAILED!\n\nThe proof did not match the committed Merkle root.\n\nDescriptor Root: ${descriptorRoot}\nYour Proof Root: ${preview?.root}\n\nThis could mean:\n- The proof is for a different descriptor\n- The value was modified\n- The path is incorrect\n- The proof is invalid`);
      }
      
    } catch (error) {
      console.error('Onchain verification failed:', error);
      setOnChainVerificationStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (errorMessage.includes('returned no data')) {
        setTxInfo(`❌ Contract Call Failed\n\nThe contract at ${deployedTokenAddress} returned no data.\n\nPossible causes:\n- The address is not a valid AssetToken contract\n- The contract doesn't implement IFixDescriptor\n- The network is incorrect\n\nPlease ensure you deployed the token using the "Quick Deploy Token" button.`);
      } else if (errorMessage.includes('Descriptor not initialized')) {
        setTxInfo(`❌ Descriptor Not Initialized\n\nThe token has not been set up with a FIX descriptor yet.`);
      } else {
        setTxInfo(`❌ Onchain verification error:\n\n${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // Toggle tree node expansion
  function toggleNode(path: number[]) {
    const pathKey = JSON.stringify(path);
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pathKey)) {
        newSet.delete(pathKey);
      } else {
        newSet.add(pathKey);
      }
      return newSet;
    });
  }

  // Update tree data when expanded nodes change
  function updateTreeExpansion(node: TreeNodeData): TreeNodeData {
    const pathKey = node.path ? JSON.stringify(node.path) : '';
    return {
      ...node,
      isExpanded: pathKey ? expandedNodes.has(pathKey) : node.isExpanded,
      children: node.children?.map(child => updateTreeExpansion(child))
    };
  }

  // No need to build tree client-side anymore - we get it from the API with all real hashes!

  // Highlight proof path in Merkle tree
  function highlightProofPath(node: MerkleNodeData | null, selectedPath: number[]): MerkleNodeData | null {
    if (!node) return null;

    const isSelected = node.path && JSON.stringify(node.path) === JSON.stringify(selectedPath);
    
    const leftHighlighted = node.left ? highlightProofPath(node.left, selectedPath) : undefined;
    const rightHighlighted = node.right ? highlightProofPath(node.right, selectedPath) : undefined;
    
    return {
      ...node,
      isHighlighted: isSelected || (node.left && highlightHasSelected(node.left, selectedPath)) || 
                                    (node.right && highlightHasSelected(node.right, selectedPath)),
      left: leftHighlighted || undefined,
      right: rightHighlighted || undefined
    };
  }

  function highlightHasSelected(node: MerkleNodeData | undefined, selectedPath: number[]): boolean {
    if (!node) return false;
    if (node.path && JSON.stringify(node.path) === JSON.stringify(selectedPath)) return true;
    return highlightHasSelected(node.left, selectedPath) || highlightHasSelected(node.right, selectedPath);
  }

  const fixFields = preview?.parsedFields || [];
  const displayTreeData = treeData ? updateTreeExpansion(treeData) : null;
  
  // Get Merkle tree from API (with all real keccak256 hashes) and highlight selected path
  const merkleTree = preview?.merkleTree || null;
  const selectedPath = pathInput ? (() => {
    try {
      return JSON.parse(pathInput);
    } catch {
      return null;
    }
  })() : null;
  const highlightedMerkleTree = merkleTree && selectedPath ? highlightProofPath(merkleTree, selectedPath) : merkleTree;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: '#0a0a0a'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 2rem 4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
      <div>
              <h1 style={{ 
                fontSize: '3.5rem', 
                marginBottom: 0, 
                fontWeight: '600',
                letterSpacing: '-0.02em',
                lineHeight: '1.1'
              }}>
                FixDescriptorKit
              </h1>
              <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', paddingTop: '0.5rem' }}>
                <Link href="/" style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  textDecoration: 'none',
                  borderBottom: '2px solid rgba(255,255,255,0.9)',
                  paddingBottom: '0.25rem'
                }}>
                  Explorer
                </Link>
                <a href="/spec" style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                  Specification
                </a>
              </nav>
            </div>
            
            {/* Wallet Status */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: walletConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
              border: walletConnected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: walletConnected ? '#22c55e' : '#ef4444'
              }} />
              <span style={{ color: walletConnected ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>
                {walletConnected ? (
                  walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'
                ) : (
                  'Not Connected'
                )}
              </span>
            </div>
          </div>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '400',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Transform FIX asset descriptors into verifiable onchain commitments
          </p>
        </div>
      </header>

      {/* Process Flow */}
      <div style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: '#0a0a0a',
        padding: '3rem 0'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            position: 'relative'
          }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px',
                    border: `1px solid ${idx <= currentStep ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    background: idx <= currentStep ? 'rgba(255,255,255,0.05)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: idx <= currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s',
                    marginBottom: '1rem',
                    position: 'relative'
                  }}>
                    {step.icon}
                    {idx < steps.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 'calc(100vw / 6 - 40px)',
                        maxWidth: '200px',
                        height: '1px',
                        background: idx < currentStep ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                      }} />
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: idx <= currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                    marginBottom: '0.25rem',
                    transition: 'color 0.3s',
                    textAlign: 'center'
                  }}>
                    {step.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '400',
                    textAlign: 'center'
                  }}>
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
        
        {/* Examples Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              letterSpacing: '-0.01em'
            }}>
              Examples
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
              Start with a pre-configured FIX message
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem' 
          }}>
            {Object.entries(EXAMPLES).map(([key, example]) => (
              <button
                key={key}
                onClick={() => loadExample(key as keyof typeof EXAMPLES)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  color: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {example.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                  {example.description}
                </div>
          </button>
            ))}
        </div>
        </section>

        {/* Input Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => toggleSection('input')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'inherit'
              }}
            >
      <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.01em'
                }}>
                  Input FIX Message
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                  Paste or edit your FIX descriptor
                </p>
      </div>
              <span style={{ 
                fontSize: '1.5rem', 
                color: 'rgba(255,255,255,0.5)',
                transition: 'transform 0.2s',
                transform: expandedSection === 'input' ? 'rotate(45deg)' : 'none'
              }}>
                +
              </span>
          </button>
        </div>

          {expandedSection === 'input' && (
            <div style={{ 
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              marginBottom: '2rem',
              fontSize: '0.9rem',
              lineHeight: '1.7',
              color: 'rgba(255,255,255,0.7)'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>What is FIX?</strong><br/>
                FIX (Financial Information eXchange) is a standard protocol for real-time electronic exchange 
                of securities transaction information.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Format:</strong><br/>
                FIX messages use tag=value pairs separated by | (or SOH characters). Each tag is a number 
                identifying a field (e.g., 55=Symbol, 48=SecurityID).
              </p>
              <p>
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Note:</strong><br/>
                Session fields (8, 9, 10) are excluded from the commitment. Only business/instrument fields are encoded.
              </p>
      </div>
          )}

          <textarea 
            value={fixRaw} 
            onChange={(e) => setFixRaw(e.target.value)} 
            rows={8} 
            placeholder="Paste FIX message here..."
            style={{ 
              width: '100%', 
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#ffffff',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              resize: 'vertical',
              lineHeight: '1.6'
            }} 
          />

          {fixFields.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '1rem',
                fontWeight: '500'
              }}>
                Parsed Fields ({fixFields.length})
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)'
              }}>
                {fixFields.map((field: { tag: string; value: string; tagInfo?: typeof FIX_TAGS[string] }, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '0.75rem 1rem',
                      borderBottom: idx < fixFields.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ 
                        fontWeight: '500',
                        fontFamily: 'ui-monospace, monospace',
                        color: ['8', '9', '10', '35'].includes(field.tag) 
                          ? 'rgba(239, 68, 68, 0.8)' 
                          : 'rgba(255,255,255,0.9)'
                      }}>
                        {field.tag}
                      </span>
                      {field.tagInfo && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                          {field.tagInfo.name}
                        </span>
                      )}
                      {['8', '9', '10', '35'].includes(field.tag) && (
                        <span style={{ 
                          fontSize: '0.7rem',
                          color: 'rgba(239, 68, 68, 0.8)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '3px',
                          fontWeight: '500'
                        }}>
                          excluded
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: 'ui-monospace, monospace',
                      textAlign: 'right',
                      fontSize: '0.8rem'
                    }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={doPreview}
              disabled={!fixRaw || loading}
              style={{
                background: fixRaw && !loading ? '#ffffff' : 'rgba(255,255,255,0.1)',
                color: fixRaw && !loading ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.875rem 2rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: fixRaw && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Processing...' : 'Process'}
            </button>
            
            <button 
              onClick={walletConnected ? undefined : connectWallet}
              style={{
                background: walletConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                color: walletConnected ? '#22c55e' : '#ffffff',
                border: walletConnected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '0.875rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: walletConnected ? 'default' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!walletConnected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!walletConnected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
            >
              {walletConnected ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5c0-1.66-4-3-9-3S3 3.34 3 5z" />
                  </svg>
                  Connect Wallet
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {preview && (
          <>
            <section style={{ marginBottom: '4rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <button
                  onClick={() => toggleSection('results')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'inherit'
                  }}
                >
      <div>
                    <h2 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.01em'
                    }}>
                      Results
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                      CBOR encoding and Merkle commitment
                    </p>
            </div>
                  <span style={{ 
                    fontSize: '1.5rem', 
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'transform 0.2s',
                    transform: expandedSection === 'results' ? 'rotate(45deg)' : 'none'
                  }}>
                    +
                  </span>
                </button>
          </div>

              {expandedSection === 'results' && (
                <div style={{ 
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.7',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>CBOR Encoding:</strong><br/>
                    The parsed FIX fields are converted to Concise Binary Object Representation, 
                    ensuring deterministic encoding.
                  </p>
                  <p>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Merkle Root:</strong><br/>
                    Each field becomes a leaf in a Merkle tree. The root provides a cryptographic 
                    commitment to all fields.
                  </p>
                </div>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Merkle Root
                  </div>
                  <div style={{ 
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all', 
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: '1.6'
                  }}>
                    {preview.root}
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Statistics
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Leaves</span>
                      <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{preview.leavesCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>CBOR Size</span>
                      <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                        {Math.floor((preview.cborHex.length - 2) / 2)} bytes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Tabs */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { key: 'hex', label: 'CBOR Hex' },
                    { key: 'tree', label: 'Tree View' },
                    { key: 'merkle', label: 'Merkle Tree' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewMode(key as 'hex' | 'tree' | 'merkle')}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: viewMode === key ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: viewMode === key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-1px'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                {viewMode === 'hex' && (
                  <>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      CBOR Hex
                    </div>
                    <textarea 
                      readOnly 
                      value={preview.cborHex} 
                      rows={6} 
                      style={{ 
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.75rem',
                        resize: 'vertical',
                        lineHeight: '1.6'
                      }} 
                    />
                  </>
                )}

                {viewMode === 'tree' && displayTreeData && (
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '1rem',
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}>
                    <TreeNode 
                      node={displayTreeData} 
                      onToggle={toggleNode}
                      onPathClick={(path) => {
                        setPathInput(JSON.stringify(path));
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}

                {viewMode === 'merkle' && (
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '2rem',
                    overflowX: 'auto'
                  }}>
                    {highlightedMerkleTree ? (
                      <>
                        <div style={{ 
                          marginBottom: '2rem',
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: '1.6'
                        }}>
                          <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Merkle Tree Visualization</strong><br/>
                          Each leaf represents a field in the FIX descriptor. Click a leaf to select its path for proof generation.
                          {selectedPath && (
                            <>
                              <br/><br/>
                              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Selected Path:</strong>{' '}
                              <code style={{ 
                                fontFamily: 'ui-monospace, monospace',
                                background: 'rgba(255,255,255,0.1)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '3px'
                              }}>
                                {JSON.stringify(selectedPath)}
                              </code>
                              <br/>
                              Highlighted nodes show the proof path from the selected leaf to the root.
                            </>
                          )}
                        </div>
                        <div style={{ 
                          minHeight: '300px',
                          paddingBottom: '2rem'
                        }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              width: 'max-content',
                              minWidth: '100%',
                              margin: '0 auto',
                              overflow: 'visible'
                            }}
                          >
                            <MerkleTreeNode 
                              node={highlightedMerkleTree}
                              onLeafClick={(path) => {
                                setPathInput(JSON.stringify(path));
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: 'rgba(255,255,255,0.5)',
                        padding: '2rem'
                      }}>
                        No Merkle tree data available
                      </div>
        )}
      </div>
                )}
              </div>

      <div>
                <div style={{ 
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '1rem',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Deploy
            </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setShowTokenDeploy(!showTokenDeploy)}
                    style={{
                      background: showTokenDeploy ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = showTokenDeploy ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
                    }}
                  >
                    {showTokenDeploy ? '− Hide' : '🚀 Quick Deploy Token'}
                  </button>
          </div>
                {txInfo && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: 'rgba(34, 197, 94, 0.9)',
                    wordBreak: 'break-all',
                    fontFamily: 'ui-monospace, monospace'
                  }}>
                    {txInfo}
                  </div>
        )}

                {/* Token Deployment Form */}
                {showTokenDeploy && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600', 
                      marginBottom: '1rem',
                      color: '#60a5fa'
                    }}>
                      Deploy ERC20 Token with Descriptor
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '1.5rem'
                    }}>
                      Deploy a new ERC20 token with the FIX descriptor embedded in one transaction using AssetTokenFactory.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.875rem', 
                          marginBottom: '0.5rem',
                          color: 'rgba(255,255,255,0.8)'
                        }}>
                          Token Name
                        </label>
                        <input
                          type="text"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                          placeholder="US Treasury Bond Token"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.875rem', 
                            marginBottom: '0.5rem',
                            color: 'rgba(255,255,255,0.8)'
                          }}>
                            Symbol
                          </label>
                          <input
                            type="text"
                            value={tokenSymbol}
                            onChange={(e) => setTokenSymbol(e.target.value)}
                            placeholder="USTB"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.875rem', 
                            marginBottom: '0.5rem',
                            color: 'rgba(255,255,255,0.8)'
                          }}>
                            Initial Supply
                          </label>
                          <input
                            type="text"
                            value={tokenSupply}
                            onChange={(e) => setTokenSupply(e.target.value)}
                            placeholder="1000000"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.6)'
                      }}>
                        <strong style={{ color: '#60a5fa' }}>Note:</strong> AssetTokenFactory must be deployed on your network.
                        Set <code style={{ 
                          background: 'rgba(0,0,0,0.3)', 
                          padding: '0.125rem 0.25rem', 
                          borderRadius: '3px',
                          color: '#60a5fa'
                        }}>NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS</code> in your environment variables.
                      </div>
                      
                      <button
                        onClick={deployWithFactory}
                        disabled={!walletConnected || !tokenName || !tokenSymbol || !tokenSupply || loading}
                        style={{
                          background: walletConnected && tokenName && tokenSymbol && tokenSupply && !loading
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)'
                            : 'rgba(255,255,255,0.05)',
                          color: walletConnected && tokenName && tokenSymbol && tokenSupply && !loading ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '1rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: walletConnected && tokenName && tokenSymbol && tokenSupply && !loading ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                          opacity: walletConnected && tokenName && tokenSymbol && tokenSupply && !loading ? 1 : 0.5
                        }}
                      >
                        {loading ? '⏳ Deploying...' : '🚀 Deploy Token with Descriptor'}
                      </button>
                    </div>
                  </div>
                )}
      </div>
            </section>

            {/* Proof Section */}
            <section style={{ marginBottom: '4rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <button
                  onClick={() => toggleSection('proof')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'inherit'
                  }}
                >
      <div>
                    <h2 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.01em'
                    }}>
                      Generate Proof
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                      Create a Merkle proof for a specific field
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '1.5rem', 
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'transform 0.2s',
                    transform: expandedSection === 'proof' ? 'rotate(45deg)' : 'none'
                  }}>
                    +
                  </span>
                </button>
              </div>

              {expandedSection === 'proof' && (
                <div style={{ 
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginBottom: '2rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.7',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Merkle Proof:</strong><br/>
                    A proof that a specific field exists in the committed data without revealing all other fields.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Path Examples:</strong><br/>
                    <code style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '3px',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.85rem'
                    }}>[15]</code> - Currency field<br/>
                    <code style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '3px',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.85rem'
                    }}>[454, 0, 456]</code> - SecurityAltID group, first entry
                  </p>
                  <p>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>Onchain Use:</strong><br/>
                    Submit the proof to smart contracts to verify specific fields.
                  </p>
                </div>
              )}

              {preview.paths && preview.paths.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '1rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Available Paths
                  </div>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)'
                  }}>
                    {preview.paths.map((path, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPathInput(JSON.stringify(path))}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: idx < preview.paths.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          cursor: 'pointer',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.7)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        }}
                      >
                        {JSON.stringify(path)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.75rem',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Path (JSON Array)
                </div>
                <input 
                  value={pathInput} 
                  onChange={(e) => setPathInput(e.target.value)} 
                  placeholder='[15] or [454,0,456]'
                  style={{ 
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#ffffff',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.875rem'
                  }} 
                />
              </div>

              <button 
                onClick={doProof}
                disabled={loading}
                style={{
                  background: loading ? 'rgba(255,255,255,0.1)' : '#ffffff',
                  color: loading ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.875rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '2rem'
                }}
              >
                {loading ? 'Generating...' : 'Generate Proof'}
              </button>

        {proof && (
                <div style={{ 
                  display: 'grid', 
                  gap: '1.5rem',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: onChainVerificationStatus === 'success' ? '2px solid rgba(34, 197, 94, 0.4)' :
                          onChainVerificationStatus === 'failed' ? '2px solid rgba(239, 68, 68, 0.4)' :
                          onChainVerificationStatus === 'pending' ? '2px solid rgba(59, 130, 246, 0.4)' :
                          '1px solid rgba(255,255,255,0.1)',
                  background: onChainVerificationStatus === 'success' ? 'rgba(34, 197, 94, 0.05)' :
                              onChainVerificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.05)' :
                              onChainVerificationStatus === 'pending' ? 'rgba(59, 130, 246, 0.05)' :
                              'transparent',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Verification Status Badge */}
                  {onChainVerificationStatus && (
                    <div style={{
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: onChainVerificationStatus === 'success' ? 'rgba(34, 197, 94, 0.15)' :
                                  onChainVerificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' :
                                  'rgba(59, 130, 246, 0.15)',
                      border: onChainVerificationStatus === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' :
                              onChainVerificationStatus === 'failed' ? '1px solid rgba(239, 68, 68, 0.3)' :
                              '1px solid rgba(59, 130, 246, 0.3)',
                    }}>
                      <div style={{ fontSize: '1.5rem' }}>
                        {onChainVerificationStatus === 'success' ? '✅' :
                         onChainVerificationStatus === 'failed' ? '❌' :
                         '⏳'}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: onChainVerificationStatus === 'success' ? 'rgba(34, 197, 94, 0.95)' :
                                 onChainVerificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.95)' :
                                 'rgba(59, 130, 246, 0.95)',
                          marginBottom: '0.25rem'
                        }}>
                          {onChainVerificationStatus === 'success' ? 'Onchain Verification Successful' :
                           onChainVerificationStatus === 'failed' ? 'Onchain Verification Failed' :
                           'Verifying Onchain...'}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          {onChainVerificationStatus === 'success' ? 'This proof is cryptographically valid on the blockchain' :
                           onChainVerificationStatus === 'failed' ? 'The proof could not be verified against the onchain descriptor' :
                           'Checking proof against deployed contract...'}
                        </div>
                      </div>
          </div>
        )}
                  <div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Path CBOR (hex)
      </div>
                    <textarea 
                      readOnly 
                      value={proof.pathCBORHex} 
                      rows={2} 
                      style={{ 
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.75rem',
                        resize: 'vertical',
                        lineHeight: '1.6'
                      }} 
                    />
    </div>

                  <div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Value (hex)
                    </div>
                    <textarea 
                      readOnly 
                      value={proof.valueHex} 
                      rows={2} 
                      style={{ 
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.75rem',
                        resize: 'vertical',
                        lineHeight: '1.6'
                      }} 
                    />
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Proof (sibling hashes)
                    </div>
                    <textarea 
                      readOnly 
                      value={JSON.stringify(proof.proof, null, 2)} 
                      rows={6} 
                      style={{ 
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.75rem',
                        resize: 'vertical',
                        lineHeight: '1.6'
                      }} 
                    />
                  </div>

                  <div>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Directions
                    </div>
                    <div style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      {JSON.stringify(proof.directions)}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgba(255,255,255,0.4)', 
                        marginTop: '0.5rem',
                        fontFamily: 'inherit'
                      }}>
                        (true = current node is right child / sibling on left, false = current node is left child / sibling on right)
                      </div>
                    </div>
                  </div>

                  {/* Onchain Verification Button - Only show if token is deployed */}
                  {deployedTokenAddress && (
                    <div style={{ 
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: onChainVerificationStatus === null ? 'rgba(255, 255, 255, 0.03)' :
                                  onChainVerificationStatus === 'success' ? 'rgba(34, 197, 94, 0.05)' :
                                  onChainVerificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.05)' :
                                  'rgba(59, 130, 246, 0.05)',
                      border: onChainVerificationStatus === null ? '1px solid rgba(255, 255, 255, 0.1)' :
                              onChainVerificationStatus === 'success' ? '1px solid rgba(34, 197, 94, 0.2)' :
                              onChainVerificationStatus === 'failed' ? '1px solid rgba(239, 68, 68, 0.2)' :
                              '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ 
                          color: onChainVerificationStatus === null ? 'rgba(255,255,255,0.7)' :
                                 onChainVerificationStatus === 'success' ? 'rgba(34, 197, 94, 0.9)' :
                                 onChainVerificationStatus === 'failed' ? 'rgba(239, 68, 68, 0.9)' :
                                 'rgba(59, 130, 246, 0.9)'
                        }}>
                          {onChainVerificationStatus === null ? '🔗 Ready for Onchain Verification' :
                           onChainVerificationStatus === 'success' ? '✅ Verified Onchain' :
                           onChainVerificationStatus === 'failed' ? '❌ Verification Failed' :
                           '⏳ Verifying...'}
                        </strong>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'rgba(255,255,255,0.6)',
                          marginTop: '0.25rem',
                          fontFamily: 'ui-monospace, monospace'
                        }}>
                          {deployedTokenAddress}
                        </div>
                      </div>
                      
                      <button
                        onClick={verifyProofOnChain}
                        disabled={loading || onChainVerificationStatus === 'pending'}
                        style={{
                          background: loading || onChainVerificationStatus === 'pending' ? 
                            'rgba(59, 130, 246, 0.2)' : 
                            onChainVerificationStatus === 'success' ? 
                            'rgba(34, 197, 94, 0.15)' :
                            onChainVerificationStatus === 'failed' ?
                            'rgba(239, 68, 68, 0.15)' :
                            'rgba(255, 255, 255, 0.1)',
                          color: loading || onChainVerificationStatus === 'pending' ? 
                            'rgba(59, 130, 246, 0.7)' :
                            onChainVerificationStatus === 'success' ? 
                            'rgba(34, 197, 94, 0.9)' :
                            onChainVerificationStatus === 'failed' ?
                            'rgba(239, 68, 68, 0.9)' :
                            'rgba(255, 255, 255, 0.9)',
                          border: `1px solid ${
                            loading || onChainVerificationStatus === 'pending' ?
                            'rgba(59, 130, 246, 0.3)' :
                            onChainVerificationStatus === 'success' ?
                            'rgba(34, 197, 94, 0.3)' :
                            onChainVerificationStatus === 'failed' ?
                            'rgba(239, 68, 68, 0.3)' :
                            'rgba(255, 255, 255, 0.2)'
                          }`,
                          borderRadius: '6px',
                          padding: '0.875rem 1.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: loading || onChainVerificationStatus === 'pending' ? 'not-allowed' : 'pointer',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                          }
                        }}
                      >
                        {loading || onChainVerificationStatus === 'pending' ? '⏳ Verifying Onchain...' :
                         onChainVerificationStatus === 'success' ? '✅ Re-verify Proof' :
                         onChainVerificationStatus === 'failed' ? '🔄 Try Again' :
                         '🔗 Verify Proof Onchain'}
                      </button>
                      
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: '0.75rem',
                        lineHeight: '1.5'
                      }}>
                        This will call the <code style={{ 
                          background: 'rgba(0,0,0,0.3)', 
                          padding: '0.125rem 0.25rem', 
                          borderRadius: '3px' 
                        }}>verifyField()</code> function on your deployed token contract to verify the proof cryptographically onchain.
                      </div>
                    </div>
                  )}
          </div>
        )}
            </section>
          </>
        )}

        {/* How It Works */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              letterSpacing: '-0.01em'
            }}>
              How It Works
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
              Understanding the encoding process
            </p>
      </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {[
              {
                step: '01',
                title: 'Parse FIX',
                description: 'Extract business fields from the FIX message. Session fields are excluded as they\'re not part of the instrument definition.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                )
              },
              {
                step: '02',
                title: 'Canonicalize',
                description: 'Build a hierarchical tree structure with sorted keys, ensuring deterministic ordering.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )
              },
              {
                step: '03',
                title: 'CBOR Encode',
                description: 'Convert to Concise Binary Object Representation using canonical form for compact, deterministic storage.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                )
              },
              {
                step: '04',
                title: 'Merkle Tree',
                description: 'Generate a Merkle tree from all fields. The root provides a cryptographic commitment to the entire descriptor.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="2" />
                    <path d="M12 10v4" />
                    <circle cx="8" cy="16" r="2" />
                    <circle cx="16" cy="16" r="2" />
                    <path d="M12 14l-2 2" />
                    <path d="M12 14l2 2" />
                    <path d="M8 18v2" />
                    <path d="M16 18v2" />
                  </svg>
                )
              },
              {
                step: '05',
                title: 'Deploy Token',
                description: 'Deploy an ERC20 or ERC721 token contract with the FIX descriptor and CBOR data embedded onchain using SSTORE2, creating a self-contained asset.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                    <polyline points="7.5 19.79 7.5 14.6 3 12" />
                    <polyline points="21 12 16.5 14.6 16.5 19.79" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                )
              },
              {
                step: '06',
                title: 'Verify Proofs',
                description: 'The token contract can verify specific fields using Merkle proofs against its embedded descriptor, without parsing the entire FIX message.',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ 
                  marginBottom: '1.5rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  {item.icon}
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: '0.75rem',
                  fontWeight: '500',
                  letterSpacing: '0.1em'
                }}>
                  {item.step}
                </div>
                <h3 style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  marginBottom: '0.75rem',
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'rgba(255,255,255,0.5)', 
                  lineHeight: '1.7' 
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ 
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            Transform FIX descriptors into verifiable onchain commitments
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.875rem' }}>
              <a 
                href="https://github.com/swapnilraj/fix-descriptor" 
                style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                GitHub
              </a>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <a 
              href="/spec" 
              style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              Specification
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
