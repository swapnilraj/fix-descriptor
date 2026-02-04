import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { DOMParser } from "@xmldom/xmldom";
import { orchestraToSbeFullSchema } from "../../web/lib/orchestraToSbe";

const inputPath = resolve(__dirname, "..", "lib", "ORCHESTRAFIX44.xml");
const outputPath = resolve(__dirname, "..", "lib", "SBE-FULL-FIX44.xml");

const globalAny = globalThis as unknown as { DOMParser?: typeof DOMParser };
if (!globalAny.DOMParser) {
    globalAny.DOMParser = DOMParser;
}

const orchestraXml = readFileSync(inputPath, "utf8");
const schemaXml = orchestraToSbeFullSchema(orchestraXml);
writeFileSync(outputPath, schemaXml);

console.log(`[sbe-node] generated schema: ${outputPath}`);
