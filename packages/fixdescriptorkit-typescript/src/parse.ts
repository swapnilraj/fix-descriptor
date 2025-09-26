import { FIXParser } from 'fixparser';
import type { DescriptorTree, FixSchema, FixValue, GroupEntry, GroupNode, Tag } from './types';

const SESSION_TAGS = new Set<Tag>([
  8, // BeginString
  9, // BodyLength
  10, // CheckSum
  34, // MsgSeqNum
  35, // MsgType
  49, // SenderCompID
  52, // SendingTime
  56, // TargetCompID
]);

function ensureString(value: unknown): FixValue {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

// Helper to insert a scalar into a map with duplicate check
function setScalar(target: Record<Tag, FixValue | GroupNode>, tag: Tag, value: FixValue, path: number[]): void {
  if (tag in target) {
    throw new Error(`Duplicate tag at path ${JSON.stringify(path.concat(tag))}`);
  }
  target[tag] = value;
}

// Build groups using schema guidance. We expect tokens in order from fixparser message structure.
function assembleWithSchema(tokens: Array<{ tag: Tag; value: FixValue }>, schema: FixSchema): DescriptorTree {
  let idx = 0;

  function parseLevel(levelSchema?: FixSchema, path: number[] = []): Record<Tag, FixValue | GroupNode> {
    const map: Record<Tag, FixValue | GroupNode> = {};
    while (idx < tokens.length) {
      const { tag, value } = tokens[idx];
      // Stop condition is not explicit; in top-level we consume all tokens
      if (SESSION_TAGS.has(tag)) {
        idx++;
        continue;
      }

      // If current tag is a known repeating group count in schema
      if (levelSchema && tag in levelSchema) {
        const groupTag = tag;
        const groupDef = levelSchema[groupTag]!;
        idx++; // consume count tag itself; the next items form entries

        const entries: GroupEntry[] = [];
        while (idx < tokens.length) {
          // Entry begins when we see the delimiter tag; if not present, break
          const look = tokens[idx]?.tag;
          if (look !== groupDef.delimiter) break;

          // Parse one entry map
          const entry: GroupEntry = {};
          // First field must be delimiter
          const first = tokens[idx++];
          entry[first.tag] = first.value;

          // Continue consuming fields belonging to this entry until we hit:
          // - Another delimiter (new entry)
          // - A new group count tag (same level)
          // - End
          while (idx < tokens.length) {
            const nextTag = tokens[idx].tag;
            // New entry of same group
            if (nextTag === groupDef.delimiter) break;
            // Another group at this level
            if (levelSchema && nextTag in levelSchema) break;

            // Nested repeating group?
            if (groupDef.nested && nextTag in groupDef.nested) {
              // consume the nested group count tag
              const nestedGroupTag = nextTag;
              const nestedDef = groupDef.nested[nestedGroupTag]!;
              idx++; // consume count
              const nestedEntries: GroupEntry[] = [];
              // entries begin with nested delimiter
              while (idx < tokens.length) {
                const nt = tokens[idx]?.tag;
                if (nt !== nestedDef.delimiter) break;
                const nEntry: GroupEntry = {};
                const nFirst = tokens[idx++];
                nEntry[nFirst.tag] = nFirst.value;
                while (idx < tokens.length) {
                  const nt2 = tokens[idx].tag;
                  if (nt2 === nestedDef.delimiter) break;
                  // exit on sibling group or level changes
                  if (nt2 in (groupDef.nested || {})) break;
                  if (nt2 === groupDef.delimiter) break; // next outer entry
                  if (levelSchema && nt2 in levelSchema) break; // next outer group
                  const nv = tokens[idx++];
                  if (nEntry[nv.tag] !== undefined) throw new Error(`Duplicate tag in nested group at path ${JSON.stringify(path.concat(groupTag, nestedGroupTag, nv.tag))}`);
                  nEntry[nv.tag] = nv.value;
                }
                nestedEntries.push(nEntry);
              }
              // attach nested group node
              if (entry[nestedGroupTag] !== undefined) throw new Error(`Duplicate nested group at path ${JSON.stringify(path.concat(groupTag, nestedGroupTag))}`);
              entry[nestedGroupTag] = { tag: nestedGroupTag, entries: nestedEntries } as GroupNode;
              continue;
            }

            // Regular scalar field inside the group entry
            const nv = tokens[idx++];
            if (entry[nv.tag] !== undefined) throw new Error(`Duplicate tag in group entry at path ${JSON.stringify(path.concat(groupTag, nv.tag))}`);
            entry[nv.tag] = nv.value;
          }

          entries.push(entry);
        }

        if (map[groupTag] !== undefined) throw new Error(`Duplicate group tag at path ${JSON.stringify(path.concat(groupTag))}`);
        map[groupTag] = { tag: groupTag, entries } as GroupNode;
        continue;
      }

      // Scalar at current level
      idx++;
      setScalar(map, tag, value, path);
    }
    return map;
  }

  const top = parseLevel(schema, []);
  return top;
}

export function parseFixDescriptor(raw: string, opts?: { allowSOH?: boolean; schema?: FixSchema }): DescriptorTree {
  const allowSOH = opts?.allowSOH ?? true;
  const schema = opts?.schema ?? {};

  // normalize to SOH-separated string (license-independent)
  const soh = allowSOH
    ? raw
        .replace(/\r?\n/g, '\u0001')  // treat newlines as separators too
        .replace(/\|/g, '\u0001')
    : raw;

  // First pass: naive split to ensure we always get business fields even if fixparser is limited
  const naive: Array<{ tag: Tag; value: FixValue }> = [];
  for (const p0 of soh.split('\u0001')) {
    const p = p0.trim();
    if (!p) continue;
    const eq = p.indexOf('=');
    if (eq <= 0) continue;
    const tagStr = p.slice(0, eq);
    const val = p.slice(eq + 1);
    const t = Number(tagStr);
    if (!Number.isFinite(t)) continue;
    if (SESSION_TAGS.has(t)) continue;
    naive.push({ tag: t as Tag, value: ensureString(val) });
  }

  let flat = naive.slice();
  try {
    // Correct FIXParser instantiation and usage
    const parser = new FIXParser();
    const msg = parser.parse(soh);
    
    // Handle different FIXParser response formats
    let fields: any[] = [];
    if (Array.isArray(msg)) {
      // msg is an array of messages
      if (msg.length > 0 && msg[0]) {
        const firstMsg = msg[0] as any;
        fields = firstMsg.fields || firstMsg.FieldList || [];
      }
    } else if (msg && typeof msg === 'object') {
      // msg is a single message object
      const msgObj = msg as any;
      fields = msgObj.fields || msgObj.FieldList || msgObj.message?.fields || msgObj.message?.FieldList || [];
    }
    
    const fx: Array<{ tag: Tag; value: FixValue }> = [];
    for (const field of fields) {
      const tag = Number(field?.tag ?? field?.Tag ?? field?.[0]);
      const value = ensureString(field?.value ?? field?.Val ?? field?.[1]);
      if (!Number.isFinite(tag)) continue;
      if (SESSION_TAGS.has(tag)) continue;
      fx.push({ tag, value });
    }
    if (fx.length > flat.length) flat = fx;
  } catch (error) {
    // ignore parsing errors and use naive approach
    console.warn('FIXParser failed, using naive parsing:', error);
  }

  return assembleWithSchema(flat, schema);
}


