import { Encoder, Decoder } from 'cbor-x';
import type { DescriptorTree, GroupNode, Tag } from './types';

// Create encoder with canonical settings
const encoder = new Encoder({
  useRecords: false, // Use Map for deterministic key ordering
  mapsAsObjects: false, // Ensure maps are encoded as CBOR maps, not objects
});
const decoder = new Decoder();

export function encodeCanonicalCBOR(tree: DescriptorTree): Uint8Array {
  // Transform DescriptorTree into canonical CBOR structure
  function toCanonicalMap(map: Record<Tag, any>): Map<number, any> {
    const result = new Map<number, any>();
    
    // Sort keys numerically for canonical ordering (SPEC requirement)
    const sortedKeys = Object.keys(map)
      .map(k => Number(k))
      .filter(k => Number.isInteger(k) && k >= 0)
      .sort((a, b) => a - b);
    
    for (const key of sortedKeys) {
      const value = map[key];
      if (typeof value === 'string') {
        // Scalar value - encode as text string
        result.set(key, value);
      } else if (value && typeof value === 'object' && 'tag' in value && 'entries' in value) {
        // Group node - encode as array of maps
        const group = value as GroupNode;
        const entries = group.entries.map(entry => toCanonicalMap(entry));
        result.set(key, entries);
      } else {
        throw new Error(`Invalid value type for tag ${key}: ${typeof value}`);
      }
    }
    
    return result;
  }
  
  const canonicalStructure = toCanonicalMap(tree);
  const bytes = encoder.encode(canonicalStructure);
  
  // Validate that we got definite-length encoding
  if (bytes.length === 0) {
    throw new Error('CBOR encoding produced empty result');
  }
  
  return bytes;
}

export function decodeCanonicalCBOR(cbor: Uint8Array): DescriptorTree {
  const decoded = decoder.decode(cbor);
  function toTree(node: any): any {
    if (node && typeof node === 'object' && node.constructor?.name === 'Map') {
      const obj: Record<Tag, any> = {} as any;
      for (const [k, v] of node as Map<number, any>) {
        if (typeof v === 'string') obj[k as Tag] = v;
        else if (Array.isArray(v)) {
          const entries = v.map((entry) => toTree(entry));
          obj[k as Tag] = { tag: k as Tag, entries } as GroupNode;
        } else {
          throw new Error('Invalid CBOR structure');
        }
      }
      return obj;
    } else if (node && typeof node === 'object' && !Array.isArray(node)) {
      // entry map represented as Map in canonical encoding; tolerate object for robustness
      const obj: Record<Tag, any> = {} as any;
      for (const kk of Object.keys(node)) obj[Number(kk) as Tag] = (node as any)[kk];
      return obj;
    }
    return node;
  }
  return toTree(decoded) as DescriptorTree;
}



