import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const distClientPath = resolve(root, "dist/client");
const outputPath = resolve(root, ".output");

function main() {
	// Check if dist/client exists
	if (!existsSync(distClientPath)) {
		console.error(`✗ Error: ${distClientPath} does not exist`);
		process.exit(1);
	}

	// Create .output directory if it doesn't exist
	if (!existsSync(outputPath)) {
		mkdirSync(outputPath, { recursive: true });
		console.log(`✓ Created .output directory`);
	} else {
		// Clear existing .output directory
		rmSync(outputPath, { recursive: true, force: true });
		mkdirSync(outputPath, { recursive: true });
		console.log(`✓ Cleared existing .output directory`);
	}

	// Copy dist/client contents to .output
	cpSync(distClientPath, outputPath, {
		recursive: true,
		force: true,
	});

	console.log(`✓ Moved contents from dist/client to .output`);
}

main();
