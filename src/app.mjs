import { parseRecipeMarkdown } from './recipe-parser.mjs';

const RECIPES = [
  { slug: 'carbonara', file: '/recipes/carbonara.md' }
];

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
      button.textContent = 'Done ✅';
      setTimeout(() => {
        button.disabled = false;
        button.textContent = `Start ${toClock(seconds)}`;
      }, 1200);
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
  recipeView.classList.add('hidden');
  recipeView.innerHTML = '';
  setActiveTile('');
}

function renderRecipe(slug, recipe) {
  const saved = JSON.parse(localStorage.getItem(checklistKey(slug)) || '{}');
  recipeView.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'recipe-top';

  const title = document.createElement('h2');
  title.textContent = recipe.title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-view';
  closeBtn.type = 'button';
  closeBtn.textContent = 'Back to gallery';
  closeBtn.addEventListener('click', closeRecipeView);

  top.append(title, closeBtn);

  const img = document.createElement('img');
  img.className = 'recipe-image';
  img.src = recipe.image;
  img.alt = recipe.title;

  const metaParts = [];
  if (typeof recipe.prepTime === 'number') metaParts.push(`<span>Prep: ${recipe.prepTime}m</span>`);
  if (typeof recipe.cookTime === 'number') metaParts.push(`<span>Cook: ${recipe.cookTime}m</span>`);
  if (typeof recipe.servings === 'number') metaParts.push(`<span>Serves: ${recipe.servings}</span>`);

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
      btn.textContent = `Start ${toClock(timer.seconds)}`;
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

  recipeView.append(top, img);
  if (metaParts.length) recipeView.append(meta);
  recipeView.append(ingHeader, ingredients, methodHeader, method, notesHeader, notes);

  recipeView.classList.remove('hidden');
  recipeView.classList.remove('is-entering');
  requestAnimationFrame(() => recipeView.classList.add('is-entering'));
  setActiveTile(slug);
  recipeView.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
