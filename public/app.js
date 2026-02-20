const API = '/api';

// Soat widget
function soatniYangilash() {
  const now = new Date();
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
soatniYangilash();
setInterval(soatniYangilash, 1000);

function escapeHtml(t) {
  if (!t) return '';
  const div = document.createElement('div');
  div.textContent = t;
  return div.innerHTML;
}

// Filter — widget tugmalari
let joriyFilter = null; // null = barchasi, 'muhim', '1_hafta', '2_hafta', '3_hafta'

function filterMurojaatlar(data) {
  if (!joriyFilter) return data;
  if (joriyFilter === 'muhim') return data.filter(m => m.muhim);
  const now = new Date();
  const kunlar = { '1_hafta': 7, '2_hafta': 14, '3_hafta': 21 }[joriyFilter] || 0;
  if (!kunlar) return data;
  const chegara = new Date(now);
  chegara.setDate(chegara.getDate() - kunlar);
  return data.filter(m => {
    const sana = m.yaratilgan ? new Date(m.yaratilgan) : (m.sana ? new Date(m.sana) : null);
    return sana && sana >= chegara;
  });
}

function widgetlarniYangilash() {
  document.querySelectorAll('.widget').forEach(w => {
    w.classList.toggle('active', w.dataset.filter === joriyFilter);
  });
}

// Murojaatlar
async function murojaatlarYuklash() {
  const list = document.getElementById('murojaatlar-list');
  try {
    const res = await fetch(API + '/murojaatlar');
    const data = await res.json();
    const filtered = filterMurojaatlar(data);
    list.innerHTML = filtered.length === 0
      ? '<p class="empty">Murojaatlar yo\'q</p>'
      : filtered.map(m => {
        const vaqt = m.kiritilganVaqt || (m.yaratilgan ? new Date(m.yaratilgan).toLocaleTimeString('uz-UZ', { hour12: false }) : '');
        return `
        <div class="item ${m.muhim ? 'muhim-item' : ''}">
          <div class="item-content">
            <h3>${escapeHtml(m.sarlavha)}</h3>
            <p>${escapeHtml(m.matn)}</p>
            <div class="item-meta">${m.sana || ''} ${vaqt ? '• ' + vaqt : ''}</div>
          </div>
          <div class="item-actions">
            <button type="button" class="muhim-btn ${m.muhim ? 'muhim' : ''}" onclick="murojaatMuhimOzgartir(${m.id}, ${m.muhim})">
              ${m.muhim ? 'Muhim' : 'Muhim emas'}
            </button>
            <button class="btn btn-danger btn-small" onclick="murojaatOchirish(${m.id})">O'chirish</button>
          </div>
        </div>
      `; }).join('');
  } catch (e) {
    list.innerHTML = '<p class="empty">Murojaatlar yo\'q</p>';
  }
  widgetlarniYangilash();
}

function widgetBosildi(filter) {
  joriyFilter = joriyFilter === filter ? null : filter;
  murojaatlarYuklash();
}

async function murojaatMuhimOzgartir(id, joriyMuhim) {
  await fetch(API + '/murojaatlar/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ muhim: !joriyMuhim })
  });
  murojaatlarYuklash();
}

async function murojaatOchirish(id) {
  if (!confirm('O\'chirishni xohlaysizmi?')) return;
  await fetch(API + '/murojaatlar/' + id, { method: 'DELETE' });
  murojaatlarYuklash();
}

// FAB — yangi murojaat qo'shish
const fabBtn = document.getElementById('fab-add');
const modalMurojaat = document.getElementById('modal-murojaat');
const murojaatForm = document.getElementById('murojaat-form');

fabBtn.addEventListener('click', () => {
  modalMurojaat.classList.remove('hidden');
  murojaatForm.reset();
  murojaatForm.sana.value = new Date().toISOString().slice(0, 10);
});

document.getElementById('modal-murojaat-close').addEventListener('click', () => modalMurojaat.classList.add('hidden'));
modalMurojaat.addEventListener('click', (e) => {
  if (e.target === modalMurojaat) modalMurojaat.classList.add('hidden');
});

murojaatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  await fetch(API + '/murojaatlar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sarlavha: f.sarlavha.value.trim(),
      matn: f.matn.value.trim(),
      sana: f.sana.value || new Date().toISOString().slice(0, 10),
      muhim: f.muhim && f.muhim.checked
    })
  });
  modalMurojaat.classList.add('hidden');
  murojaatlarYuklash();
});

murojaatlarYuklash();
