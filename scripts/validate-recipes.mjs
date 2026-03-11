import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateRecipeMarkdown } from '../src/recipe-parser.mjs';

const recipesDir = new URL('../recipes', import.meta.url);
const files = (await readdir(recipesDir)).filter((f) => f.endsWith('.md'));

if (!files.length) {
  console.error('No recipe markdown files found in recipes/.');
  process.exit(1);
}

let hasErrors = false;
for (const file of files) {
  const fullPath = join(recipesDir.pathname, file);
  const raw = await readFile(fullPath, 'utf8');
  const result = validateRecipeMarkdown(raw);
  if (!result.valid) {
    hasErrors = true;
    console.error(`✖ ${file}: ${result.errors.join('; ')}`);
  } else {
    console.log(`✔ ${file}: valid (${result.recipe.ingredients.length} ingredients, ${result.recipe.method.length} steps)`);
  }
}

if (hasErrors) process.exit(1);
