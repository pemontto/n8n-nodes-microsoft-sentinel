const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('npm package should exclude non-runtime build artifacts', () => {
	const workspaceRoot = path.join(__dirname, '..');
	const npmCacheDir = path.join(os.tmpdir(), 'npm-cache-n8n-sentinel-tests');
	const output = execFileSync(
		'npm',
		['pack', '--dry-run', '--json'],
		{
			cwd: workspaceRoot,
			env: {
				...process.env,
				npm_config_cache: npmCacheDir,
			},
			encoding: 'utf8',
		},
	);
	const packResult = JSON.parse(output);
	assert.equal(Array.isArray(packResult), true);
	assert.equal(packResult.length > 0, true);

	const filePaths = packResult[0].files.map((entry) => entry.path);
	const forbiddenPrefixes = [
		'dist/example-versioned-node/',
		'dist/examplenode/',
		'dist/images/',
	];
	const forbiddenExactPaths = ['dist/tsconfig.tsbuildinfo'];

	for (const forbiddenPrefix of forbiddenPrefixes) {
		const hasForbiddenPrefix = filePaths.some((filePath) => filePath.startsWith(forbiddenPrefix));
		assert.equal(hasForbiddenPrefix, false, `Unexpected publish artifact prefix: ${forbiddenPrefix}`);
	}

	for (const forbiddenPath of forbiddenExactPaths) {
		const hasForbiddenPath = filePaths.includes(forbiddenPath);
		assert.equal(hasForbiddenPath, false, `Unexpected publish artifact path: ${forbiddenPath}`);
	}
});
