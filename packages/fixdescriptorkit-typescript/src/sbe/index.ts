import { readFileSync } from "fs";
import { resolve } from "path";

import { encodeFromInput } from "./encode";

const inputPath = process.argv[2] ?? "./test/sbe/test-encode-repeating-group.json";
const fallbackPath = process.argv[3] ?? "../../sbe-lambda-encoder/test-encode-treasury-full.json";
const resolvedPath = resolve(process.cwd(), inputPath);
let input: { schema?: string; fixMessage?: string; messageId?: number };
try {
    input = JSON.parse(readFileSync(resolvedPath, "utf8"));
} catch {
    const resolvedFallback = resolve(process.cwd(), fallbackPath);
    input = JSON.parse(readFileSync(resolvedFallback, "utf8"));
}

encodeFromInput({
    schema: input.schema,
    fixMessage: input.fixMessage,
    messageId: input.messageId,
})
    .then((result: Uint8Array) => {
        console.log("encodedBytes", result.length);
        console.log("encodedHex", Buffer.from(result).toString("hex"));
    })
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    });
