import { readdirSync, statSync } from "fs";
import { resolve } from "path";
import Module from "module";

import { runGenerator, type GeneratorResult } from "./generator";
import { DefaultMutableDirectBuffer } from "agrona/src";
import { XMLParser } from "fast-xml-parser";

export type Args = {
    schema?: string;
    fixMessage?: string;
    messageId?: number;
};

export async function encodeFromInput(args: Args): Promise<Uint8Array> {
    if (!args.schema || !args.fixMessage || args.messageId == null) {
        throw new Error("schema, fixMessage, and messageId are required.");
    }

    const generatorResult = await runGenerator(args.schema);
    return encodeMessage(args.fixMessage, args.messageId, args.schema, generatorResult);
}

export async function encodeMessage(
    fixMessage: string,
    messageId: number,
    schemaXml: string,
    generatorResult: GeneratorResult,
): Promise<Uint8Array> {
    const schema = parseSchema(schemaXml);
    const message = schema.messagesById.get(String(messageId));
    if (!message) {
        throw new Error(`Message id ${messageId} not found in schema.`);
    }

    ensureAgronaAlias();
    const indexPath = findGeneratedIndex(generatorResult.codecsDir);
    // ts-node/register can load generated .ts directly in CJS mode.
    const codecs = require(indexPath);

    const messageEncoderName = `${message.name}Encoder`;
    const MessageHeaderEncoder = codecs.MessageHeaderEncoder;
    const MessageEncoder = codecs[messageEncoderName];

    if (!MessageHeaderEncoder || !MessageEncoder) {
        throw new Error(`Generated codecs missing ${messageEncoderName} or MessageHeaderEncoder.`);
    }

    const buffer = new DefaultMutableDirectBuffer(1024 + fixMessage.length * 4);
    const headerEncoder = new MessageHeaderEncoder();
    const encoder = new MessageEncoder();

    encoder.wrapAndApplyHeader(buffer, 0, headerEncoder);

    const fixFields = parseFixMessage(fixMessage);

    // Encode fixed-length fields first, in schema order.
    for (const field of message.orderedFields) {
        if (field.kind !== "field") continue;
        const raw = fixFields.get(field.id);
        if (raw === undefined) continue;

        const methodName = lowerFirst(field.name);
        const setter = encoder[methodName] as ((value: unknown) => void) | undefined;
        if (typeof setter !== "function") continue;

        const coerced = coerceValue(raw, field, schema.typeByName);
        setter.call(encoder, coerced);
    }

    // Encode variable-length fields in schema order, writing empty values when missing.
    for (const field of message.orderedFields) {
        if (field.kind !== "data") continue;
        const raw = fixFields.get(field.id) ?? "";
        const methodName = lowerFirst(field.name);
        const setter = encoder[methodName] as ((value: unknown) => void) | undefined;
        if (typeof setter === "function") {
            setter.call(encoder, raw);
            continue;
        }

        const arraySetter = encoder[
            `put${field.name}ToArray`
        ] as ((src: Array<number>, srcOffset: number, length: number) => void) | undefined;
        if (typeof arraySetter === "function") {
            const bytes = new TextEncoder().encode(raw);
            arraySetter.call(encoder, Array.from(bytes), 0, bytes.length);
        }
    }

    const length = encoder.getLimit();
    return buffer.byteArray().slice(0, length);
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
    typeByName: Map<string, string>;
};

function parseSchema(schemaXml: string): ParsedSchema {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        removeNSPrefix: true,
        allowBooleanAttributes: true,
    });
    const parsed = parser.parse(schemaXml);
    const schema = parsed.messageSchema ?? parsed["sbe:messageSchema"] ?? parsed;

    const typeByName = new Map<string, string>();
    const typesNode = schema.types ?? {};
    for (const type of toArray(typesNode.type)) {
        if (type?.name && type?.primitiveType) {
            typeByName.set(String(type.name), String(type.primitiveType));
        }
    }
    for (const en of toArray(typesNode.enum)) {
        if (en?.name && en?.encodingType) {
            typeByName.set(String(en.name), String(en.encodingType));
        }
    }

    const messagesById = new Map<string, MessageDef>();
    for (const message of toArray(schema.message)) {
        const id = message?.id;
        const name = message?.name;
        if (!id || !name) continue;

        const fieldsById = new Map<string, MessageField>();
        const orderedFields: MessageField[] = [];
        for (const field of toArray(message.field)) {
            if (field?.id && field?.name && field?.type) {
                const entry: MessageField = {
                    id: String(field.id),
                    name: String(field.name),
                    type: String(field.type),
                    kind: "field",
                };
                fieldsById.set(entry.id, entry);
                orderedFields.push(entry);
            }
        }
        for (const data of toArray(message.data)) {
            if (data?.id && data?.name && data?.type) {
                const entry: MessageField = {
                    id: String(data.id),
                    name: String(data.name),
                    type: String(data.type),
                    kind: "data",
                };
                fieldsById.set(entry.id, entry);
                orderedFields.push(entry);
            }
        }

        messagesById.set(String(id), { name: String(name), fieldsById, orderedFields });
    }

    applyPreserveOrder(schemaXml, messagesById);
    return { messagesById, typeByName };
}

function toArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function applyPreserveOrder(schemaXml: string, messagesById: Map<string, MessageDef>): void {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        removeNSPrefix: true,
        preserveOrder: true,
    });
    const nodes = parser.parse(schemaXml) as Array<Record<string, unknown>>;
    const schemaNode = nodes.find((node) => node.messageSchema) as
        | { messageSchema?: unknown }
        | undefined;
    if (!schemaNode?.messageSchema) return;

    const schemaChildren = Array.isArray(schemaNode.messageSchema)
        ? schemaNode.messageSchema
        : Object.values(schemaNode.messageSchema as object);

    for (const child of schemaChildren as Array<Record<string, unknown>>) {
        if (!child.message) continue;
        const messageAttrs = (child[":@"] ?? {}) as Record<string, string>;
        const id = messageAttrs.id;
        if (!id) continue;
        const messageDef = messagesById.get(String(id));
        if (!messageDef) continue;

        const orderedFields: MessageField[] = [];
        const messageChildren = child.message as Array<Record<string, unknown>>;
        for (const msgChild of messageChildren) {
            if (!msgChild.field && !msgChild.data) continue;
            const fieldAttrs = (msgChild[":@"] ?? {}) as Record<string, string>;
            const fieldId = fieldAttrs.id;
            if (!fieldId) continue;
            const field = messageDef.fieldsById.get(String(fieldId));
            if (field) {
                orderedFields.push(field);
            }
        }

        if (orderedFields.length > 0) {
            messageDef.orderedFields = orderedFields;
        }
    }
}

function parseFixMessage(fixMessage: string): Map<string, string> {
    const normalized = fixMessage.replace(/\u0001/g, "|");
    const fields = new Map<string, string>();
    for (const part of normalized.split("|")) {
        if (!part) continue;
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        const tag = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (tag) fields.set(tag, value);
    }
    return fields;
}

function lowerFirst(value: string): string {
    if (!value) return value;
    return value[0].toLowerCase() + value.slice(1);
}

function coerceValue(
    rawValue: string,
    field: MessageField,
    typeByName: Map<string, string>,
): string | number | bigint {
    if (field.kind === "data") {
        return rawValue;
    }

    const primitive = resolvePrimitiveType(field.type, typeByName);
    if (!primitive) {
        return rawValue;
    }

    if (primitive === "char") {
        if (rawValue.length === 1 && isNaN(Number(rawValue))) {
            return rawValue.charCodeAt(0);
        }
        return Number.parseInt(rawValue, 10);
    }

    if (primitive === "float" || primitive === "double") {
        return Number.parseFloat(rawValue);
    }

    if (primitive === "int64" || primitive === "uint64") {
        if (rawValue.includes(".")) {
            const scaled = Math.round(Number.parseFloat(rawValue) * 1e8);
            return BigInt(scaled);
        }
        return BigInt(rawValue);
    }

    if (primitive.startsWith("int") || primitive.startsWith("uint")) {
        return Number.parseInt(rawValue, 10);
    }

    return rawValue;
}

function resolvePrimitiveType(typeName: string, typeByName: Map<string, string>): string | null {
    if (
        typeName === "char" ||
        typeName === "int8" ||
        typeName === "int16" ||
        typeName === "int32" ||
        typeName === "int64" ||
        typeName === "uint8" ||
        typeName === "uint16" ||
        typeName === "uint32" ||
        typeName === "uint64" ||
        typeName === "float" ||
        typeName === "double"
    ) {
        return typeName;
    }

    return typeByName.get(typeName) ?? null;
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
