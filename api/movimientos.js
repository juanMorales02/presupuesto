const { ObjectId } = require('mongodb');
const { run, rango } = require('./_lib');
const TIPOS = ['Ingreso', 'Necesidad', 'Gusto', 'Ahorro'];
module.exports = run(async (req, res, db) => {
  const col = db.collection('movimientos');
  if (req.method === 'GET') {
    const { ini, fin } = rango(req.query.mes);
    return res.json(await col.find({ fecha: { $gte: ini, $lt: fin } }).sort({ fecha: -1, _id: -1 }).toArray());
  }
  if (req.method === 'POST') {
    const { fecha, descripcion, tipo, monto } = req.body || {};
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return res.status(400).json({ error: 'Fecha inválida' });
    if (!(Number(monto) > 0)) return res.status(400).json({ error: 'Monto inválido' });
    const r = await col.insertOne({ fecha, descripcion: descripcion || '', tipo, monto: Number(monto) });
    return res.status(201).json({ _id: r.insertedId });
  }
  if (req.method === 'DELETE') {
    await col.deleteOne({ _id: new ObjectId(req.query.id) });
    return res.json({ ok: true });
  }
  res.status(405).end();
});
