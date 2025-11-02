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
} from './types.js';

export { DEMO_FIX_SCHEMA } from './types.js';

export { parseFixDescriptor, treeToFixMessage } from './parse.js';
export { buildCanonicalTree } from './canonical.js';
export { encodeCanonicalCBOR, decodeCanonicalCBOR } from './cbor.js';
export {
  enumerateLeaves,
  computeRoot,
  generateProof,
  verifyProofLocal,
  buildMerkleTreeStructure,
  type MerkleTreeNode,
} from './merkle.js';

export {
  FIX_44_DICTIONARY,
  encodeDictionary,
  decodeDictionary,
  getDictionaryHex,
  applyTagNames,
  type DictionaryEntry,
} from './dictionary.js';

import { parseFixDescriptor } from './parse.js';
import { buildCanonicalTree } from './canonical.js';
import { encodeCanonicalCBOR } from './cbor.js';
import { enumerateLeaves, computeRoot } from './merkle.js';
import type { CanonicalResult, EncodeAllOptions } from './types.js';
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
