/* ============================================
   Achievements App
   ============================================ */

const STORAGE_KEY = 'nuo-achievements';
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];
const RARITY_LABELS = {
  common: '普通', uncommon: '稀有', rare: '珍贵',
  epic: '史诗', legendary: '传说'
};
const RARITY_EMOJIS = {
  common: '🟤', uncommon: '🟢', rare: '🔵',
  epic: '🟣', legendary: '🟠'
};
const CATEGORY_LABELS = {
  life: '生活', study: '学习', explore: '探索',
  skill: '技能', special: '特别'
};
const DEFAULT_ICONS = {
  life: '🌿', study: '📖', explore: '🗺️',
  skill: '🔧', special: '✨'
};

let achievements = [];
let filters = { rarity: 'all', status: 'all' };
let sortDesc = true;
let editingId = null;

/* ===== DOM refs ===== */
const grid = document.getElementById('achievement-grid');
const statTotal = document.getElementById('stat-total').querySelector('.stat-num');
const statCompleted = document.getElementById('stat-completed').querySelector('.stat-num');
const statRate = document.getElementById('stat-rate').querySelector('.stat-num');

const modal = document.getElementById('modal-achievement');
const modalTitle = document.getElementById('modal-title');
const inputId = document.getElementById('input-id');
const inputTitle = document.getElementById('input-title');
const inputDesc = document.getElementById('input-desc');
const inputRarity = document.getElementById('input-rarity');
const inputCategory = document.getElementById('input-category');
const inputIcon = document.getElementById('input-icon');
const btnModalSave = document.getElementById('btn-modal-save');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnAdd = document.getElementById('btn-add');
const btnSort = document.getElementById('btn-sort');
const modalDelete = document.getElementById('modal-delete');
let deleteTargetId = null;

/* ===== Storage ===== */
function loadAchievements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    achievements = raw ? JSON.parse(raw) : getDefaults();
  } catch {
    achievements = getDefaults();
  }
}

function saveAchievements() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
}

function getDefaults() {
  return [
    { id: crypto.randomUUID(), title: '第一篇博客', description: '在 1nuo.me 上发表了第一篇文章', rarity: 'epic', category: 'skill', icon: '📝', completed: false, dateCreated: '2026-05-06' },
    { id: crypto.randomUUID(), title: '高数全过', description: '大一上学期高数考试通过', rarity: 'rare', category: 'study', icon: '📐', completed: true, dateCreated: '2026-01-15', dateCompleted: '2026-01-15' },
  ].sort((a, b) => (b.dateCreated || '').localeCompare(a.dateCreated || ''));
}

/* ===== Rendering ===== */
function render() {
  const filtered = getFiltered();
  updateStats();
  updateSortButton();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p class="empty-state-text">还没有符合条件的成就<br>点击「＋ 新成就」添加吧</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => renderCard(a)).join('');
}

function renderCard(a) {
  const r = a.rarity || 'common';
  const cat = a.category || 'life';
  const rarityLabel = RARITY_LABELS[r] || '普通';
  const icon = a.icon || DEFAULT_ICONS[cat] || '🏅';
  const completedClass = a.completed ? 'completed' : '';
  const dateStr = a.dateCompleted
    ? `✅ ${formatDate(a.dateCompleted)}`
    : a.dateCreated ? formatDate(a.dateCreated) : '';

  return `
    <div class="card ${completedClass}" data-id="${a.id}">
      <div class="card-rarity ${r}">${RARITY_EMOJIS[r] || '🟤'} ${rarityLabel}</div>
      <div class="card-header">
        <span class="card-icon">${icon}</span>
        <h3 class="card-title">${escapeHtml(a.title)}</h3>
      </div>
      ${a.description ? `<p class="card-desc">${escapeHtml(a.description)}</p>` : ''}
      <div class="card-footer">
        <span class="card-category">${CATEGORY_LABELS[cat] || cat}</span>
        <span class="card-date">${dateStr}</span>
      </div>
      <div class="card-actions">
        <button class="card-action-btn" data-action="edit" title="编辑">✎</button>
        <button class="card-action-btn danger" data-action="delete" title="删除">✕</button>
      </div>
    </div>`;
}

function getFiltered() {
  let list = [...achievements];

  // Filter by rarity
  if (filters.rarity !== 'all') {
    list = list.filter(a => a.rarity === filters.rarity);
  }

  // Filter by status
  if (filters.status === 'completed') {
    list = list.filter(a => a.completed);
  } else if (filters.status === 'pending') {
    list = list.filter(a => !a.completed);
  }

  // Sort
  list.sort((a, b) => {
    const da = a.dateCompleted || a.dateCreated || '';
    const db = b.dateCompleted || b.dateCreated || '';
    return sortDesc ? db.localeCompare(da) : da.localeCompare(db);
  });

  return list;
}

function updateStats() {
  const total = achievements.length;
  const completed = achievements.filter(a => a.completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statRate.textContent = rate + '%';
}

function updateSortButton() {
  btnSort.textContent = sortDesc ? '📅 最新' : '📅 最早';
}

/* ===== Modal ===== */
function openAddModal() {
  editingId = null;
  modalTitle.textContent = '新成就';
  inputId.value = '';
  inputTitle.value = '';
  inputDesc.value = '';
  inputRarity.value = 'common';
  inputCategory.value = 'life';
  inputIcon.value = '';
  btnModalSave.textContent = '添加';
  modal.showModal();
  setTimeout(() => inputTitle.focus(), 100);
}

function openEditModal(a) {
  editingId = a.id;
  modalTitle.textContent = '编辑成就';
  inputId.value = a.id;
  inputTitle.value = a.title;
  inputDesc.value = a.description || '';
  inputRarity.value = a.rarity || 'common';
  inputCategory.value = a.category || 'life';
  inputIcon.value = a.icon || '';
  btnModalSave.textContent = '保存';
  modal.showModal();
  setTimeout(() => inputTitle.focus(), 100);
}

function saveFromModal() {
  const title = inputTitle.value.trim();
  if (!title) {
    inputTitle.focus();
    inputTitle.style.borderColor = 'var(--danger)';
    return;
  }
  inputTitle.style.borderColor = '';

  const data = {
    title,
    description: inputDesc.value.trim(),
    rarity: inputRarity.value,
    category: inputCategory.value,
    icon: inputIcon.value.trim(),
  };

  if (editingId) {
    const idx = achievements.findIndex(a => a.id === editingId);
    if (idx !== -1) {
      achievements[idx] = { ...achievements[idx], ...data };
    }
  } else {
    data.id = crypto.randomUUID();
    data.completed = false;
    data.dateCreated = todayStr();
    achievements.unshift(data);
  }

  saveAchievements();
  render();
  modal.close();
}

/* ===== Toggle Complete ===== */
function toggleComplete(id) {
  const a = achievements.find(x => x.id === id);
  if (!a) return;
  a.completed = !a.completed;
  a.dateCompleted = a.completed ? todayStr() : null;
  saveAchievements();
  render();
}

/* ===== Delete ===== */
function confirmDelete(id) {
  deleteTargetId = id;
  modalDelete.showModal();
}

function doDelete() {
  if (!deleteTargetId) return;
  achievements = achievements.filter(a => a.id !== deleteTargetId);
  deleteTargetId = null;
  saveAchievements();
  render();
  modalDelete.close();
}

/* ===== Events ===== */

// Card clicks (toggle + action buttons)
grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;

  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.dataset.action;
    const id = card.dataset.id;
    if (action === 'edit') {
      const a = achievements.find(x => x.id === id);
      if (a) openEditModal(a);
    } else if (action === 'delete') {
      confirmDelete(id);
    }
    return;
  }

  // Toggle completion on card click (not on action buttons)
  toggleComplete(card.dataset.id);
});

// Filter chips
document.querySelectorAll('.filter-chips').forEach(group => {
  group.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    const parent = chip.closest('.filter-chips');
    parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const filterType = parent.id === 'filter-rarity' ? 'rarity' : 'status';
    filters[filterType] = chip.dataset.value;
    render();
  });
});

// Add button
btnAdd.addEventListener('click', openAddModal);

// Sort button
btnSort.addEventListener('click', () => {
  sortDesc = !sortDesc;
  render();
});

// Modal form submit
document.querySelector('.modal-form').addEventListener('submit', e => {
  e.preventDefault();
  saveFromModal();
});

// Modal cancel
btnModalCancel.addEventListener('click', () => modal.close());

// Delete modal
document.getElementById('btn-delete-confirm').addEventListener('click', doDelete);
document.getElementById('btn-delete-cancel').addEventListener('click', () => {
  deleteTargetId = null;
  modalDelete.close();
});

// Close modal on backdrop click
modal.addEventListener('click', e => {
  if (e.target === modal) modal.close();
});
modalDelete.addEventListener('click', e => {
  if (e.target === modalDelete) modalDelete.close();
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.open) modal.close();
  if (e.key === 'Escape' && modalDelete.open) modalDelete.close();
});

/* ===== Utilities ===== */
function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function formatDate(str) {
  if (!str) return '';
  // Show simplified Chinese format
  const parts = str.split('-');
  if (parts.length === 3) return `${parts[0]}/${parts[1]}/${parts[2]}`;
  return str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== Init ===== */
loadAchievements();
render();
