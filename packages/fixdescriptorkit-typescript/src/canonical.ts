import type { DescriptorTree, FixSchema, GroupNode, Tag } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildCanonicalTree(msg: DescriptorTree, _dict?: unknown, _schema?: FixSchema): DescriptorTree {
  // Validate structure and normalize. Keys must be integers; values are strings or GroupNode.
  const out: DescriptorTree = {};

  function isGroupLike(value: any): value is GroupNode {
    return isObject(value) && 'tag' in value && 'entries' in value;
  }

  function normalizeGroup(groupLike: GroupNode, tag: Tag, path: number[]): GroupNode {
    if (groupLike.tag !== undefined && groupLike.tag !== tag) {
      throw new Error(`Group tag mismatch at path ${JSON.stringify(path.concat(tag))}`);
    }
    if (!Array.isArray(groupLike.entries)) {
      throw new Error(`Group entries must be array at path ${JSON.stringify(path.concat(tag))}`);
    }

    const normalizedEntries = groupLike.entries.map((entry, idx) => {
      if (!isObject(entry)) {
        throw new Error(`Group entry must be object at path ${JSON.stringify(path.concat(tag, idx))}`);
      }
      return visitMap(entry as Record<Tag, any>, path.concat(tag, idx));
    });

    return { tag, entries: normalizedEntries } as GroupNode;
  }

  function visitMap(input: Record<Tag, any>, path: number[]): Record<Tag, any> {
    const result: Record<Tag, any> = {};
    for (const k of Object.keys(input)) {
      const tag = Number(k) as Tag;
      if (!Number.isInteger(tag) || tag < 0) {
        throw new Error(`Non-integer tag at path ${JSON.stringify(path.concat(k as any))}`);
      }
      const v = (input as any)[k];
      if (typeof v === 'string') {
        if (result[tag] !== undefined) {
          throw new Error(`Duplicate tag at path ${JSON.stringify(path.concat(tag))}`);
        }
        result[tag] = v;
        continue;
      }

      if (isGroupLike(v)) {
        if (result[tag] !== undefined) {
          throw new Error(`Duplicate tag at path ${JSON.stringify(path.concat(tag))}`);
        }
        result[tag] = normalizeGroup(v, tag, path);
        continue;
      }

      throw new Error(`Invalid value at path ${JSON.stringify(path.concat(tag))}`);
    }
    return result;
  }

  Object.assign(out, visitMap(msg as any, []));
  return out;
}

