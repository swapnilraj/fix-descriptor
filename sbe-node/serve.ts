import { createServer } from "http";

import { decodeFromInput, type DecodeArgs } from "./decode";
import { encodeFromInput, type Args as EncodeArgs } from "./encode";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

type JsonValue = Record<string, unknown>;

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method !== "POST") {
        res.writeHead(405, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Only POST supported." }));
        return;
    }

    try {
        if (url.pathname === "/encode") {
            const body = (await readJson(req)) as EncodeArgs;
            const encoded = await encodeFromInput({
                schema: body.schema,
                fixMessage: body.fixMessage,
                messageId: body.messageId,
            });
            res.writeHead(200, { "content-type": "application/json" });
            res.end(
                JSON.stringify({
                    encodedBytes: encoded.length,
                    encodedHex: Buffer.from(encoded).toString("hex"),
                }),
            );
            return;
        }

        if (url.pathname === "/decode") {
            const body = (await readJson(req)) as DecodeArgs;
            const result = await decodeFromInput({
                schema: body.schema,
                encodedMessage: body.encodedMessage,
                messageId: body.messageId,
            });
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(result));
            return;
        }

        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Not found." }));
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: message }));
    }
});

server.listen(port, () => {
    console.log(`[sbe-node] listening on ${port}`);
});

function readJson(req: NodeJS.ReadableStream, maxBytes = 10 * 1024 * 1024): Promise<JsonValue> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let total = 0;

        req.on("data", (chunk) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            total += buffer.length;
            if (total > maxBytes) {
                reject(new Error("Request body too large."));
                return;
            }
            chunks.push(buffer);
        });

        req.on("end", () => {
            try {
                const raw = Buffer.concat(chunks).toString("utf8");
                resolve(JSON.parse(raw) as JsonValue);
            } catch (err) {
                reject(err);
            }
        });

        req.on("error", reject);
    });
}
