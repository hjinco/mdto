import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "honeypots");
const targetDir = path.join(rootDir, "public");

function copyHoneypots() {
	if (!fs.existsSync(sourceDir)) {
		console.warn(
			`Source directory ${sourceDir} does not exist. Skipping honeypots copy.`,
		);
		return;
	}

	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	const files = fs.readdirSync(sourceDir);

	for (const file of files) {
		const sourcePath = path.join(sourceDir, file);
		const targetPath = path.join(targetDir, file);

		fs.cpSync(sourcePath, targetPath, { recursive: true });
		console.log(`Copied ${file} to public/ (honeypot)`);
	}
}

copyHoneypots();
