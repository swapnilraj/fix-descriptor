export type Tag = number; // FIX tag
export type Path = number[]; // e.g., [454, 1, 456]
export type FixValue = string; // UTF-8 FIX value bytes

export type ScalarNode = { tag: Tag; value: FixValue };

export type GroupEntry = Record<Tag, FixValue | GroupNode>;

export type GroupNode = { tag: Tag; entries: GroupEntry[] };

export type DescriptorTree = Record<Tag, FixValue | GroupNode>;

export interface CanonicalResult {
  tree: DescriptorTree;
  leaves: Array<{
    pathCBOR: Uint8Array;
    valueBytes: Uint8Array;
    leaf: `0x${string}`;
  }>;
  root: `0x${string}`; // keccak256 root
}

// Schema types to guide grouping (not a parser itself)
export type GroupSchema = {
  delimiter: Tag; // first field of each entry
  nested?: Record<Tag, GroupSchema>; // nested repeating groups by group tag
};

export type FixSchema = Record<Tag, GroupSchema>; // map group tag -> schema

export const DEMO_FIX_SCHEMA: FixSchema = {
  // 454=NoSecurityAltID, entries contain 455 (SecurityAltID) and 456 (SecurityAltIDSource)
  454: { delimiter: 455 },
  // 453=NoPartyIDs, entries contain 448 (PartyID) + 447 (PartyIDSource) + 452 (PartyRole)
  // and nested 802=NoPartySubIDs
  453: {
    delimiter: 448,
    nested: {
      // 802=NoPartySubIDs, entries contain 523 (PartySubID) + 803 (PartySubIDType)
      802: { delimiter: 523 },
    },
  },
};

export type EncodeAllOptions = {
  schema?: FixSchema;
  allowSOH?: boolean;
};


