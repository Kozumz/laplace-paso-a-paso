/* ===== Núcleo matemático (sin DOM) =====
   Lo usan el navegador (variable global LP) y el servidor Node (require).
   Polinomios como arreglos: el índice es la potencia de s. */
var LP = (function () {
  'use strict';
  // ---------- números ----------
  function fmt(x, d) {
    if (d === undefined) d = 3;
    if (!isFinite(x)) return '?';
    var f = Math.pow(10, d);
    var r = Math.round(x * f) / f;
    if (Math.abs(r) < 0.5 / f) return '0';
    var s = r.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  function near(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-9) * (1 + Math.abs(a) + Math.abs(b)); }

  // ---------- complejos ----------
  function C(re, im) { return { re: re, im: im || 0 }; }
  function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
  function csub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function cmul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cdiv(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function conj(a) { return C(a.re, -a.im); }

  // ---------- polinomios (índice = potencia de s) ----------
  function trim(p) { p = p.slice(); while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-12) p.pop(); if (!p.length) p = [0]; return p; }
  function deg(p) { p = trim(p); return (p.length === 1 && Math.abs(p[0]) < 1e-12) ? -1 : p.length - 1; }
  function isZero(p) { return deg(p) < 0; }
  function lc(p) { p = trim(p); return p[p.length - 1]; }
  function padd(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0)); return trim(r); }
  function pscale(p, k) { return trim(p.map(function (c) { return c * k; })); }
  function psub(a, b) { return padd(a, pscale(b, -1)); }
  function pmul(a, b) { var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(0); for (var i2 = 0; i2 < a.length; i2++) for (var j = 0; j < b.length; j++) r[i2 + j] += a[i2] * b[j]; return trim(r); }
  function peval(p, x) { var v = 0; for (var k = p.length - 1; k >= 0; k--) v = v * x + p[k]; return v; }
  function pevalC(p, z) { var v = C(0, 0); for (var k = p.length - 1; k >= 0; k--) v = cadd(cmul(v, z), C(p[k], 0)); return v; }
  function pder(p) { var r = []; for (var k = 1; k < p.length; k++) r.push(k * p[k]); return r.length ? r : [0]; }
  function pdiv(n, d) {
    n = trim(n).slice(); d = trim(d);
    var dn = deg(n), dd = deg(d);
    if (dn < dd) return { q: [0], r: n };
    var q = []; for (var i = 0; i <= dn - dd; i++) q.push(0);
    for (var k = dn - dd; k >= 0; k--) {
      var c = n[k + dd] / d[dd]; q[k] = c;
      for (var j = 0; j <= dd; j++) n[k + j] -= c * d[j];
    }
    var r = n.slice(0, dd); if (!r.length) r = [0];
    return { q: trim(q), r: trim(r) };
  }
  function pFromRoots(rts, lead) {
    var p = [lead === undefined ? 1 : lead];
    rts.forEach(function (z) {
      if (Math.abs(z.im) < 1e-12) p = pmul(p, [-z.re, 1]);
      else if (z.im > 0) p = pmul(p, [z.re * z.re + z.im * z.im, -2 * z.re, 1]);
    });
    return p;
  }
  function taylor(p, a) { // coeficientes de p(a+h)
    var res = [], q = p.slice(), fact = 1;
    for (var k = 0; k < p.length; k++) { if (k > 0) fact *= k; res.push(peval(q, a) / fact); q = pder(q); }
    return res;
  }

  // ---------- raíces ----------
  function roots(p) {
    p = trim(p);
    var n = deg(p); var out = [];
    if (n <= 0) return out;
    var z0 = 0; while (z0 < n && Math.abs(p[z0]) < 1e-12) z0++;
    for (var i = 0; i < z0; i++) out.push(C(0, 0));
    var q = p.slice(z0); var m = q.length - 1;
    if (m <= 0) return out;
    var L = q[m]; var a = q.map(function (c) { return c / L; });
    if (m === 1) { out.push(C(-a[0], 0)); return out; }
    if (m === 2) {
      var b = a[1], c = a[0], disc = b * b - 4 * c;
      if (disc >= 0) { var sq = Math.sqrt(disc); var r1 = (-b - (b >= 0 ? sq : -sq)) / 2; var r2 = Math.abs(r1) > 1e-300 ? c / r1 : (-b + sq) / 2; if (disc === 0) r2 = r1 = -b / 2; out.push(C(r1, 0), C(r2, 0)); }
      else { var w = Math.sqrt(-disc) / 2; out.push(C(-b / 2, w), C(-b / 2, -w)); }
      return out;
    }
    var R = 1; for (var k = 0; k < m; k++) R = Math.max(R, 1 + Math.abs(a[k]));
    var z = []; for (var k2 = 0; k2 < m; k2++) { var ang = 2 * Math.PI * k2 / m + 0.4; z.push(C(0.6 * R * Math.cos(ang), 0.6 * R * Math.sin(ang))); }
    for (var it = 0; it < 2000; it++) {
      var maxd = 0;
      for (var k3 = 0; k3 < m; k3++) {
        var num = pevalC(a, z[k3]); var den = C(1, 0);
        for (var j = 0; j < m; j++) if (j !== k3) den = cmul(den, csub(z[k3], z[j]));
        if (cabs(den) < 1e-300) den = C(1e-12, 0);
        var dz = cdiv(num, den); z[k3] = csub(z[k3], dz); maxd = Math.max(maxd, cabs(dz) / (1 + cabs(z[k3])));
      }
      if (maxd < 1e-15) break;
    }
    var da = pder(a);
    z = z.map(function (w) {
      for (var i = 0; i < 6; i++) {
        var f = pevalC(a, w), fp = pevalC(da, w);
        if (cabs(fp) < 1e-13) break;
        var w2 = csub(w, cdiv(f, fp));
        if (cabs(pevalC(a, w2)) < cabs(f)) w = w2; else break;
      }
      if (Math.abs(w.im) < 1e-6 * (1 + Math.abs(w.re))) w = C(w.re, 0);
      return w;
    });
    // pares conjugados exactos
    var used = z.map(function () { return false; });
    for (var i2 = 0; i2 < z.length; i2++) {
      if (used[i2] || z[i2].im <= 0) continue;
      var best = -1, bd = Infinity;
      for (var j2 = 0; j2 < z.length; j2++) if (!used[j2] && j2 !== i2 && z[j2].im < 0) { var d = cabs(csub(z[j2], conj(z[i2]))); if (d < bd) { bd = d; best = j2; } }
      if (best >= 0) {
        var re = (z[i2].re + z[best].re) / 2, im = (z[i2].im - z[best].im) / 2;
        z[i2] = C(re, im); z[best] = C(re, -im); used[i2] = used[best] = true;
      }
    }
    return out.concat(z);
  }
  function sameRoot(a, b, tol) { return cabs(csub(a, b)) <= (tol || 1e-5) * (1 + cabs(a)); }
  // agrupa: [{type:'real',p,m,roots:[..]} | {type:'pair',re,im,m,roots:[..]}]
  function groupRoots(rts) {
    var g = []; var used = rts.map(function () { return false; });
    for (var i = 0; i < rts.length; i++) {
      if (used[i]) continue; var z = rts[i];
      if (z.im < -1e-12) continue; // el conjugado lo trae el de parte imaginaria positiva
      var members = [i]; used[i] = true;
      for (var j = 0; j < rts.length; j++) if (!used[j] && rts[j].im >= -1e-12 && sameRoot(z, rts[j], 2e-4)) { members.push(j); used[j] = true; }
      var mult = members.length;
      var mre = 0, mim = 0; members.forEach(function (k) { mre += rts[k].re; mim += rts[k].im; }); mre /= mult; mim /= mult;
      if (Math.abs(mim) < 1e-9) {
        if (Math.abs(mre) < 1e-9) mre = 0;
        var rr = []; for (var q = 0; q < mult; q++) rr.push(C(mre, 0));
        g.push({ type: 'real', p: mre, m: mult, roots: rr });
      } else {
        // marcar conjugados como usados
        var need = mult;
        for (var j2 = 0; j2 < rts.length && need > 0; j2++) if (!used[j2] && rts[j2].im < 0 && sameRoot(conj(z), rts[j2], 2e-4)) { used[j2] = true; need--; }
        var rr2 = []; for (var q2 = 0; q2 < mult; q2++) { rr2.push(C(mre, mim)); rr2.push(C(mre, -mim)); }
        g.push({ type: 'pair', re: mre, im: mim, m: mult, roots: rr2 });
      }
    }
    // orden: el 0 primero, luego reales de más cerca a más lejos, luego pares
    g.sort(function (a, b) {
      var ka = a.type === 'real' ? (a.p === 0 ? 0 : 1) : 2, kb = b.type === 'real' ? (b.p === 0 ? 0 : 1) : 2;
      if (ka !== kb) return ka - kb;
      var va = a.type === 'real' ? Math.abs(a.p) : Math.abs(a.re), vb = b.type === 'real' ? Math.abs(b.p) : Math.abs(b.re);
      return va - vb;
    });
    return g;
  }
  function groupPoly(g) { // factor mónico del grupo (sin multiplicidad)
    return g.type === 'real' ? [-g.p, 1] : [g.re * g.re + g.im * g.im, -2 * g.re, 1];
  }

  // ---------- fracciones parciales ----------
  // r/Dm con Dm mónico = prod de los grupos
  function partial(r, groups) {
    var out = [];
    groups.forEach(function (g, gi) {
      var others = []; groups.forEach(function (h, hi) { if (hi !== gi) others = others.concat(h.roots); });
      if (g.type === 'real') {
        var Q = pFromRoots(others, 1);
        var nT = taylor(r, g.p), qT = taylor(Q, g.p);
        var gser = [];
        for (var k = 0; k < g.m; k++) {
          var s = nT[k] || 0;
          for (var j = 1; j <= k; j++) s -= (qT[j] || 0) * gser[k - j];
          gser.push(s / qT[0]);
        }
        var coefs = []; for (var kk = 1; kk <= g.m; kk++) coefs.push(gser[g.m - kk]); // coefs[k-1] -> 1/(s-p)^k
        out.push({ g: g, type: 'real', coefs: coefs, Qp: peval(Q, g.p), Np: peval(r, g.p) });
      } else {
        if (g.m > 1) { out.push({ g: g, type: 'pair', unsupported: true }); return; }
        var p = C(g.re, g.im);
        var den = C(1, 0);
        others.forEach(function (w) { den = cmul(den, csub(p, w)); });
        den = cmul(den, csub(p, conj(p)));
        var R = cdiv(pevalC(r, p), den);
        var Cc = 2 * R.re, Dc = -2 * cmul(R, conj(p)).re;
        var a = -g.re, w = g.im;
        out.push({ g: g, type: 'pair', R: R, C: Cc, D: Dc, a: a, w: w, b: -2 * g.re, c: g.re * g.re + g.im * g.im, cosc: Cc, sinc: (Dc - Cc * a) / w });
      }
    });
    return out;
  }

  // matriz del profe: columnas = cada letra; filas = potencias n-1..0
  function profMatrix(Dm, groups, parts, r) {
    var n = deg(Dm); var cols = [], vals = [];
    groups.forEach(function (g, gi) {
      var part = parts[gi];
      if (g.type === 'real') {
        for (var k = 1; k <= g.m; k++) {
          var f = [1]; for (var q = 0; q < k; q++) f = pmul(f, [-g.p, 1]);
          cols.push(pdiv(Dm, f).q); vals.push(part.coefs[k - 1]);
        }
      } else if (!part.unsupported) {
        var base = pdiv(Dm, groupPoly(g)).q;
        cols.push(pmul(base, [0, 1])); vals.push(part.C);
        cols.push(base); vals.push(part.D);
      }
    });
    var rows = [];
    for (var pw = n - 1; pw >= 0; pw--) {
      rows.push({ pw: pw, cells: cols.map(function (c) { return c[pw] || 0; }), rhs: r[pw] || 0 });
    }
    return { rows: rows, vals: vals };
  }

  function letters(i) { return 'ABCDEFGHIJKLMNOP'.charAt(i); }

  // ---------- pipeline completo ----------
  // N, D: polinomios (índice = potencia). Devuelve todo lo necesario para pintar pasos.
  function analyze(N, D) {
    N = trim(N); D = trim(D);
    var res = { N: N, D: D };
    if (isZero(D)) { res.error = 'Abajo quedó 0: revisa los valores (¿todo está en cero?).'; return res; }
    if (isZero(N)) { res.zero = true; return res; }
    var lcD = lc(D), lcN = lc(N);
    res.lcD = lcD; res.lcN = lcN;
    var rD = roots(D), rN = roots(N);
    res.polesAll = groupRoots(rD); res.zerosAll = groupRoots(rN);
    // tachar
    var usedD = rD.map(function () { return false; }); var keepN = [], cancel = [];
    rN.forEach(function (z) {
      var hit = -1;
      for (var j = 0; j < rD.length; j++) if (!usedD[j] && sameRoot(z, rD[j], 1e-5)) { hit = j; break; }
      if (hit >= 0) { usedD[hit] = true; cancel.push(rD[hit]); } else keepN.push(z);
    });
    var keepD = rD.filter(function (_, j) { return !usedD[j]; });
    res.cancelled = groupRoots(cancel);
    var N2, D2;
    if (cancel.length) { N2 = pFromRoots(keepN, lcN); D2 = pFromRoots(keepD, lcD); }
    else { N2 = N; D2 = D; }
    res.N2 = N2; res.D2 = D2;
    var groups = groupRoots(keepD); res.groups = groups;
    var Dm = pscale(D2, 1 / lcD); res.Dm = Dm; res.K = 1 / lcD;
    var r = N2, q = [0];
    if (deg(N2) >= deg(Dm)) { var dv = pdiv(N2, Dm); q = dv.q; r = dv.r; }
    res.quot = q; res.r = r;
    var parts = partial(r, groups); res.parts = parts;
    res.unsupported = parts.some(function (p) { return p.unsupported; });
    // letras
    var li = 0;
    parts.forEach(function (p) {
      if (p.type === 'real') { p.letters = p.coefs.map(function () { return letters(li++); }); }
      else if (!p.unsupported) { p.letters = [letters(li++), letters(li++)]; }
    });
    res.matrix = res.unsupported ? null : profMatrix(Dm, groups, parts, r);
    // términos en el tiempo (ya multiplicados por K)
    var K = res.K, terms = [];
    parts.forEach(function (p) {
      if (p.type === 'real') {
        var fact = 1;
        p.coefs.forEach(function (c, i) { if (i > 0) fact *= i; terms.push({ kind: 'exp', p: p.g.p, k: i + 1, coef: K * c / fact, raw: c }); });
      } else if (!p.unsupported) {
        terms.push({ kind: 'cos', a: p.a, w: p.w, coef: K * p.cosc });
        terms.push({ kind: 'sin', a: p.a, w: p.w, coef: K * p.sinc });
      }
    });
    res.terms = terms;
    res.impulse = isZero(q) ? 0 : K * q[0];
    res.impulseHigher = deg(q) > 0;
    res.f = function (t) {
      var v = 0;
      terms.forEach(function (T) {
        if (T.kind === 'exp') v += T.coef * Math.pow(t, T.k - 1) * Math.exp(T.p * t);
        else if (T.kind === 'cos') v += T.coef * Math.exp(-T.a * t) * Math.cos(T.w * t);
        else v += T.coef * Math.exp(-T.a * t) * Math.sin(T.w * t);
      });
      return v;
    };
    // chequeos
    var dd = deg(D2) - deg(N2);
    res.degDiff = dd;
    res.t0 = res.f(0);
    res.t0expected = dd >= 2 ? 0 : (dd === 1 ? lc(N2) / lc(D2) : null);
    var zeroGroup = groups.filter(function (g) { return g.type === 'real' && g.p === 0; })[0];
    res.hasZeroPole = !!zeroGroup;
    var stable = groups.every(function (g) { return g.type === 'real' ? (g.p < 0 || (g.p === 0 && g.m === 1)) : g.re < 0; });
    res.finalValue = (zeroGroup && zeroGroup.m === 1 && stable) ? terms.filter(function (T) { return T.kind === 'exp' && T.p === 0 && T.k === 1; })[0].coef : (stable && !zeroGroup ? 0 : null);
    if (!zeroGroup) {
      res.s0orig = peval(N2, 0) / peval(D2, 0);
      var s0 = 0;
      parts.forEach(function (p) {
        if (p.type === 'real') p.coefs.forEach(function (c, i) { s0 += c / Math.pow(-p.g.p, i + 1); });
        else if (!p.unsupported) s0 += p.D / p.c;
      });
      res.s0parts = K * s0 + (isZero(q) ? 0 : K * q[0]);
    }
    // tiempo para graficar
    var slow = Infinity;
    groups.forEach(function (g) { var v = g.type === 'real' ? Math.abs(g.p) : Math.abs(g.re); if (v > 1e-6) slow = Math.min(slow, v); });
    res.tMax = isFinite(slow) ? Math.min(40, Math.max(4, 5 / slow)) : 10;
    return res;
  }

  // ---------- TeX ----------
  function polyTex(p, v) {
    v = v || 's'; p = trim(p); var out = '';
    for (var k = p.length - 1; k >= 0; k--) {
      var c = p[k]; var a = Math.abs(c); var cs = fmt(a);
      if (cs === '0') continue;
      var neg = c < 0;
      if (k > 0 && cs === '1') cs = '';
      var term = cs + (k > 1 ? v + '^{' + k + '}' : (k === 1 ? v : ''));
      out += out === '' ? (neg ? '-' : '') + term : (neg ? ' - ' : ' + ') + term;
    }
    return out || '0';
  }
  function rootFactorTex(g, withPow) {
    var base;
    if (g.type === 'real') {
      if (g.p === 0 || fmt(g.p) === '0') base = 's';
      else base = '(s ' + (g.p < 0 ? '+ ' + fmt(-g.p) : '- ' + fmt(g.p)) + ')';
    } else base = '(' + polyTex(groupPoly(g)) + ')';
    if (withPow !== false && g.m > 1) base = (base === 's' ? 's' : base) + '^{' + g.m + '}';
    return base;
  }
  function factoredTex(lead, groups) {
    var s = groups.map(function (g) { return rootFactorTex(g); }).join('');
    var l = fmt(lead);
    if (l === '1') return s || '1';
    if (l === '-1') return '-' + (s || '1');
    return l + (s ? '\\,' + s : '');
  }
  function rootTex(g) {
    if (g.type === 'real') return fmt(g.p);
    return fmt(g.re) + ' \\pm ' + fmt(g.im) + 'i';
  }
  function expBody(p) { var s = fmt(p); if (s === '0') return ''; if (s === '-1') return 'e^{-t}'; if (s === '1') return 'e^{t}'; return 'e^{' + s + 't}'; }
  function termTex(T) {
    var body;
    if (T.kind === 'exp') {
      body = (T.k > 1 ? (T.k === 2 ? 't' : 't^{' + (T.k - 1) + '}') : '') + expBody(T.p);
    } else {
      var e = expBody(-T.a); var arg = (fmt(T.w) === '1' ? '' : fmt(T.w)) + 't';
      body = e + (T.kind === 'cos' ? '\\cos(' + arg + ')' : '\\operatorname{sen}(' + arg + ')');
    }
    return body;
  }
  function sumTex(terms) {
    var out = '';
    terms.forEach(function (T) {
      var cs = fmt(Math.abs(T.coef)); if (cs === '0') return;
      var body = termTex(T);
      var neg = T.coef < 0;
      var piece = body === '' ? cs : (cs === '1' ? body : cs + '\\,' + body);
      out += out === '' ? (neg ? '-' : '') + piece : (neg ? ' - ' : ' + ') + piece;
    });
    return out || '0';
  }

  return {
    fmt: fmt, near: near, C: C, trim: trim, deg: deg, isZero: isZero, lc: lc, padd: padd, psub: psub, pmul: pmul, pscale: pscale,
    peval: peval, pdiv: pdiv, roots: roots, groupRoots: groupRoots, groupPoly: groupPoly, pFromRoots: pFromRoots,
    analyze: analyze, polyTex: polyTex, rootFactorTex: rootFactorTex, factoredTex: factoredTex, rootTex: rootTex,
    termTex: termTex, sumTex: sumTex, expBody: expBody
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = LP;
