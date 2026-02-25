const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Murojaatlar papkasi va eski umumiy fayl
const MUROJATLAR_DIR = path.join(__dirname, 'murojatlar');
const LEGACY_MUROJATLAR_FILE = path.join(MUROJATLAR_DIR, 'murojatlar.json');

function ensureMurojaatlarDir() {
  if (!fs.existsSync(MUROJATLAR_DIR)) fs.mkdirSync(MUROJATLAR_DIR, { recursive: true });
}

function getMurojaatFilePath(id) {
  return path.join(MUROJATLAR_DIR, `${id}.json`);
}

function migrateLegacyFileIfNeeded() {
  ensureMurojaatlarDir();
  if (!fs.existsSync(LEGACY_MUROJATLAR_FILE)) return;

  const itemFiles = fs.readdirSync(MUROJATLAR_DIR).filter(name => name.endsWith('.json') && name !== 'murojatlar.json');
  if (itemFiles.length > 0) return;

  try {
    const raw = fs.readFileSync(LEGACY_MUROJATLAR_FILE, 'utf8').trim();
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const legacyItems = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.murojaatlar) ? parsed.murojaatlar : []);
    legacyItems.forEach((item) => {
      if (!item || item.id === undefined || item.id === null) return;
      fs.writeFileSync(getMurojaatFilePath(item.id), JSON.stringify(item, null, 2));
    });
  } catch (err) {
    // Eski fayl noto'g'ri bo'lsa ham API ishlashda davom etadi.
  }
}

function readMurojaatlar() {
  ensureMurojaatlarDir();
  migrateLegacyFileIfNeeded();

  try {
    const files = fs.readdirSync(MUROJATLAR_DIR).filter(name => name.endsWith('.json') && name !== 'murojatlar.json');
    const items = [];

    files.forEach((fileName) => {
      try {
        const fullPath = path.join(MUROJATLAR_DIR, fileName);
        const raw = fs.readFileSync(fullPath, 'utf8').trim();
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          items.push(parsed);
        }
      } catch (err) {
        // Noto'g'ri bitta fayl umumiy ro'yxatni buzmasin.
      }
    });

    return items.sort((a, b) => {
      const at = a && a.yaratilgan ? new Date(a.yaratilgan).getTime() : 0;
      const bt = b && b.yaratilgan ? new Date(b.yaratilgan).getTime() : 0;
      return bt - at;
    });
  } catch (err) {
    return [];
  }
}

function readMurojaatById(id) {
  const filePath = getMurojaatFilePath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
}

function writeMurojaat(item) {
  ensureMurojaatlarDir();
  fs.writeFileSync(getMurojaatFilePath(item.id), JSON.stringify(item, null, 2));
}

// ============ MUROJAATLAR API (har bir murojaat alohida .json) ============

// Hammasini olish
app.get('/api/murojaatlar', (req, res) => {
  const murojaatlar = readMurojaatlar();
  res.json(murojaatlar);
});

// Yangi qo'shish
app.post('/api/murojaatlar', (req, res) => {
  const now = new Date();
  const murojaat = {
    id: Date.now(),
    sarlavha: req.body.sarlavha || '',
    matn: req.body.matn || '',
    sana: req.body.sana || now.toISOString().slice(0, 10),
    muhim: !!req.body.muhim,
    yaratilgan: now.toISOString(),
    kiritilganVaqt: now.toLocaleTimeString('uz-UZ', { hour12: false })
  };
  writeMurojaat(murojaat);
  res.json(murojaat);
});

// Yangilash
app.put('/api/murojaatlar/:id', (req, res) => {
  const oldItem = readMurojaatById(req.params.id);
  if (!oldItem) return res.status(404).json({ xato: 'Topilmadi' });

  const updated = { ...oldItem, ...req.body, id: oldItem.id };
  writeMurojaat(updated);
  res.json(updated);
});

// O'chirish
app.delete('/api/murojaatlar/:id', (req, res) => {
  const filePath = getMurojaatFilePath(req.params.id);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ oqibat: 'o\'chirildi' });
});

// Asosiy sahifa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlayapti`);
});
