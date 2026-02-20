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

// Murojaatlar fayli
const MUROJATLAR_FILE = path.join(__dirname, 'murojatlar', 'murojatlar.json');

// Murojaatlar (murojatlar/1_hafta.json)
function readMurojaatlar() {
  try {
    const dir = path.dirname(MUROJATLAR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(MUROJATLAR_FILE)) {
      writeMurojaatlar([]);
      return [];
    }
    const raw = fs.readFileSync(MUROJATLAR_FILE, 'utf8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.murojaatlar)) return parsed.murojaatlar;
    return [];
  } catch (err) {
    return [];
  }
}

function writeMurojaatlar(arr) {
  const dir = path.dirname(MUROJATLAR_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MUROJATLAR_FILE, JSON.stringify(arr, null, 2));
}

// ============ MUROJAATLAR API (murojatlar.json) ============

// Hammasini olish
app.get('/api/murojaatlar', (req, res) => {
  const murojaatlar = readMurojaatlar();
  res.json(murojaatlar);
});

// Yangi qo'shish
app.post('/api/murojaatlar', (req, res) => {
  let murojaatlar = readMurojaatlar();
  if (!Array.isArray(murojaatlar)) murojaatlar = [];
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
  murojaatlar.push(murojaat);
  writeMurojaatlar(murojaatlar);
  res.json(murojaat);
});

// Yangilash
app.put('/api/murojaatlar/:id', (req, res) => {
  const murojaatlar = readMurojaatlar() || [];
  const idx = murojaatlar.findIndex(m => m.id == req.params.id);
  if (idx === -1) return res.status(404).json({ xato: 'Topilmadi' });
  murojaatlar[idx] = { ...murojaatlar[idx], ...req.body };
  writeMurojaatlar(murojaatlar);
  res.json(murojaatlar[idx]);
});

// O'chirish
app.delete('/api/murojaatlar/:id', (req, res) => {
  const murojaatlar = (readMurojaatlar() || []).filter(m => m.id != req.params.id);
  writeMurojaatlar(murojaatlar);
  res.json({ oqibat: 'o\'chirildi' });
});

// Asosiy sahifa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlayapti`);
});
