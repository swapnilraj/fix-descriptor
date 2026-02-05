import { readdirSync, statSync } from "fs";
import { resolve } from "path";
import Module from "module";

import { DefaultMutableDirectBuffer } from "../apps/sbe-node-package/agrona-ts/src";
import { XMLParser } from "fast-xml-parser";
import { runGenerator, type GeneratorResult } from "./generator";

export type DecodeArgs = {
    schema?: string;
    encodedMessage?: string;
    messageId?: number;
};

export async function decodeFromInput(args: DecodeArgs): Promise<Record<string, unknown>> {
    if (!args.schema || !args.encodedMessage) {
        throw new Error("schema and encodedMessage are required.");
    }

    const generatorResult = await runGenerator(args.schema);
    return decodeMessage(args.encodedMessage, args.schema, args.messageId, generatorResult);
}

export async function decodeMessage(
    encodedMessage: string,
    schemaXml: string,
    messageId: number | undefined,
    generatorResult: GeneratorResult,
): Promise<Record<string, unknown>> {
    const schema = parseSchema(schemaXml);
    const debug = process.env.SBE_DEBUG_DECODE === "1";
    const log = (...args: unknown[]) => {
        if (debug) {
            console.log("[sbe-decode]", ...args);
        }
    };

    ensureTextDecoderEncoding();
    ensureAgronaAlias();
    const indexPath = findGeneratedIndex(generatorResult.codecsDir);
    const codecs = require(indexPath);

    const bytes = decodeMessageBytes(encodedMessage);
    const buffer = new DefaultMutableDirectBuffer(bytes.length);
    buffer.wrap(bytes);

    const MessageHeaderDecoder = codecs.MessageHeaderDecoder;
    if (!MessageHeaderDecoder) {
        throw new Error("Generated codecs missing MessageHeaderDecoder.");
    }

    const headerDecoder = new MessageHeaderDecoder();
    headerDecoder.wrap(buffer, 0);

    const headerTemplateId = headerDecoder.templateId();
    const headerBlockLength = headerDecoder.blockLength();
    const headerVersion = headerDecoder.version();
    const manualBlockLength = bytes[0] | (bytes[1] << 8);
    const manualTemplateId = bytes[2] | (bytes[3] << 8);
    const manualVersion = bytes[6] | (bytes[7] << 8);

    let templateId = headerTemplateId;
    let blockLength = headerBlockLength;
    let version = headerVersion;
    if (headerTemplateId !== manualTemplateId) {
        console.warn(
            `[sbe-decode] header mismatch: decoder=${headerTemplateId} manual=${manualTemplateId}; using manual`,
        );
        templateId = manualTemplateId;
        blockLength = manualBlockLength;
        version = manualVersion;
    }

    const headerMessage = schema.messagesById.get(String(templateId));
    const effectiveMessageId = headerMessage ? templateId : messageId ?? templateId;
    const message = schema.messagesById.get(String(effectiveMessageId));
    if (!message) {
        throw new Error(`Message id ${effectiveMessageId} not found in schema.`);
    }

    const decoderName = `${message.name}Decoder`;
    const MessageDecoder = codecs[decoderName];
    if (!MessageDecoder) {
        throw new Error(`Generated codecs missing ${decoderName}.`);
    }

    log("header", { templateId, blockLength, version, messageName: message.name });
    log("encodedBytes", bytes.length);
    log("fields", message.orderedFields.length);

    const decoder = new MessageDecoder();
    if (typeof decoder.wrap === "function") {
        decoder.wrap(buffer, MessageHeaderDecoder.ENCODED_LENGTH, blockLength, version);
    } else if (typeof decoder.wrapAndApplyHeader === "function") {
        decoder.wrapAndApplyHeader(buffer, 0, headerDecoder);
    } else {
        throw new Error(`Decoder ${decoderName} does not expose wrap methods.`);
    }

    const decodedFields: Record<string, unknown> = {};
    const actingVersion = typeof decoder.actingVersion === "function" ? decoder.actingVersion() : version;
    let inVariableSection = false;

    for (const field of message.orderedFields) {
        if (field.kind === "data") {
            inVariableSection = true;
        }

        const methodName = lowerFirst(field.name);
        const sinceVersionMethod = decoder[`${methodName}SinceVersion`] as (() => number) | undefined;
        if (typeof sinceVersionMethod === "function" && actingVersion < sinceVersionMethod.call(decoder)) {
            continue;
        }

        try {
            if (field.kind === "data") {
                const value = readDataField(decoder, field.name);
                if (value !== undefined) {
                    decodedFields[field.id] = value;
                }
            } else {
                const getter = decoder[methodName] as (() => unknown) | undefined;
                if (typeof getter !== "function") {
                    continue;
                }
                const value = getter.call(decoder);
                decodedFields[field.id] = value;
            }
        } catch (err) {
            if (
                err instanceof Error &&
                (/boundsCheck/i.test(err.message) || /index=\d+/i.test(err.message))
            ) {
                if (inVariableSection) {
                    break;
                }
                continue;
            }
            throw err;
        }
    }

    const fixMessage = buildFixMessage(message.orderedFields, decodedFields);

    return {
        messageId: effectiveMessageId,
        decodedFields,
        fixMessage,
    };
}

function ensureTextDecoderEncoding(): void {
    const globalAny = globalThis as unknown as {
        TextDecoder?: typeof TextDecoder;
    };
    if (!globalAny.TextDecoder) return;

    const OriginalTextDecoder = globalAny.TextDecoder;
    globalAny.TextDecoder = class PatchedTextDecoder extends OriginalTextDecoder {
        constructor(label?: string, options?: TextDecoderOptions) {
            const normalized = label === "UTF_8" ? "utf-8" : label;
            super(normalized, options);
        }
    };
}

type MessageField = {
    id: string;
    name: string;
    type: string;
    kind: "field" | "data";
};

type MessageDef = {
    name: string;
    fieldsById: Map<string, MessageField>;
    orderedFields: MessageField[];
};

type ParsedSchema = {
    messagesById: Map<string, MessageDef>;
};

function parseSchema(schemaXml: string): ParsedSchema {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        removeNSPrefix: true,
        preserveOrder: true,
    });
    const nodes = parser.parse(schemaXml) as Array<Record<string, unknown>>;
    const messagesById = new Map<string, MessageDef>();

    for (const node of nodes) {
        const schemaNode = node.messageSchema as unknown;
        if (!schemaNode) continue;
        const schemaChildren = Array.isArray(schemaNode) ? schemaNode : Object.values(schemaNode as object);

        for (const child of schemaChildren as Array<Record<string, unknown>>) {
            if (!child.message) continue;
            const messageAttrs = (child[":@"] ?? {}) as Record<string, string>;
            const id = messageAttrs.id;
            const name = messageAttrs.name;
            if (!id || !name) continue;

            const fieldsById = new Map<string, MessageField>();
            const orderedFields: MessageField[] = [];
            const messageChildren = child.message as Array<Record<string, unknown>>;

            for (const msgChild of messageChildren) {
                if (!msgChild.field && !msgChild.data) continue;
                const kind = msgChild.field ? "field" : "data";
                const fieldAttrs = (msgChild[":@"] ?? {}) as Record<string, string>;
                if (!fieldAttrs.id || !fieldAttrs.name || !fieldAttrs.type) continue;
                const entry: MessageField = {
                    id: fieldAttrs.id,
                    name: fieldAttrs.name,
                    type: fieldAttrs.type,
                    kind,
                };
                fieldsById.set(entry.id, entry);
                orderedFields.push(entry);
            }

            messagesById.set(String(id), { name: String(name), fieldsById, orderedFields });
        }
    }

    return { messagesById };
}

function buildFixMessage(orderedFields: MessageField[], decoded: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const field of orderedFields) {
        const raw = decoded[field.id];
        if (raw === null || raw === undefined) continue;
        if (typeof raw === "string" && raw.length === 0) continue;
        if (typeof raw === "number" && (Number.isNaN(raw) || raw === 0)) continue;
        if (typeof raw === "bigint" && raw === 0n) continue;
        const value = typeof raw === "bigint" ? raw.toString() : String(raw);
        parts.push(`${field.id}=${value}`);
    }
    return parts.join("|");
}

function readDataField(decoder: Record<string, unknown>, fieldName: string): string | undefined {
    const methodName = lowerFirst(fieldName);
    const lengthMethod = decoder[`${methodName}Length`] as (() => number) | undefined;
    const getterToArray = decoder[`get${capitalize(fieldName)}ToArray`] as
        | ((dst: Uint8Array, dstOffset: number, length: number) => number)
        | undefined;

    if (typeof lengthMethod !== "function" || typeof getterToArray !== "function") {
        return undefined;
    }

    let length: number;
    try {
        length = lengthMethod.call(decoder);
    } catch (err) {
        if (err instanceof Error && (/boundsCheck/i.test(err.message) || /index=\d+/i.test(err.message))) {
            return undefined;
        }
        throw err;
    }
    if (length <= 0) {
        getterToArray.call(decoder, new Uint8Array(0), 0, 0);
        return "";
    }

    const bytes = new Uint8Array(length);
    const copied = getterToArray.call(decoder, bytes, 0, length);
    const textDecoder = new TextDecoder("utf-8");
    return textDecoder.decode(bytes.subarray(0, copied));
}

function capitalize(value: string): string {
    if (!value) return value;
    return value[0].toUpperCase() + value.slice(1);
}

function decodeMessageBytes(encodedMessage: string): Uint8Array {
    let cleaned = encodedMessage.trim();
    if (cleaned.startsWith("0x") || cleaned.startsWith("0X")) {
        cleaned = cleaned.slice(2);
    }
    const isHexOnly = /^[0-9a-fA-F]+$/.test(cleaned);
    if (isHexOnly && cleaned.length % 2 === 1) {
        cleaned = `0${cleaned}`;
    }
    const isHex = isHexOnly;
    const buffer = isHex ? Buffer.from(cleaned, "hex") : Buffer.from(cleaned, "base64");
    return new Uint8Array(buffer);
}

function lowerFirst(value: string): string {
    if (!value) return value;
    return value[0].toLowerCase() + value.slice(1);
}

function findGeneratedIndex(codecsDir: string): string {
    const rootDir = resolve(codecsDir);
    const queue = [rootDir];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        for (const entry of readdirSync(current)) {
            const fullPath = resolve(current, entry);
            const stats = statSync(fullPath);
            if (stats.isDirectory()) {
                queue.push(fullPath);
                continue;
            }
            if (entry === "index.g.js" || entry === "index.g.ts") {
                return fullPath;
            }
        }
    }

    throw new Error("Generated codecs index.g.{ts,js} not found.");
}

let agronaAliasInstalled = false;
function ensureAgronaAlias(): void {
    if (agronaAliasInstalled) return;
    agronaAliasInstalled = true;

    const moduleAny = Module as unknown as {
        _resolveFilename: (
            request: string,
            parent: unknown,
            isMain: boolean,
            options: unknown,
        ) => string;
    };
    const originalResolve = moduleAny._resolveFilename.bind(Module);
    const agronaPath = resolve(process.cwd(), "agrona-ts", "src", "index.ts");

    moduleAny._resolveFilename = (
        request: string,
        parent: unknown,
        isMain: boolean,
        options: unknown,
    ) => {
        if (request === "agrona") {
            return agronaPath;
        }
        return originalResolve(request, parent, isMain, options);
    };
}
