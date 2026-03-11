import { parseRecipeMarkdown } from './recipe-parser.mjs';

const RECIPES = [{ slug: 'carbonara', file: '/recipes/carbonara.md' }];

const recipeList = document.querySelector('#recipe-list');
const recipeView = document.querySelector('#recipe-view');

function toClock(totalSeconds) {
  const min = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const sec = String(totalSeconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function startTimer(button, seconds) {
  button.disabled = true;
  let remaining = seconds;
  button.textContent = `⏳ ${toClock(remaining)}`;
  const interval = setInterval(() => {
    remaining -= 1;
    button.textContent = `⏳ ${toClock(Math.max(remaining, 0))}`;
    if (remaining <= 0) {
      clearInterval(interval);
      button.textContent = '✅';
      setTimeout(() => {
        button.disabled = false;
        button.textContent = `⏱ ${toClock(seconds)}`;
      }, 900);
    }
  }, 1000);
}

function checklistKey(slug) {
  return `recipe-checklist:${slug}`;
}

function setActiveTile(slug) {
  for (const tile of document.querySelectorAll('.recipe-tile')) {
    tile.classList.toggle('active', tile.dataset.slug === slug);
  }
}

function closeRecipeView() {
  document.body.classList.remove('recipe-open');
  setActiveTile('');
}

function renderRecipe(slug, recipe) {
  const saved = JSON.parse(localStorage.getItem(checklistKey(slug)) || '{}');
  recipeView.classList.remove('hidden');
  recipeView.innerHTML = '';

  const panel = document.createElement('article');
  panel.className = 'recipe-panel';

  const top = document.createElement('div');
  top.className = 'recipe-top';

  const back = document.createElement('button');
  back.className = 'icon-btn';
  back.type = 'button';
  back.title = 'Back to recipes';
  back.setAttribute('aria-label', 'Back to recipes');
  back.textContent = '←';
  back.addEventListener('click', closeRecipeView);

  const title = document.createElement('h2');
  title.textContent = recipe.title;
  top.append(back, title);

  const img = document.createElement('img');
  img.className = 'recipe-image';
  img.src = recipe.image;
  img.alt = recipe.title;

  const metaParts = [];
  if (typeof recipe.prepTime === 'number') metaParts.push(`<span>⏲ ${recipe.prepTime}m</span>`);
  if (typeof recipe.cookTime === 'number') metaParts.push(`<span>🔥 ${recipe.cookTime}m</span>`);
  if (typeof recipe.servings === 'number') metaParts.push(`<span>🍽 ${recipe.servings}</span>`);

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.innerHTML = metaParts.join('');

  const ingHeader = document.createElement('h3');
  ingHeader.textContent = 'Ingredients';
  const ingredients = document.createElement('ul');
  ingredients.className = 'ingredients';

  recipe.ingredients.forEach((item, idx) => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = Boolean(saved[idx]);
    check.addEventListener('change', () => {
      saved[idx] = check.checked;
      localStorage.setItem(checklistKey(slug), JSON.stringify(saved));
    });
    label.append(check, ` ${item.text}`);
    li.append(label);
    ingredients.append(li);
  });

  const methodHeader = document.createElement('h3');
  methodHeader.textContent = 'Method';
  const method = document.createElement('ol');
  method.className = 'method';

  recipe.method.forEach((step) => {
    const li = document.createElement('li');
    const stepText = document.createElement('span');
    stepText.textContent = step.text.replace(/\s*\[timer:\d+[smh]\]/g, '');
    li.append(stepText);
    for (const timer of step.timers) {
      const btn = document.createElement('button');
      btn.className = 'timer-btn';
      btn.textContent = `⏱ ${toClock(timer.seconds)}`;
      btn.addEventListener('click', () => startTimer(btn, timer.seconds));
      li.append(btn);
    }
    method.append(li);
  });

  const notesHeader = document.createElement('h3');
  notesHeader.textContent = 'Notes';
  const notes = document.createElement('ul');
  for (const note of recipe.notes) {
    const li = document.createElement('li');
    li.textContent = note;
    notes.append(li);
  }

  panel.append(top, img);
  if (metaParts.length) panel.append(meta);
  panel.append(ingHeader, ingredients, methodHeader, method, notesHeader, notes);
  recipeView.append(panel);

  document.body.classList.add('recipe-open');
  setActiveTile(slug);
}

async function init() {
  for (const entry of RECIPES) {
    const raw = await fetch(entry.file).then((r) => r.text());
    const parsed = parseRecipeMarkdown(raw);

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'recipe-tile';
    btn.dataset.slug = entry.slug;
    btn.type = 'button';
    btn.innerHTML = `
      <img class="tile-image" src="${parsed.image}" alt="${parsed.title}" />
      <div class="tile-copy">
        <div class="slug">${entry.slug}</div>
        <div class="title">${parsed.title}</div>
      </div>`;
    btn.addEventListener('click', () => renderRecipe(entry.slug, parsed));

    li.append(btn);
    recipeList.append(li);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}

init();
