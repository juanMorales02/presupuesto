const { ObjectId } = require('mongodb');
const { run } = require('./_lib');
module.exports = run(async (req, res, db) => {
  const col = db.collection('deudas');
  if (req.method === 'GET') return res.json(await col.find().sort({ fechaLimite: 1 }).toArray());
  if (req.method === 'POST') {
    const { acreedor, concepto, tipo, monto, fecha, fechaLimite, categoria } = req.body || {};
    if (!['Préstamo', 'Deuda'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
    if (!acreedor || !fecha || !(Number(monto) > 0)) return res.status(400).json({ error: 'Datos incompletos' });
    const r = await col.insertOne({ acreedor, concepto: concepto || '', tipo, monto: Number(monto),
      fecha, fechaLimite: fechaLimite || '', categoria: categoria === 'Banco' ? 'Banco' : '', abonos: [] });
    return res.status(201).json({ _id: r.insertedId });
  }
  // PATCH ?id=...  body {monto, fecha}  -> registra un abono
  if (req.method === 'PATCH') {
    const { monto, fecha } = req.body || {};
    if (!(Number(monto) > 0)) return res.status(400).json({ error: 'Monto inválido' });
    await col.updateOne({ _id: new ObjectId(req.query.id) },
      { $push: { abonos: { monto: Number(monto), fecha: fecha || new Date().toISOString().slice(0, 10) } } });
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await col.deleteOne({ _id: new ObjectId(req.query.id) });
    return res.json({ ok: true });
  }
  res.status(405).end();
});
