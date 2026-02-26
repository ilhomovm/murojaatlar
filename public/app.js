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

function murojaatMaqsadVaqtiniOlish(m) {
  const vaqtOnly = /^\d{2}:\d{2}(:\d{2})?$/;
  const vaqtToliq = m.vaqt && /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(m.vaqt);

  if (vaqtToliq) {
    const d = new Date(m.vaqt);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const sanaPart = m.sana || (m.vaqt && /^\d{4}-\d{2}-\d{2}$/.test(m.vaqt) ? m.vaqt : '');
  const vaqtPartRaw = m.kiritilganVaqt || (m.vaqt && vaqtOnly.test(m.vaqt) ? m.vaqt : '');
  const vaqtPart = vaqtPartRaw ? (vaqtPartRaw.length === 5 ? `${vaqtPartRaw}:00` : vaqtPartRaw) : '00:00:00';
  const raw = sanaPart ? `${sanaPart}T${vaqtPart}` : (m.yaratilgan || '');
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function qolganVaqtMatni(dateObj) {
  if (!dateObj) return '';
  const diffSec = Math.floor((dateObj.getTime() - Date.now()) / 1000);
  if (diffSec <= 0) return 'Vaqt tugadi';

  const kun = Math.floor(diffSec / 86400);
  const soat = Math.floor((diffSec % 86400) / 3600);
  const daqiqa = Math.floor((diffSec % 3600) / 60);
  const soniya = diffSec % 60;

  if (kun > 0) return `${kun} kun ${soat} soat qoldi`;
  return `${soat} soat ${daqiqa} daqiqa ${soniya} soniya qoldi`;
}

function murojaatVaqtlariniYangilash() {
  document.querySelectorAll('.item-elapsed[data-ts]').forEach((el) => {
    const ts = Number(el.dataset.ts || 0);
    if (!ts) return;
    el.textContent = qolganVaqtMatni(new Date(ts));
  });
}

// Filter — widget tugmalari
let joriyFilter = null; // null = barchasi, 'muhim', '1_hafta', '2_hafta', '3_hafta'
let joriyTab = 'murojaatlar';

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

function renderMurojaatItem(m) {
  const maqsadSana = murojaatMaqsadVaqtiniOlish(m);
  const maqsadTs = maqsadSana ? maqsadSana.getTime() : '';
  const vaqt = m.kiritilganVaqt || (maqsadSana ? maqsadSana.toLocaleTimeString('uz-UZ', { hour12: false }) : '');
  const matn = m.matn ?? m.mazmun ?? '';

  return `
    <div class="item ${m.muhim ? 'muhim-item' : ''} ${m.bajarilgan ? 'bajarilgan-item' : ''}">
      <div class="item-content">
        <h3>${escapeHtml(m.sarlavha)}</h3>
        <p>${escapeHtml(matn)}</p>
        <div class="item-meta">
          <span class="item-meta-left">${m.sana || ''} ${vaqt ? '• ' + vaqt : ''}</span>
        </div>
      </div>
      <div class="item-actions">
        <div class="item-actions-top">
          <button type="button" class="muhim-btn ${m.muhim ? 'muhim' : ''}" onclick="murojaatMuhimOzgartir(${m.id}, ${m.muhim})">
            ${m.muhim ? 'Muhim' : 'Muhim emas'}
          </button>
          <button type="button" class="bajarildi-btn ${m.bajarilgan ? 'active' : ''}" onclick="murojaatBajarilganOzgartir(${m.id}, ${m.bajarilgan})">
            ${m.bajarilgan ? 'Qaytarish' : 'Bajarildi'}
          </button>
          <button class="btn btn-danger btn-small" onclick="murojaatOchirish(${m.id})">O'chirish</button>
        </div>
        ${maqsadTs ? '<span class="item-elapsed item-elapsed-side" data-ts="' + maqsadTs + '"></span>' : ''}
      </div>
    </div>
  `;
}

// Murojaatlar
async function murojaatlarYuklash() {
  const faolList = document.getElementById('murojaatlar-list');
  const bajarilganList = document.getElementById('bajarilgan-list');
  try {
    const res = await fetch(API + '/murojaatlar');
    const data = await res.json();
    const faolFiltered = filterMurojaatlar(data).filter((m) => !m.bajarilgan);
    const bajarilgan = data.filter((m) => !!m.bajarilgan);

    if (faolList) {
      faolList.innerHTML = faolFiltered.length === 0
        ? '<p class="empty">Murojaatlar yo\'q</p>'
        : `
        <div class="list-group">
          <h3 class="list-title">Faol</h3>
          ${faolFiltered.map(renderMurojaatItem).join('')}
        </div>
      `;
    }

    if (bajarilganList) {
      bajarilganList.innerHTML = bajarilgan.length === 0
        ? '<p class="empty">Bajarilgan murojaatlar yo\'q</p>'
        : `
        <div class="list-group completed-section">
          <h3 class="list-title">Bajarilgan</h3>
          ${bajarilgan.map(renderMurojaatItem).join('')}
        </div>
      `;
    }
  } catch (e) {
    if (faolList) faolList.innerHTML = '<p class="empty">Murojaatlar yo\'q</p>';
    if (bajarilganList) bajarilganList.innerHTML = '<p class="empty">Bajarilgan murojaatlar yo\'q</p>';
  }
  murojaatVaqtlariniYangilash();
  widgetlarniYangilash();
}

function tabniAlmashtir(tab) {
  joriyTab = tab;
  document.querySelectorAll('.sidebar-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.content-section').forEach((section) => {
    section.classList.remove('active');
  });
  const aktivSection = document.getElementById(`${tab}-section`);
  if (aktivSection) aktivSection.classList.add('active');

  if (tab !== 'murojaatlar') {
    joriyFilter = null;
  }
  if (fabBtn) {
    fabBtn.style.display = tab === 'murojaatlar' ? 'flex' : 'none';
  }
  murojaatlarYuklash();
}

function widgetBosildi(filter) {
  if (joriyTab !== 'murojaatlar') return;
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

async function murojaatBajarilganOzgartir(id, joriyBajarilgan) {
  await fetch(API + '/murojaatlar/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bajarilgan: !joriyBajarilgan })
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
document.querySelectorAll('.sidebar-link').forEach((btn) => {
  btn.addEventListener('click', () => tabniAlmashtir(btn.dataset.tab));
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
      muhim: f.muhim && f.muhim.checked,
      bajarilgan: false
    })
  });
  modalMurojaat.classList.add('hidden');
  murojaatlarYuklash();
});

tabniAlmashtir('murojaatlar');
setInterval(murojaatVaqtlariniYangilash, 1000);
