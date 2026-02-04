import { readFileSync } from "fs";
import { resolve } from "path";

import { decodeFromInput } from "./decode";

(async () => {
    const inputPath = resolve("test", "test-decode-treasury-full.json");
    const raw = readFileSync(inputPath, "utf-8");
    const data = JSON.parse(raw) as {
        schema?: string;
        encodedMessage?: string;
        messageId?: number;
    };

    const result = await decodeFromInput({
        schema: data.schema,
        encodedMessage: data.encodedMessage,
        messageId: data.messageId,
    });

    console.log("decoded", result);
})().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
});
