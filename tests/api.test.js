// Pruebas: npm test
const test = require('node:test');
const assert = require('node:assert');
const LP = require('../public/js/lp-core.js');
const app = require('../server/server.js');

test('ejemplo M1: θ2/T = 1 − 1.171e^(−0.382t) + 0.171e^(−2.618t)', () => {
  const r1 = [1, 2, 1], r2 = [1, 3, 2], c = [1, 2];
  const det = LP.psub(LP.pmul(r1, r2), LP.pmul(c, c));
  const a = LP.analyze(c, det);
  assert.ok(Math.abs(a.finalValue - 1) < 1e-6);
  const exps = a.terms.filter((t) => t.kind === 'exp' && t.p !== 0).map((t) => [t.p, t.coef]).sort((x, y) => y[0] - x[0]);
  assert.ok(Math.abs(exps[0][0] + 0.382) < 1e-3 && Math.abs(exps[0][1] + 1.171) < 1e-3);
  assert.ok(Math.abs(exps[1][0] + 2.618) < 1e-3 && Math.abs(exps[1][1] - 0.171) < 1e-3);
  assert.ok(Math.abs(a.t0) < 1e-9);
});

test('inversa I1: cuatro polos sin i', () => {
  const a = LP.analyze([1, 2], [24, 50, 35, 10, 1]);
  assert.deepStrictEqual(a.groups.map((g) => Math.round(g.p)), [-1, -2, -3, -4]);
  assert.ok(Math.abs(a.t0) < 1e-9);
});

test('API: /api/salud, /api/ejercicios y /api/inversa', async () => {
  const srv = app.listen(0);
  const base = `http://localhost:${srv.address().port}/api`;
  try {
    const s = await (await fetch(base + '/salud')).json();
    assert.strictEqual(s.ok, true);
    const ex = await (await fetch(base + '/ejercicios')).json();
    assert.ok(ex.length >= 3 && ex[0].items.length > 0);
    const inv = await (await fetch(base + '/inversa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ arriba: '2 1', abajo: '1 10 35 50 24' }) })).json();
    assert.strictEqual(inv.polos.length, 4);
    const bad = await fetch(base + '/inversa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"arriba":"x"}' });
    assert.strictEqual(bad.status, 400);
  } finally { srv.close(); }
});
