const REQUIRED_FRONTMATTER = ["title", "image"];
const OPTIONAL_NUMERIC_FRONTMATTER = ["prepTime", "cookTime", "servings"];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error("Missing frontmatter block delimited by ---");

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx === -1) throw new Error(`Invalid frontmatter line: ${line}`);
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    frontmatter[key] = value;
  }

  for (const key of REQUIRED_FRONTMATTER) {
    if (!frontmatter[key]) throw new Error(`Missing required frontmatter key: ${key}`);
  }

  for (const key of OPTIONAL_NUMERIC_FRONTMATTER) {
    if (frontmatter[key] === undefined || frontmatter[key] === "") continue;
    const parsed = Number(frontmatter[key]);
    if (Number.isNaN(parsed)) {
      throw new Error(`${key} must be a number when provided`);
    }
    frontmatter[key] = parsed;
  }

  return { frontmatter, body: raw.slice(match[0].length) };
}

function getSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\n)## ${escaped}\\n([\\s\\S]*?)(?=\\n## |\\s*$)`);
  const match = body.match(re);
  if (!match) throw new Error(`Missing required section: ${heading}`);
  return match[1].trim();
}

function parseIngredients(section) {
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Ingredients section cannot be empty");
  return lines.map((line) => {
    const match = line.match(/^- \[( |x)\] (.+)$/i);
    if (!match) throw new Error(`Invalid ingredient line, expected '- [ ] item': ${line}`);
    return { text: match[2].trim(), checked: match[1].toLowerCase() === "x" };
  });
}

function parseMethod(section) {
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Method section cannot be empty");
  return lines.map((line, i) => {
    const stepMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (!stepMatch) throw new Error(`Invalid method step format: ${line}`);
    const stepNum = Number(stepMatch[1]);
    if (stepNum !== i + 1) throw new Error(`Method step numbering must be sequential. Expected ${i + 1} but found ${stepNum}`);

    const content = stepMatch[2];
    const timers = [...content.matchAll(/\[timer:(\d+)(s|m|h)\]/g)].map((m) => ({
      raw: m[0], value: Number(m[1]), unit: m[2],
      seconds: m[2] === "h" ? Number(m[1]) * 3600 : m[2] === "m" ? Number(m[1]) * 60 : Number(m[1])
    }));

    return {
      step: stepNum,
      text: content,
      timers,
      ingredientMentions: [...content.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1])
    };
  });
}

function parseNotes(section) {
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Notes section cannot be empty");
  return lines.map((line) => line.replace(/^-\s*/, "").trim());
}

export function parseRecipeMarkdown(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    ...frontmatter,
    ingredients: parseIngredients(getSection(body, "Ingredients")),
    method: parseMethod(getSection(body, "Method")),
    notes: parseNotes(getSection(body, "Notes"))
  };
}

export function validateRecipeMarkdown(raw) {
  try {
    const recipe = parseRecipeMarkdown(raw);
    return { valid: true, recipe, errors: [] };
  } catch (error) {
    return { valid: false, recipe: null, errors: [error.message] };
  }
}
