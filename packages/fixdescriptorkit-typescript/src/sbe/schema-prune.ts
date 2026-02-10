import { XMLBuilder, XMLParser } from "fast-xml-parser";

type XmlRoot = Record<string, unknown>;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
});

const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    format: false,
    suppressEmptyNode: true,
});

export function pruneSchemaToMessage(schemaXml: string, messageId: number): string {
    const parsed = parser.parse(schemaXml) as XmlRoot;
    const rootKey = parsed["sbe:messageSchema"] ? "sbe:messageSchema" : "messageSchema";
    const root = parsed[rootKey] as XmlRoot | undefined;
    if (!root) {
        return schemaXml;
    }

    const messageKey = root["sbe:message"] ? "sbe:message" : "message";
    const messages = toArray(root[messageKey]);
    if (messages.length === 0) {
        return schemaXml;
    }

    const target = messages.find((message) => {
        const attrs = (message ?? {}) as Record<string, unknown>;
        return String(attrs.id) === String(messageId);
    });
    if (!target) {
        throw new Error(`Message id ${messageId} not found in schema.`);
    }

    root[messageKey] = target;

    const xmlBody = builder.build({ [rootKey]: root });
    const trimmed = schemaXml.trimStart();
    const xmlDecl = trimmed.startsWith("<?xml")
        ? trimmed.split(/\r?\n/)[0]
        : '<?xml version="1.0" encoding="UTF-8"?>';

    return `${xmlDecl}\n${xmlBody}`;
}

function toArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}
