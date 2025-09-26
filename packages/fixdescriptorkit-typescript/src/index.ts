export type {
  Tag,
  Path,
  FixValue,
  ScalarNode,
  GroupEntry,
  GroupNode,
  DescriptorTree,
  CanonicalResult,
  GroupSchema,
  FixSchema,
  EncodeAllOptions,
} from './types';

export { DEMO_FIX_SCHEMA } from './types';

export { parseFixDescriptor } from './parse';
export { buildCanonicalTree } from './canonical';
export { encodeCanonicalCBOR, decodeCanonicalCBOR } from './cbor';
export {
  enumerateLeaves,
  computeRoot,
  generateProof,
  verifyProofLocal,
} from './merkle';

import { parseFixDescriptor } from './parse';
import { buildCanonicalTree } from './canonical';
import { encodeCanonicalCBOR } from './cbor';
import { enumerateLeaves, computeRoot } from './merkle';
import type { CanonicalResult, EncodeAllOptions } from './types';
import { keccak256, hexToBytes, bytesToHex } from 'viem';

export function encodeAll(rawFix: string, opts?: EncodeAllOptions): CanonicalResult {
  const tree = parseFixDescriptor(rawFix, { allowSOH: true, schema: opts?.schema });
  const canonical = buildCanonicalTree(tree);
  const cbor = encodeCanonicalCBOR(canonical);
  const leavesFull = enumerateLeaves(canonical);
  const root = computeRoot(leavesFull);
  const outLeaves = leavesFull.map(({ pathCBOR, valueBytes }) => {
    const bytes = new Uint8Array(pathCBOR.length + valueBytes.length);
    bytes.set(pathCBOR, 0);
    bytes.set(valueBytes, pathCBOR.length);
    const leaf = bytesToHex(hexToBytes(keccak256(bytes)));
    return { pathCBOR, valueBytes, leaf: leaf as `0x${string}` };
  });
  return { tree: canonical, cbor, leaves: outLeaves, root };
}
