const { MongoClient } = require('mongodb');
let client;
exports.getDb = async () => {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  if (!client) client = new MongoClient(process.env.MONGODB_URI).connect();
  return (await client).db(process.env.MONGODB_DB || 'presupuesto');
};
// "2026-11" -> rango de fechas ISO [inicio, fin)
exports.rango = (mes) => {
  const m = /^\d{4}-\d{2}$/.test(mes || '') ? mes : new Date().toISOString().slice(0, 7);
  const [y, mm] = m.split('-').map(Number);
  const f = (a, b) => `${a}-${String(b).padStart(2, '0')}-01`;
  return { mes: m, ini: f(y, mm), fin: mm === 12 ? f(y + 1, 1) : f(y, mm + 1) };
};
exports.run = (fn) => async (req, res) => {
  try { await fn(req, res, await exports.getDb()); }
  catch (e) { res.status(500).json({ error: e.message }); }
};
