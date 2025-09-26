import type { DescriptorTree, FixSchema, GroupNode, Tag } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildCanonicalTree(msg: DescriptorTree, _dict?: unknown, _schema?: FixSchema): DescriptorTree {
  // Validate structure and normalize. Keys must be integers; values are strings or GroupNode.
  const out: DescriptorTree = {};

  function visitMap(input: Record<Tag, any>, path: number[]): Record<Tag, any> {
    const result: Record<Tag, any> = {};
    for (const k of Object.keys(input)) {
      const tag = Number(k) as Tag;
      if (!Number.isInteger(tag) || tag < 0) throw new Error(`Non-integer tag at path ${JSON.stringify(path.concat(k as any))}`);
      const v = (input as any)[k];
      if (typeof v === 'string') {
        if (result[tag] !== undefined) throw new Error(`Duplicate tag at path ${JSON.stringify(path.concat(tag))}`);
        result[tag] = v;
      } else if (isObject(v) && 'tag' in v && 'entries' in v) {
        // GroupNode
        const group = v as GroupNode;
        if (!Array.isArray(group.entries)) throw new Error(`Group entries must be array at path ${JSON.stringify(path.concat(tag))}`);
        const normalizedEntries = group.entries.map((entry, idx) => {
          if (!isObject(entry)) throw new Error(`Group entry must be object at path ${JSON.stringify(path.concat(tag, idx))}`);
          const m: Record<Tag, any> = {};
          for (const ek of Object.keys(entry)) {
            const etag = Number(ek) as Tag;
            const ev = (entry as any)[ek];
            if (m[etag] !== undefined) throw new Error(`Duplicate tag in group at path ${JSON.stringify(path.concat(tag, idx, etag))}`);
            if (typeof ev === 'string') {
              m[etag] = ev;
            } else if (isObject(ev) && 'tag' in ev && 'entries' in ev) {
              const nested = ev as GroupNode;
              if (!Array.isArray(nested.entries)) throw new Error(`Nested group entries must be array at path ${JSON.stringify(path.concat(tag, idx, etag))}`);
              const nestedEntries = nested.entries.map((nentry, nidx) => {
                if (!isObject(nentry)) throw new Error(`Nested group entry must be object at path ${JSON.stringify(path.concat(tag, idx, etag, nidx))}`);
                const nm: Record<Tag, any> = {};
                for (const nk of Object.keys(nentry)) {
                  const netag = Number(nk) as Tag;
                  const nev = (nentry as any)[nk];
                  if (nm[netag] !== undefined) throw new Error(`Duplicate tag in nested group at path ${JSON.stringify(path.concat(tag, idx, etag, nidx, netag))}`);
                  if (typeof nev === 'string') nm[netag] = nev;
                  else throw new Error(`Invalid nested group field at path ${JSON.stringify(path.concat(tag, idx, etag, nidx, netag))}`);
                }
                return nm;
              });
              m[etag] = { tag: etag, entries: nestedEntries } as GroupNode;
            } else {
              throw new Error(`Invalid group field at path ${JSON.stringify(path.concat(tag, idx, etag))}`);
            }
          }
          return m;
        });
        result[tag] = { tag, entries: normalizedEntries } as GroupNode;
      } else {
        throw new Error(`Invalid value at path ${JSON.stringify(path.concat(tag))}`);
      }
    }
    return result;
  }

  Object.assign(out, visitMap(msg as any, []));
  return out;
}


