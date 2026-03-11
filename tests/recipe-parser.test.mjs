import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecipeMarkdown, validateRecipeMarkdown } from '../src/recipe-parser.mjs';
import { readFile } from 'node:fs/promises';

const sample = await readFile(new URL('../recipes/carbonara.md', import.meta.url), 'utf8');

test('parse valid recipe markdown', () => {
  const parsed = parseRecipeMarkdown(sample);
  assert.equal(parsed.title, 'Spaghetti Carbonara');
  assert.equal(parsed.ingredients.length, 5);
  assert.equal(parsed.method[0].timers[0].seconds, 600);
  assert.deepEqual(parsed.notes, ['Use pasta water to loosen sauce.', 'Grind pepper fresh at the end.']);
});

test('optional prep/cook/servings may be omitted', () => {
  const optionalRemoved = sample
    .replace(/^prepTime:.*\n/m, '')
    .replace(/^cookTime:.*\n/m, '')
    .replace(/^servings:.*\n/m, '');

  const parsed = parseRecipeMarkdown(optionalRemoved);
  assert.equal(parsed.prepTime, undefined);
  assert.equal(parsed.cookTime, undefined);
  assert.equal(parsed.servings, undefined);
  assert.equal(parsed.title, 'Spaghetti Carbonara');
});

test('validate catches invalid optional numeric value', () => {
  const bad = sample.replace(/^prepTime:\s*\d+/m, 'prepTime: soon');
  const result = validateRecipeMarkdown(bad);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /prepTime must be a number when provided/);
});

test('validate catches missing required section', () => {
  const bad = sample.replace('## Notes', '## Extra');
  const result = validateRecipeMarkdown(bad);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /Missing required section: Notes/);
});
