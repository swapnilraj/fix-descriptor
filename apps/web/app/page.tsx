"use client";
import { useState } from 'react';
import DataFactory from '../lib/abis/DataContractFactory.json';
import Registry from '../lib/abis/DescriptorRegistry.json';
import { chainFromEnv } from '../lib/viemClient';
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

export default function Page() {
  const [fixRaw, setFixRaw] = useState('');
  const [preview, setPreview] = useState<{ root: string; cborHex: string; leavesCount: number; paths: number[][] } | null>(null);
  const [pathInput, setPathInput] = useState('');
  const [proof, setProof] = useState<ProofResult>(null);
  const [txInfo, setTxInfo] = useState<string>('');

  async function switchToHoodi() {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }

    try {
      // Try to switch to Hoodi testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x88BB0' }], // 560048 in hex
      });
    } catch (switchError: unknown) {
      // If network doesn't exist, add it
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
    const res = await fetch('/api/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fixRaw }) });
    if (!res.ok) {
      const text = await res.text();
      alert(`Preview failed: ${text}`);
      return;
    }
    const json = await res.json();
    setPreview(json);
  }

  async function doProof() {
    if (!preview) return;
    const parsedPath = JSON.parse(pathInput || '[]');
    const res = await fetch('/api/proof', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fixRaw, path: parsedPath }) });
    const json: ProofResult = await res.json();
    setProof(json);
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
    const account = await getAccount();
    const provider = getProvider();
    const wallet = createWalletClient({ account, chain: chainFromEnv, transport: custom(provider as never) });
    const dataHex = preview.cborHex as `0x${string}`;
    type Abi = readonly unknown[];
    const factoryAbi: Abi = (DataFactory as { abi: Abi }).abi;
    const hash = await wallet.writeContract({ address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`, abi: factoryAbi, functionName: 'deploy', args: [dataHex] });
    setTxInfo(`Deploy tx: ${hash}`);
  }

  async function registerDescriptor() {
    if (!preview) return;
    const account = await getAccount();
    const provider = getProvider();
    const wallet = createWalletClient({ account, chain: chainFromEnv, transport: custom(provider as never) });
    // Generate a proper 32-byte assetId
    const assetId = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
    
    // Ensure fixCBORPtr is a proper 20-byte address
    const fixCBORPtr = process.env.NEXT_PUBLIC_LAST_DEPLOYED_PTR;
    const validAddress = fixCBORPtr && fixCBORPtr.length === 42 && fixCBORPtr.startsWith('0x') 
      ? fixCBORPtr as `0x${string}`
      : '0x0000000000000000000000000000000000000000' as `0x${string}`;
    
    const d = {
      fixMajor: 4,
      fixMinor: 4,
      dictHash: `0x${'00'.repeat(32)}` as `0x${string}`, // TODO: Compute actual dict hash
      fixRoot: preview.root as `0x${string}`,
      fixCBORPtr: validAddress,
      fixCBORLen: ((preview.cborHex.length - 2) / 2) | 0,
      fixURI: '',
    } as const;
    type Abi = readonly unknown[];
    const registryAbi: Abi = (Registry as { abi: Abi }).abi;
    const hash = await wallet.writeContract({ address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`, abi: registryAbi, functionName: 'setDescriptor', args: [assetId, d] });
    setTxInfo(`Register tx: ${hash}`);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: 16 }}>
      <div>
        <h3>Input FIX</h3>
        <div style={{ marginBottom: 8 }}>
          <button onClick={switchToHoodi} style={{ backgroundColor: '#f39c12', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Switch to Hoodi Testnet
          </button>
        </div>
        <textarea value={fixRaw} onChange={(e) => setFixRaw(e.target.value)} rows={16} style={{ width: '100%' }} />
        <button onClick={doPreview} style={{ marginTop: 8 }}>Preview</button>
      </div>
      <div>
        <h3>Preview</h3>
        {preview ? (
          <div>
            <div><strong>Root:</strong> {preview.root}</div>
            <div><strong>CBOR (hex):</strong></div>
            <textarea readOnly value={preview.cborHex} rows={10} style={{ width: '100%' }} />
            <div><strong>Leaves:</strong> {preview.leavesCount}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={deployCBOR}>Deploy CBOR</button>
              <button onClick={registerDescriptor}>Register Descriptor</button>
            </div>
            {txInfo && <div style={{ marginTop: 8 }}><strong>Tx:</strong> {txInfo}</div>}
          </div>
        ) : (
          <div>Run preview to see results.</div>
        )}
      </div>
      <div>
        <h3>Proof</h3>
        <div>Path (JSON array, e.g., [15] or [454,1,456])</div>
        <input value={pathInput} onChange={(e) => setPathInput(e.target.value)} style={{ width: '100%' }} placeholder="[15]" />
        <button onClick={doProof} style={{ marginTop: 8 }}>Build Proof</button>
        {proof && (
          <div style={{ marginTop: 8 }}>
            <div><strong>pathCBORHex:</strong></div>
            <textarea readOnly value={proof.pathCBORHex} rows={4} style={{ width: '100%' }} />
            <div><strong>valueHex:</strong></div>
            <textarea readOnly value={proof.valueHex} rows={4} style={{ width: '100%' }} />
            <div><strong>proof:</strong></div>
            <textarea readOnly value={JSON.stringify(proof.proof)} rows={6} style={{ width: '100%' }} />
            <div><strong>directions:</strong> {JSON.stringify(proof.directions)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
