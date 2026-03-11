import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('new-recipe script creates compliant markdown file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'recipe2-'));
  try {
    const { stdout } = await execFileAsync('node', ['/workspace/Recipe2/scripts/new-recipe.mjs', 'test-recipe.md'], { cwd: dir });
    assert.match(stdout, /Created recipes\/test-recipe.md/);

    const created = await readFile(join(dir, 'recipes', 'test-recipe.md'), 'utf8');
    assert.match(created, /^---/);
    assert.match(created, /## Ingredients/);
    assert.match(created, /## Method/);
    assert.match(created, /## Notes/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
