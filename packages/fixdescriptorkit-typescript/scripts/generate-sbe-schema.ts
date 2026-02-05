import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { DOMParser } from "@xmldom/xmldom";
import { orchestraToSbeFullSchema } from "fixdescriptorkit-typescript/orchestraToSbe";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const inputPath = resolve(__dirname, "..", "lib", "ORCHESTRAFIX44.xml");
const outputPath = resolve(__dirname, "..", "lib", "SBE-FULL-FIX44.xml");

const globalAny = globalThis as unknown as { DOMParser?: typeof DOMParser };
if (!globalAny.DOMParser) {
    globalAny.DOMParser = DOMParser;
}

async function main() {

  const orchestraXml = readFileSync(inputPath, "utf8");
  const schemaXml = orchestraToSbeFullSchema(orchestraXml);
  writeFileSync(outputPath, schemaXml);

  console.log(`[sbe-node] generated schema: ${outputPath}`);
}

main().catch((error) => {
  console.error("[sbe-node] schema generation failed:", error);
  process.exitCode = 1;
});
