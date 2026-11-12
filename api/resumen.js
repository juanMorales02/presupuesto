const { run, rango } = require('./_lib');
// queda = ingresos + préstamos recibidos - necesidades - gustos - ahorros - abonos a deudas (del mes)
module.exports = run(async (req, res, db) => {
  const { mes, ini, fin } = rango(req.query.mes);
  const movs = await db.collection('movimientos').find({ fecha: { $gte: ini, $lt: fin } }).toArray();
  const deudas = await db.collection('deudas').find().toArray();
  const sum = (t) => movs.filter((m) => m.tipo === t).reduce((a, m) => a + m.monto, 0);
  const enMes = (f) => f >= ini && f < fin;
  const prestamos = deudas.filter((d) => d.tipo === 'Préstamo' && enMes(d.fecha)).reduce((a, d) => a + d.monto, 0);
  const abonos = deudas.flatMap((d) => d.abonos || []).filter((a) => enMes(a.fecha)).reduce((a, x) => a + x.monto, 0);
  const ingresos = sum('Ingreso') + prestamos;
  const gastos = { Necesidad: sum('Necesidad'), Gusto: sum('Gusto'), Ahorro: sum('Ahorro') };
  const queda = ingresos - gastos.Necesidad - gastos.Gusto - gastos.Ahorro - abonos;
  const faltaDeudas = deudas.filter((d) => d.categoria !== 'Banco').reduce((a, d) => a + d.monto - (d.abonos || []).reduce((x, y) => x + y.monto, 0), 0);
  res.json({ mes, ingresos, prestamos, gastos, abonos, queda, faltaDeudas,
    porcentajeQueda: ingresos > 0 ? Math.max(0, Math.min(1, queda / ingresos)) : 0 });
});
