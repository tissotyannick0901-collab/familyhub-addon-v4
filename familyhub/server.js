'use strict';
const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const PORT    = parseInt(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH        || '/data/familyhub.db';
const SECRET  = process.env.SECRET         || '';

// ── Base de données ───────────────────────────────────────────────
const dbDir = path.dirname(DB_PATH);
if(!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, {recursive:true});
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS store (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT
)`);

// ── Express ───────────────────────────────────────────────────────
const app = express();
app.use(express.json({limit:'20mb'}));

// ── CORS ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if(req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Auth ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  if(!SECRET) return next();
  const h = (req.headers.authorization || '').replace('Bearer ', '');
  if(h === SECRET) return next();
  res.status(401).json({ok:false, error:'Non autorisé'});
};

const ok  = (res, d={}) => res.json({ok:true,  ...d});
const err = (res, m, c=500) => res.status(c).json({ok:false, error:m});

// ── Health ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  ok(res, {version:'4.0.0', time:new Date().toISOString()});
});

// ── Données ───────────────────────────────────────────────────────
app.get('/api/data', auth, (req, res) => {
  const row = db.prepare('SELECT value, updated_at FROM store WHERE key=?').get('familyhub');
  if(!row) return ok(res, {data:{}, updated_at:null});
  try { ok(res, {data:JSON.parse(row.value), updated_at:row.updated_at}); }
  catch(e) { err(res, 'Données corrompues'); }
});

app.post('/api/data', auth, (req, res) => {
  if(!req.body || typeof req.body !== 'object') return err(res, 'Corps invalide', 400);
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO store(key,value,updated_at) VALUES(?,?,?)').run(
    'familyhub', JSON.stringify(req.body), now
  );
  ok(res, {saved:true, updated_at:now});
});

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ok:false, error:`Route inconnue: ${req.method} ${req.path}`})
);

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FamilyHub API v4.0.0 | port ${PORT} | auth ${SECRET?'oui':'non'}`);
});
process.on('SIGTERM', () => { db.close(); process.exit(0); });
process.on('SIGINT',  () => { db.close(); process.exit(0); });
