"use client";
import { useState } from 'react';
import Link from 'next/link';
import { abi as DataFactoryAbi } from '@/lib/abis/DataContractFactory';
import { abi as RegistryAbi } from '@/lib/abis/DescriptorRegistry';
import { chainFromEnv } from '@/lib/viemClient';
import { createWalletClient, custom, type Address } from 'viem';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
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
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '1.5rem'
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
        <div style={{ position: 'relative', display: 'flex', gap: '3rem' }}>
          {/* Connecting Lines */}
          <svg 
            style={{ 
              position: 'absolute', 
              top: '-1.5rem', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '100%',
              height: '1.5rem',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
            viewBox="0 0 300 30"
            preserveAspectRatio="xMidYMin meet"
          >
            {node.left && node.right && (
              <>
                <line 
                  x1="150" y1="0" x2="75" y2="30" 
                  stroke={node.isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'} 
                  strokeWidth={node.isHighlighted ? '2' : '1.5'}
                />
                <line 
                  x1="150" y1="0" x2="225" y2="30" 
                  stroke={node.isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'} 
                  strokeWidth={node.isHighlighted ? '2' : '1.5'}
                />
              </>
            )}
            {node.left && !node.right && (
              <line 
                x1="150" y1="0" x2="150" y2="30" 
                stroke={node.isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'} 
                strokeWidth={node.isHighlighted ? '2' : '1.5'}
              />
            )}
          </svg>
          
          {/* Child Nodes */}
          {node.left && <MerkleTreeNode node={node.left} level={level + 1} onLeafClick={onLeafClick} />}
          {node.right && <MerkleTreeNode node={node.right} level={level + 1} onLeafClick={onLeafClick} />}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [fixRaw, setFixRaw] = useState('');
  const [preview, setPreview] = useState<{ root: string; cborHex: string; leavesCount: number; paths: number[][]; merkleTree: MerkleNodeData } | null>(null);
  const [pathInput, setPathInput] = useState('');
  const [proof, setProof] = useState<ProofResult>(null);
  const [txInfo, setTxInfo] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hex' | 'tree' | 'merkle'>('hex');

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
      description: "On-Chain",
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
      
      // Build tree data
      const fields = parseFixFields(fixRaw);
      const tree = buildTreeData(fields);
      setTreeData(tree);
      setExpandedNodes(new Set(['[]'])); // Expand root by default
    } finally {
      setLoading(false);
    }
  }

  async function doProof() {
    if (!preview) return;
    setLoading(true);
    
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

  async function registerDescriptor() {
    if (!preview) return;
    setCurrentStep(5);
    
    const account = await getAccount();
    const provider = getProvider();
    const wallet = createWalletClient({ account, chain: chainFromEnv, transport: custom(provider as never) });
    const assetId = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
    
    const fixCBORPtr = process.env.NEXT_PUBLIC_LAST_DEPLOYED_PTR;
    const validAddress = fixCBORPtr && fixCBORPtr.length === 42 && fixCBORPtr.startsWith('0x') 
      ? fixCBORPtr as `0x${string}`
      : '0x0000000000000000000000000000000000000000' as `0x${string}`;
    
    type Abi = readonly unknown[];
    const registryAbi: Abi = RegistryAbi;
    const hash = await wallet.writeContract({ 
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`, 
      abi: registryAbi, 
      functionName: 'registerDescriptor', 
      args: [assetId, validAddress, preview.root as `0x${string}`] 
    });
    setTxInfo(`Register tx: ${hash}`);
  }

  function parseFixFields(fixMsg: string): Array<{ tag: string; value: string; tagInfo?: typeof FIX_TAGS[string] }> {
    const fields = fixMsg.split('|').map(f => {
      const [tag, value] = f.split('=');
      return { tag, value, tagInfo: FIX_TAGS[tag] };
    }).filter(f => f.tag && f.value);
    return fields;
  }

  // Build tree data from parsed FIX fields
  function buildTreeData(fields: Array<{ tag: string; value: string }>): TreeNodeData {
    const root: TreeNodeData = {
      type: 'root',
      name: 'FIX Descriptor',
      children: [],
      isExpanded: true
    };

    const groupTags = ['454', '453', '802']; // Known group tags
    const children: TreeNodeData[] = [];
    let i = 0;

    while (i < fields.length) {
      const field = fields[i];
      
      // Skip session fields
      if (['8', '9', '10', '35'].includes(field.tag)) {
        i++;
        continue;
      }

      if (groupTags.includes(field.tag)) {
        // This is a group
        const groupCount = parseInt(field.value);
        const groupNode: TreeNodeData = {
          type: 'group',
          tag: field.tag,
          value: field.value,
          children: [],
          path: [parseInt(field.tag)],
          isExpanded: false
        };

        // Parse group entries (simplified - assumes flat structure)
        const entries: TreeNodeData[] = [];
        for (let j = 0; j < groupCount && i + 1 < fields.length; j++) {
          const entry: TreeNodeData = {
            type: 'entry',
            name: String(j),
            children: [],
            isExpanded: true
          };
          
          // Add next few fields to this entry (simplified)
          let fieldCount = 0;
          while (fieldCount < 3 && i + 1 + fieldCount < fields.length) {
            const entryField = fields[i + 1 + fieldCount];
            if (!groupTags.includes(entryField.tag)) {
              entry.children?.push({
                type: 'scalar',
                tag: entryField.tag,
                value: entryField.value,
                path: [parseInt(field.tag), j, parseInt(entryField.tag)]
              });
              fieldCount++;
            } else {
              break;
            }
          }
          
          entries.push(entry);
        }
        
        groupNode.children = entries;
        children.push(groupNode);
        i += 1; // Move past group count
      } else {
        // Regular scalar field
        children.push({
          type: 'scalar',
          tag: field.tag,
          value: field.value,
          path: [parseInt(field.tag)]
        });
        i++;
      }
    }

    root.children = children;
    return root;
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

  const fixFields = fixRaw ? parseFixFields(fixRaw) : [];
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
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '400',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Transform FIX asset descriptors into verifiable on-chain commitments
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
                {fixFields.map((field, idx) => (
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
              onClick={switchToHoodi}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '0.875rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              Connect Wallet
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
                          display: 'flex', 
                          justifyContent: 'center',
                          minHeight: '300px',
                          paddingBottom: '2rem'
                        }}>
                          <MerkleTreeNode 
                            node={highlightedMerkleTree}
                            onLeafClick={(path) => {
                              setPathInput(JSON.stringify(path));
                            }}
                          />
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
                    onClick={deployCBOR}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    Deploy CBOR
                  </button>
                  <button 
                    onClick={registerDescriptor}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    Register Descriptor
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
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>On-Chain Use:</strong><br/>
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
                <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                title: 'Deploy CBOR',
                description: 'Store the CBOR data on-chain using the SSTORE2 pattern, making it publicly accessible.',
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
                description: 'Smart contracts can verify specific fields using Merkle proofs without parsing the entire descriptor.',
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
            Transform FIX descriptors into verifiable on-chain commitments
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