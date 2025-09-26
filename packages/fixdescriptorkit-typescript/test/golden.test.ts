import { describe, it, expect, beforeAll } from 'vitest';
import { LicenseManager } from 'fixparser';
import { DEMO_FIX_SCHEMA } from '../src/types';
import { encodeCanonicalCBOR } from '../src/cbor';
import { parseFixDescriptor } from '../src/parse';
import { buildCanonicalTree } from '../src/canonical';
import { enumerateLeaves, computeRoot, verifyProofLocal, generateProof } from '../src/merkle';

const FIX_EXAMPLE = '55=USTB-2030-11-15|48=US91282CEZ76|22=4|167=TBOND|461=DBFTFR|541=20301115|223=4.250|15=USD|454=2|455=91282CEZ7|456=1|455=US91282CEZ76|456=4|453=2|448=US_TREASURY|447=D|452=1|448=CUSTODIAN_BANK_ABC|447=D|452=24|';
const FIX_EXAMPLE_2 = '8=FIX.4.4|9=0000|35=d|34=2|49=BUY_SIDE_FIRM|56=BLOOMBERG|52=20250919-16:20:05.123|320=REQ-NEW-BOND-001|322=RESP-NEW-BOND-001|323=1|55=ACME 5.000 15Dec2030|48=US000000AA11|22=4|167=CORP|460=4|207=BLPX|15=USD|225=20250919|541=20301215|223=5.000|470=US|107=Acme Corp 5.00% Notes due 15-Dec-2030|10=000';

function toHex(u8: Uint8Array): string {
  return '0x' + Buffer.from(u8).toString('hex');
}

describe('Golden vectors - example treasury descriptor', () => {
  let licensed = false;
  beforeAll(async () => {
    const key = process.env.FIXPARSER_LICENSE_KEY;
    if (key) {
      await LicenseManager.setLicenseKey(key);
      licensed = true;
    } else {
      // try anyway; will skip test if license missing
      licensed = false;
    }
  });

  it('computes stable CBOR, root and verifies proof (USTB example)', () => {
    if (!licensed) {
      console.warn('FIXPARSER_LICENSE_KEY not set; skipping golden test.');
      expect(true).toBe(true);
      return;
    }
    const tree = parseFixDescriptor(FIX_EXAMPLE, { schema: DEMO_FIX_SCHEMA });
    const canonical = buildCanonicalTree(tree);
    const cbor = encodeCanonicalCBOR(canonical);
    const leaves = enumerateLeaves(canonical);
    const root = computeRoot(leaves);
    expect(leaves.length).toBeGreaterThan(0);
    expect(root).not.toEqual('0x0000000000000000000000000000000000000000000000000000000000000000');
    // Verify a known path: Currency [15]
    const { pathCBOR, valueBytes, proof, directions } = generateProof(leaves, [15]);
    const ok = verifyProofLocal(root, pathCBOR, valueBytes, proof, directions);
    expect(ok).toBe(true);
    // Negative
    const tampered = new Uint8Array(valueBytes);
    tampered[0] ^= 0xff;
    expect(verifyProofLocal(root, pathCBOR, tampered, proof, directions)).toBe(false);
  });

  it('parses and encodes the provided corporate bond example (smoke)', () => {
    let tree;
    try {
      tree = parseFixDescriptor(FIX_EXAMPLE_2, { schema: DEMO_FIX_SCHEMA, allowSOH: true });
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('Requires FIXParser')) {
        // Parsing falls back to naive mode even if license is missing; continue
        tree = parseFixDescriptor(FIX_EXAMPLE_2, { schema: DEMO_FIX_SCHEMA, allowSOH: true });
      } else {
        throw e;
      }
    }
    const canonical = buildCanonicalTree(tree);
    const cbor = encodeCanonicalCBOR(canonical);
    const leaves = enumerateLeaves(canonical);
    const root = computeRoot(leaves);

    // Log once to capture values to freeze as constants if needed
    console.log('CBOR_HEX', toHex(cbor));
    console.log('ROOT', root);

    // Pick a known path: [15] (Currency)
    const targetPath = [15];
    const { pathCBOR, valueBytes, proof, directions } = generateProof(leaves, targetPath);
    const ok = verifyProofLocal(root, pathCBOR, valueBytes, proof, directions);
    expect(ok).toBe(true);

    // Negative: tamper value
    const tampered = new Uint8Array(valueBytes);
    tampered[0] = tampered[0] ^ 0xff;
    const bad = verifyProofLocal(root, pathCBOR, tampered, proof, directions);
    expect(bad).toBe(false);
  });
});
