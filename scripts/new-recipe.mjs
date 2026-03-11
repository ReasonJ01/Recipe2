import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, extname, join } from 'node:path';

export function buildEmptyCompliantRecipeTemplate(slug) {
  return `---
title: "${slug}"
image: "/icons/${slug}.svg"
prepTime: 0
cookTime: 0
servings: 0
---

## Ingredients
- [ ] TODO ingredient

## Method
1. TODO step description.

## Notes
- TODO note
`;
}

export async function createRecipeFile(filename) {
  if (!filename || !filename.trim()) {
    throw new Error('Please provide a filename. Example: npm run new-recipe -- my-new-recipe.md');
  }

  let target = filename.trim();
  if (!extname(target)) target += '.md';
  if (extname(target) !== '.md') {
    throw new Error('Recipe filename must end with .md');
  }

  const slug = basename(target, '.md');
  const recipesDir = join(process.cwd(), 'recipes');
  const fullPath = join(recipesDir, target);

  try {
    await access(fullPath, constants.F_OK);
    throw new Error(`Recipe already exists: recipes/${target}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await mkdir(recipesDir, { recursive: true });
  await writeFile(fullPath, buildEmptyCompliantRecipeTemplate(slug), 'utf8');
  return `recipes/${target}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createRecipeFile(process.argv[2])
    .then((path) => {
      console.log(`Created ${path}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
