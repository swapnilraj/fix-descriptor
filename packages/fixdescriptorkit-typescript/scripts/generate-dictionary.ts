#!/usr/bin/env node

/**
 * Generate FIX Dictionary deployment data
 * Creates the binary data for deploying the FixDictionary contract
 */

import { encodeDictionary, FIX_44_DICTIONARY, getDictionaryHex } from '../src/dictionary.js';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('Generating FIX 4.4 Dictionary data...\n');
  
  // Encode dictionary
  const encoded = encodeDictionary(FIX_44_DICTIONARY);
  
  console.log(`Total size: ${encoded.length} bytes (~${(encoded.length / 1024).toFixed(2)} KB)`);
  console.log(`Slots: 957 × 24 bytes = ${957 * 24} bytes\n`);
  
  // Count defined tags
  const definedTags = Object.keys(FIX_44_DICTIONARY).length;
  console.log(`Defined tags: ${definedTags} / 957\n`);
  
  // Get hex string
  const hex = getDictionaryHex();
  
  // Write to file (go up to repo root, then into contracts/generated)
  const repoRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
  const outputDir = path.join(repoRoot, 'contracts', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'fix44-dictionary.hex');
  fs.writeFileSync(outputPath, hex);
  
  console.log(`Dictionary data written to: ${outputPath}`);
  console.log(`\nTo deploy, use this data with FixDictionary constructor or FixDictionaryFactory.`);
  
  // Sample tags
  console.log('\nSample tags:');
  const samples = [15, 48, 55, 167, 223, 447, 448, 452, 453, 454, 455, 456, 461, 541];
  samples.forEach(tag => {
    const offset = tag * 24;
    const length = encoded[offset];
    if (length > 0) {
      const nameBytes = encoded.slice(offset + 1, offset + 1 + length);
      const name = new TextDecoder().decode(nameBytes);
      console.log(`  Tag ${tag}: ${name}`);
    }
  });
}

main();

