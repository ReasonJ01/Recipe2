# Recipe Repository (Static + PWA)

A static recipe site designed for Cloudflare Pages.

## Features

- Recipes written in markdown (`recipes/*.md`)
- Strict parser for a recipe format:
  - frontmatter (required: `title`, `image`; optional: `prepTime`, `cookTime`, `servings`)
  - `## Ingredients` with checklist rows (`- [ ] item`)
  - `## Method` numbered steps and optional timer tokens (`[timer:10m]`)
  - `## Notes`
- Timer buttons rendered from method tokens
- Ingredient checklist persisted in `localStorage`
- Progressive Web App support via `manifest.webmanifest` and `sw.js`

## Local dev

```bash
npm run validate
npm test
npm run start
```

Create a new compliant recipe template:

```bash
npm run new-recipe -- my-new-recipe.md
```

Then open <http://localhost:4173>.

## Add a new recipe

1. Generate a compliant starter file with `npm run new-recipe -- <slug>.md` (or create manually using `recipes/carbonara.md` as reference).
2. Add image assets to `/icons` (or another public path) and reference with an absolute URL path in frontmatter.
3. Run:

```bash
npm run validate
```

## Cloudflare Pages

- Framework preset: **None**
- Build command: *(empty)*
- Build output directory: `/`

Because this is static HTML/CSS/JS, Cloudflare can deploy directly from the repo.
