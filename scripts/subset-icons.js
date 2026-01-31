import fs from "fs";
import path from "path";
import { Font } from "fonteditor-core";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ================= CONFIG =================

// Font Awesome source fonts
const FONT_CONFIGS = [
    {
        name: "solid",
        input: path.resolve(ROOT, "./src/webfonts/solid.ttf"),
        output: path.resolve(ROOT, "./src/webfonts/solid-icons.ttf"),
    },
    {
        name: "regular",
        input: path.resolve(ROOT, "./src/webfonts/regular.ttf"),
        output: path.resolve(ROOT, "./src/webfonts/regular-icons.ttf"),
    }
];

// Where to scan for icon usage
const SCAN_DIRS = [
    path.resolve(ROOT, "src/styles"),
    path.resolve(ROOT, "src"),
];

// Allowed file extensions
const EXT_OK = new Set([
    ".js", ".jsx", ".ts", ".tsx",
    ".css", ".scss",
    ".html"
]);

// ==========================================


// Recursively walk directories
function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            const skip = ["node_modules", ".next", "dist", "build", "controller", "database", "data"];
            if (!skip.includes(entry.name)) {
                walk(full, out);
            }
        } else {
            out.push(full);
        }
    }

    return out;
}

// Extract \fxxx, \e31b etc
function extractUnicodes(text) {
    const re = /\\([0-9a-fA-F]{3,5})/g;
    const out = new Set();
    let m;

    while ((m = re.exec(text))) {
        out.add(parseInt(m[1], 16));
    }

    return out;
}

// Scan project for used icons
function getUsedUnicodes() {
    const files = SCAN_DIRS
        .flatMap(dir => walk(dir))
        .filter(f => EXT_OK.has(path.extname(f)));

    const used = new Set();

    for (const file of files) {
        const text = fs.readFileSync(file, "utf8");
        console.log(`🔍 Scanning ${file}`);
        extractUnicodes(text).forEach(u => used.add(u));
    }

    return used;
}

// Subset a single font
function subsetFont({ name, input, output }, usedCodes) {
    if (!fs.existsSync(input)) {
        console.warn(`⚠️ ${name}: source font not found, skipping`);
        return;
    }

    const buffer = fs.readFileSync(input);
    const font = Font.create(buffer, { type: "ttf" });
    const data = font.get();

    data.glyf = data.glyf.filter(
        g => g.unicode && g.unicode.some(u => usedCodes.has(u))
    );

    if (data.glyf.length === 0) {
        console.warn(`⚠️ ${name}: no glyphs used`);
        return;
    }

    const out = Font.create(data).write({ type: "ttf" });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, Buffer.from(out));

    console.log(`✅ ${name} subset generated (${data.glyf.length} glyphs)`);
}

// Main
function main() {
    console.log("🔍 Scanning for Font Awesome icon usage...");
    const usedCodes = getUsedUnicodes();

    [...usedCodes]
    .sort((a, b) => a - b)
    .forEach(u => {
        console.log(`U+${u.toString(16).toUpperCase().padStart(4, "0")}`);
    });

    if (usedCodes.size === 0) {
        console.warn("⚠️ No icon unicodes found. Nothing generated.");
        process.exit(0);
    }

    console.log(`📦 Found ${usedCodes.size} used icon unicodes`);

    for (const fontCfg of FONT_CONFIGS) {
        subsetFont(fontCfg, usedCodes);
    }
}

main();
