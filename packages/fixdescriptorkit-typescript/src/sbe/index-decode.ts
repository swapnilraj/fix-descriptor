import { readFileSync } from "fs";
import { resolve } from "path";

import { decodeFromInput } from "./decode";

(async () => {
    const inputPath = resolve("test", "sbe", "test-decode-repeating-group.json");
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

    console.log(
        "decoded",
        JSON.stringify(
            result,
            (_key, value) => (typeof value === "bigint" ? value.toString() : value),
            2,
        ),
    );
})().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
});
