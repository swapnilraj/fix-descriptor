import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

export type GeneratorResult = {
    codecsDir: string;
    namespace: string;
};

const isLogEnabled = process.env.SBE_LOG === "1";
const log = (...args: unknown[]) => {
    if (isLogEnabled) {
        console.log("[sbe-generator]", ...args);
    }
};

export function findLocalJar(): string | undefined {
    const candidates = [
        resolve(process.cwd(), "simple-binary-encoding", "sbe-all", "build", "libs"),
        resolve(process.cwd(), "simple-binary-encoding", "sbe-tool", "build", "libs"),
    ];

    for (const dir of candidates) {
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir);
        const sbeAll = files.find((f) => f.startsWith("sbe-all-") && f.endsWith(".jar"));
        if (sbeAll) return join(dir, sbeAll);
        const sbeTool = files.find((f) => f.startsWith("sbe-tool-") && f.endsWith(".jar"));
        if (sbeTool) return join(dir, sbeTool);
    }

    return undefined;
}

export async function runGenerator(schemaXml: string): Promise<GeneratorResult> {
    const started = Date.now();
    const jarPath = process.env.SBE_TOOL_JAR || findLocalJar();
    if (!jarPath) {
        throw new Error(
            "sbe-ts: could not find sbe-tool jar. Provide --jar or set SBE_TOOL_JAR, or build sbe-tool locally.",
        );
    }

    const outputDir = process.env.SBE_OUTPUT_DIR || "generated";
    mkdirSync(outputDir, { recursive: true });
    const schemaPath = resolveSchemaPath(schemaXml, outputDir);
    const javaCmd = process.env.JAVA || "java";
    const cmdArgs = [
        `-Dsbe.output.dir=${outputDir}`,
        "-Dsbe.target.language=TypeScript",
        "-Dsbe.target.namespace=fix",
        "-cp",
        jarPath,
        "uk.co.real_logic.sbe.SbeTool",
        schemaPath,
    ];

    log("start", {
        jarPath,
        outputDir,
        schemaPath,
        schemaBytes: schemaXml.length,
        cmd: [javaCmd, ...cmdArgs].join(" "),
    });
    const result = spawnSync(javaCmd, cmdArgs, { stdio: "inherit" });
    log("exit", { status: result.status, durationMs: Date.now() - started });
    if (result.status !== 0) {
        throw new Error(`sbe-ts: generator failed with status ${result.status ?? "unknown"}`);
    }

    return { codecsDir: outputDir, namespace: "fix" };
}

function resolveSchemaPath(schemaXml: string, outputDir: string): string {
    const trimmed = schemaXml.trim();
    if (trimmed.startsWith("<")) {
        const path = join(outputDir, "schema.xml");
        writeFileSync(path, schemaXml);
        return path;
    }
    return schemaXml;
}
