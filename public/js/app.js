/* Interfaz de Laplace paso a paso. Depende de: katex (opcional), LP (lp-core.js), LP_EJERCICIOS (ejercicios.js). */
(function () {
  'use strict';
  var F = LP.fmt;
  var IS_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tex(t, block) {
    if (window.katex) { try { return katex.renderToString(t, { output: 'mathml', displayMode: !!block, throwOnError: false }); } catch (e) { /* cae abajo */ } }
    return '<code>' + esc(t) + '</code>';
  }
  function M(t) { return '<div class="math">' + tex(t, true) + '</div>'; }
  function m(t) { return tex(t, false); }
  function $(id) { return document.getElementById(id); }
  function nz(x) { return Math.abs(x) > 1e-12; }
  function par(p) { var t = LP.polyTex(p); var cnt = LP.trim(p).filter(nz).length; return cnt > 1 ? '(' + t + ')' : t; }
  function negTex(p) { if (LP.isZero(p)) return '0'; var cnt = LP.trim(p).filter(nz).length; return cnt > 1 ? '-(' + LP.polyTex(p) + ')' : LP.polyTex(LP.pscale(p, -1)); }
  function highFirst(p) { return LP.trim(p).slice().reverse(); }

  // ====================== MODELOS ======================
  var MODELS = {
    mec2: {
      name: 'Mecánico: dos cosas que giran (θ1 y θ2)',
      groups: [
        { title: 'Cilindro θ1', note: 'Inercia 0 = punto sin cilindro', fields: [['J1', 'Inercia J1 (kg·m²)'], ['D1', 'Amortiguador a pared'], ['K1', 'Resorte a pared']] },
        { title: 'Entre θ1 y θ2', fields: [['Dc', 'Amortiguador'], ['Kc', 'Resorte']] },
        { title: 'Cilindro θ2', note: 'Inercia 0 = punto sin cilindro', fields: [['J2', 'Inercia J2 (kg·m²)'], ['D2', 'Amortiguador a pared'], ['K2', 'Resorte a pared']] }
      ],
      choices: [['on', 'El par T está en', [['1', 'θ1'], ['2', 'θ2']]], ['out', 'Piden', [['1', 'θ1(t)'], ['2', 'θ2(t)']]]],
      presets: [
        { label: 'Un cilindro suelto', vals: { J1: 1, D1: 0, K1: 0, Dc: 2, Kc: 1, J2: 2, D2: 1, K2: 0, on: '1', out: '2' } },
        { label: 'Punto sin cilindro', vals: { J1: 1, D1: 2, K1: 0, Dc: 1, Kc: 0, J2: 0, D2: 2, K2: 2, on: '1', out: '2' } },
        { label: 'Dos cilindros entre paredes', vals: { J1: 1, D1: 2, K1: 2, Dc: 3, Kc: 4, J2: 1, D2: 2, K2: 1, on: '2', out: '2' } },
        { label: 'Punto con resorte y amortiguador', vals: { J1: 1, D1: 0, K1: 0, Dc: 1, Kc: 1, J2: 0, D2: 1, K2: 1, on: '1', out: '2' } }
      ]
    },
    mec1: {
      name: 'Mecánico: un solo cilindro',
      groups: [{ title: 'El cilindro', fields: [['J', 'Inercia J (kg·m²)'], ['D', 'Amortiguador a pared'], ['K', 'Resorte a pared']] }],
      presets: [{ label: 'J = 1, D = 2, K = 5', vals: { J: 1, D: 2, K: 5 } }, { label: 'Polo repetido (J = 1, D = 2, K = 1)', vals: { J: 1, D: 2, K: 1 } }]
    },
    ele2: {
      name: 'Circuito de dos mallas',
      groups: [
        { title: 'Solo malla 1', fields: [['R1', 'Resistencia (Ω)'], ['L1', 'Bobina (·s)'], ['C1', 'Capacitor (k/s)']] },
        { title: 'Compartido (rama del centro)', fields: [['Rc', 'Resistencia (Ω)'], ['Lc', 'Bobina (·s)'], ['Cc', 'Capacitor (k/s)']] },
        { title: 'Solo malla 2', fields: [['R2', 'Resistencia (Ω)'], ['L2', 'Bobina (·s)'], ['C2', 'Capacitor (k/s)']] }
      ],
      choices: [['on', 'La fuente V está en', [['1', 'malla 1'], ['2', 'malla 2']]], ['out', 'Piden', [['1', 'I1(t)'], ['2', 'I2(t)']]]],
      presets: [
        { label: 'Dos bobinas de 2s', vals: { R1: 2, L1: 0, C1: 0, Rc: 0, Lc: 2, Cc: 0, R2: 3, L2: 2, C2: 0, on: '1', out: '1' } },
        { label: 'Bobina de ¼s', vals: { R1: 2, L1: 0, C1: 0, Rc: 0, Lc: 2, Cc: 0, R2: 3, L2: 0.25, C2: 0, on: '1', out: '1' } }
      ]
    },
    rlc: {
      name: 'Circuito RLC en serie (una malla)',
      groups: [{ title: 'La malla', fields: [['L', 'Bobina (·s)'], ['R', 'Resistencia (Ω)'], ['C', 'Capacitor (k/s)']] }],
      presets: [{ label: 'L = 2, R = 2, C = 6', vals: { L: 2, R: 2, C: 6 } }, { label: 'L = 4, R = 8, C = 12', vals: { L: 4, R: 8, C: 12 } }]
    },
    inv: {
      name: 'Inversa directa: te dan G(s)',
      groups: [{ title: 'G(s) = arriba / abajo', text: true, fields: [['num', 'Arriba (numerador)', 'De la potencia más alta a la más baja. "3 0" es 3s'], ['den', 'Abajo (denominador)', '"3 2 5 3 2" es 3s⁴+2s³+5s²+3s+2']] }],
      presets: [
        { label: 'Grado 4: saca el 3 primero', vals: { num: '3 0', den: '3 2 5 3 2' } },
        { label: 'Cuatro polos sin i', vals: { num: '2 1', den: '1 10 35 50 24' } }
      ]
    }
  };

  var state = { model: 'mec2', vals: {}, practice: false, revealed: 0, ex: null };

  // ====================== FORMULARIO ======================
  function buildModelSelect() {
    var sel = $('model');
    sel.innerHTML = Object.keys(MODELS).map(function (k) { return '<option value="' + k + '">' + esc(MODELS[k].name) + '</option>'; }).join('');
    sel.addEventListener('change', function () { loadModel(sel.value, null, false, null); });
  }
  function buildForm() {
    var mod = MODELS[state.model];
    $('model').value = state.model;
    $('presets').innerHTML = mod.presets.map(function (p, i) { return '<button class="btn" type="button" data-preset="' + i + '">' + esc(p.label) + '</button>'; }).join('');
    var html = '';
    mod.groups.forEach(function (g) {
      html += '<div class="group"><div class="group-title">' + esc(g.title) + (g.note ? '<span class="group-note">' + esc(g.note) + '</span>' : '') + '</div><div class="fields' + (g.text ? ' one' : '') + '">';
      g.fields.forEach(function (f) {
        var id = 'f-' + f[0];
        var val = state.vals[f[0]];
        html += '<div class="f"><label for="' + id + '">' + esc(f[1]) + '</label>';
        if (g.text) html += '<input type="text" id="' + id + '" data-k="' + f[0] + '" value="' + esc(val === undefined ? '' : val) + '" autocomplete="off" spellcheck="false" inputmode="text">';
        else html += '<input type="number" inputmode="decimal" step="any" min="0" id="' + id + '" data-k="' + f[0] + '" value="' + (val === undefined ? 0 : val) + '">';
        if (f[2]) html += '<small>' + esc(f[2]) + '</small>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    (mod.choices || []).forEach(function (c) {
      html += '<div class="group"><div class="group-title">' + esc(c[1]) + '</div><div class="seg" role="radiogroup" aria-label="' + esc(c[1]) + '">';
      c[2].forEach(function (o) {
        var id = 'r-' + c[0] + '-' + o[0];
        html += '<label for="' + id + '"><input type="radio" name="' + c[0] + '" id="' + id + '" value="' + o[0] + '"' + (String(state.vals[c[0]]) === o[0] ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>';
      });
      html += '</div></div>';
    });
    $('fields').innerHTML = html;
  }
  function readForm() {
    var mod = MODELS[state.model];
    mod.groups.forEach(function (g) {
      g.fields.forEach(function (f) {
        var el = $('f-' + f[0]); if (!el) return;
        if (g.text) state.vals[f[0]] = el.value;
        else { var x = parseFloat(String(el.value).replace(',', '.')); state.vals[f[0]] = isFinite(x) ? x : 0; }
      });
    });
    (mod.choices || []).forEach(function (c) {
      var el = document.querySelector('input[name="' + c[0] + '"]:checked'); if (el) state.vals[c[0]] = el.value;
    });
  }
  function loadModel(model, vals, practice, ex) {
    state.model = model;
    state.vals = Object.assign({}, vals || MODELS[model].presets[0].vals);
    state.practice = !!practice; state.revealed = 0; state.ex = ex || null;
    $('practice').checked = state.practice;
    buildForm(); render();
  }

  // ====================== DIBUJOS ======================
  var S = function (v) { return 'style="' + v + '"'; };
  function svgOpen(w, h, label) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">' + defs(); }
  function defs() {
    return '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" ' + S('stroke:var(--muted);stroke-width:1.6') + '/></pattern>' +
      '<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" ' + S('fill:var(--blue)') + '/></marker>' +
      '<marker id="arrk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" ' + S('fill:var(--ink)') + '/></marker></defs>';
  }
  function line(x1, y1, x2, y2, st) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' + S(st || 'stroke:var(--ink);stroke-width:2') + '/>'; }
  function text(x, y, t, st, anchor) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" ' + S(st || 'fill:var(--ink);font-size:12px') + '>' + esc(t) + '</text>'; }
  function springH(x1, x2, y) {
    var n = 4, lead = 12, w = (x2 - x1 - 2 * lead) / n, r = w / 2;
    var d = 'M' + x1 + ',' + y + ' L' + (x1 + lead) + ',' + y;
    for (var i = 0; i < n; i++) d += ' a' + r + ',' + (r * 1.1) + ' 0 0 1 ' + w + ',0';
    d += ' L' + x2 + ',' + y;
    return '<path d="' + d + '" ' + S('fill:none;stroke:var(--ink);stroke-width:2') + '/>';
  }
  function damperH(x1, x2, y) {
    var xm = (x1 + x2) / 2;
    return line(x1, y, xm - 12, y) +
      '<path d="M' + (xm + 14) + ',' + (y - 11) + ' L' + (xm - 12) + ',' + (y - 11) + ' L' + (xm - 12) + ',' + (y + 11) + ' L' + (xm + 14) + ',' + (y + 11) + '" ' + S('fill:none;stroke:var(--ink);stroke-width:2') + '/>' +
      line(xm + 2, y - 7, xm + 2, y + 7) + line(xm + 2, y, x2, y);
  }
  var LBL = 'fill:var(--blue);font-size:12px;font-weight:500';
  function linkH(x1, x2, y, D, K) {
    var out = '', has = (D ? 1 : 0) + (K ? 1 : 0);
    if (!has) return '';
    if (has === 2) {
      var yA = y - 24, yB = y + 24;
      out += line(x1, yA, x1, yB) + line(x2, yA, x2, yB);
      out += damperH(x1, x2, yA) + text((x1 + x2) / 2, yA - 16, 'D ' + F(D), LBL);
      out += springH(x1, x2, yB) + text((x1 + x2) / 2, yB + 26, 'K ' + F(K), LBL);
    } else if (D) {
      out += damperH(x1, x2, y) + text((x1 + x2) / 2, y - 16, 'D ' + F(D), LBL);
    } else {
      out += springH(x1, x2, y) + text((x1 + x2) / 2, y - 16, 'K ' + F(K), LBL);
    }
    return out;
  }
  function wall(x, y) { return '<rect x="' + x + '" y="' + (y - 58) + '" width="14" height="116" ' + S('fill:url(#hatch);stroke:var(--ink);stroke-width:1.5') + '/>'; }
  function inertia(x, y, J, name, isOut, hasT) {
    var out = '', L, R;
    if (J > 0) {
      L = x - 46; R = x + 46;
      out += '<rect x="' + L + '" y="' + (y - 28) + '" width="92" height="56" rx="6" ' + S('fill:var(--md-sys-color-secondary-container);stroke:var(--ink);stroke-width:2') + '/>';
      out += '<ellipse cx="' + L + '" cy="' + y + '" rx="9" ry="28" ' + S('fill:var(--md-sys-color-surface-container-lowest);stroke:var(--ink);stroke-width:2') + '/>';
      out += text(x + 4, y + 5, F(J) + ' kg·m²', 'fill:var(--md-sys-color-on-secondary-container);font-size:12.5px;font-weight:500');
    } else {
      L = x - 5; R = x + 5;
      out += '<circle cx="' + x + '" cy="' + y + '" r="6" ' + S('fill:var(--ink)') + '/>';
      out += text(x, y + 26, 'punto', 'fill:var(--muted);font-size:11px');
    }
    var top = y - (J > 0 ? 44 : 30);
    out += '<path d="M' + (x - 22) + ',' + top + ' A26,11 0 0 1 ' + (x + 22) + ',' + top + '" ' + S('fill:none;stroke:' + (isOut ? 'var(--blue)' : 'var(--muted)') + ';stroke-width:2') + ' marker-end="url(#' + (isOut ? 'arr' : 'arrk') + ')"/>';
    out += text(x + 34, top - 2, name, 'fill:' + (isOut ? 'var(--blue)' : 'var(--ink)') + ';font-size:15px;font-weight:700;font-style:italic', 'start');
    if (hasT) {
      out += '<path d="M' + (x - 34) + ',' + (top - 20) + ' A34,13 0 0 1 ' + (x + 6) + ',' + (top - 24) + '" ' + S('fill:none;stroke:var(--red);stroke-width:2.2') + ' marker-end="url(#arrk)"/>';
      out += text(x - 44, top - 22, 'T(t)', 'fill:var(--red);font-size:14px;font-weight:700;font-style:italic', 'end');
    }
    return { svg: out, L: L, R: R };
  }
  function mecSvg(v, single) {
    var W = 640, H = 200, y = 118, o = svgOpen(W, H, 'Dibujo del sistema mecánico');
    if (single) {
      var n = inertia(400, y, v.J, 'θ', true, true);
      if (v.D || v.K) { o += wall(22, y) + linkH(36, n.L, y, v.D, v.K); }
      return o + n.svg + '</svg>';
    }
    var n1x = v.J1 > 0 ? 210 : 190, n2x = v.J2 > 0 ? 440 : 450;
    var a = inertia(n1x, y, v.J1, 'θ1', v.out === '1', v.on === '1');
    var b = inertia(n2x, y, v.J2, 'θ2', v.out === '2', v.on === '2');
    if (v.D1 || v.K1) o += wall(22, y) + linkH(36, a.L, y, v.D1, v.K1);
    if (v.D2 || v.K2) o += wall(604, y) + linkH(b.R, 604, y, v.D2, v.K2);
    o += linkH(a.R, b.L, y, v.Dc, v.Kc);
    return o + a.svg + b.svg + '</svg>';
  }
  // eléctrico
  function elemSym(type, x, y, vert, label) {
    var o = '', st = 'fill:none;stroke:var(--ink);stroke-width:2';
    var bg = vert ? '<rect x="' + (x - 13) + '" y="' + (y - 22) + '" width="26" height="44" ' + S('fill:var(--md-sys-color-surface-container-lowest)') + '/>' : '<rect x="' + (x - 22) + '" y="' + (y - 13) + '" width="44" height="26" ' + S('fill:var(--md-sys-color-surface-container-lowest)') + '/>';
    o += bg;
    function P(d) { return '<path d="' + d + '" ' + S(st) + '/>'; }
    if (type === 'R') {
      var pts = [-22, -15, -10, -5, 0, 5, 10, 15, 22], d = '';
      pts.forEach(function (t, i) { var off = (i === 0 || i === pts.length - 1) ? 0 : (i % 2 ? -7 : 7); d += (i ? ' L' : 'M') + (vert ? (x + off) + ',' + (y + t) : (x + t) + ',' + (y + off)); });
      o += P(d);
    } else if (type === 'L') {
      var d2 = vert ? 'M' + x + ',' + (y - 22) : 'M' + (x - 22) + ',' + y;
      for (var i = 0; i < 4; i++) d2 += vert ? ' a7,6 0 0 1 0,11' : ' a5.5,7 0 0 1 11,0';
      o += P(d2);
    } else {
      if (vert) o += line(x, y - 22, x, y - 4) + line(x - 12, y - 4, x + 12, y - 4) + line(x - 12, y + 4, x + 12, y + 4) + line(x, y + 4, x, y + 22);
      else o += line(x - 22, y, x - 4, y) + line(x - 4, y - 12, x - 4, y + 12) + line(x + 4, y - 12, x + 4, y + 12) + line(x + 4, y, x + 22, y);
    }
    o += vert ? text(x + 18, y + 4, label, LBL, 'start') : text(x, y - 18, label, LBL);
    return o;
  }
  function elemList(R, L, Cc) {
    var a = [];
    if (R) a.push(['R', F(R) + ' Ω']);
    if (L) a.push(['L', (F(L) === '1' ? '' : F(L)) + 's']);
    if (Cc) a.push(['C', F(Cc) + '/s']);
    return a;
  }
  function spread(list, a, b) { var n = list.length; return list.map(function (e, i) { return [e, a + (b - a) * (i + 1) / (n + 1)]; }); }
  function meshArrow(cx, cy, label, hi) {
    return '<path d="M' + (cx - 16) + ',' + (cy - 26) + ' A30,30 0 1 1 ' + (cx - 28) + ',' + (cy + 8) + '" ' + S('fill:none;stroke:' + (hi ? 'var(--blue)' : 'var(--muted)') + ';stroke-width:1.8') + ' marker-end="url(#' + (hi ? 'arr' : 'arrk') + ')"/>' +
      text(cx, cy + 5, label, 'fill:' + (hi ? 'var(--blue)' : 'var(--muted)') + ';font-size:14px;font-weight:700;font-style:italic');
  }
  function source(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="18" ' + S('fill:var(--md-sys-color-surface-container-lowest);stroke:var(--red);stroke-width:2') + '/>' + text(x, y + 5, 'V', 'fill:var(--red);font-size:14px;font-weight:700;font-style:italic');
  }
  function eleSvg(v) {
    var W = 640, H = 210, x0 = 50, xm = 330, x1 = 610, yt = 40, yb = 180, o = svgOpen(W, H, 'Dibujo del circuito de dos mallas');
    o += line(x0, yt, x1, yt) + line(x0, yb, x1, yb) + line(x0, yt, x0, yb) + line(xm, yt, xm, yb) + line(x1, yt, x1, yb);
    var srcX = v.on === '2' ? x1 : x0;
    o += source(srcX, (yt + yb) / 2);
    spread(elemList(v.R1, v.L1, v.C1), x0 + 20, xm - 20).forEach(function (e) { o += elemSym(e[0][0], e[1], yt, false, e[0][1]); });
    spread(elemList(v.Rc, v.Lc, v.Cc), yt + 10, yb - 10).forEach(function (e) { o += elemSym(e[0][0], xm, e[1], true, e[0][1]); });
    spread(elemList(v.R2, v.L2, v.C2), xm + 20, x1 - 20).forEach(function (e) { o += elemSym(e[0][0], e[1], yt, false, e[0][1]); });
    o += meshArrow((x0 + xm) / 2, (yt + yb) / 2 + 18, 'I1', v.out === '1') + meshArrow((xm + x1) / 2, (yt + yb) / 2 + 18, 'I2', v.out === '2');
    return o + '</svg>';
  }
  function rlcSvg(v) {
    var W = 640, H = 210, x0 = 60, x1 = 580, yt = 40, yb = 180, o = svgOpen(W, H, 'Dibujo del circuito RLC');
    o += line(x0, yt, x1, yt) + line(x0, yb, x1, yb) + line(x0, yt, x0, yb) + line(x1, yt, x1, yb);
    o += source(x0, (yt + yb) / 2);
    spread(elemList(v.R, v.L, v.C), x0 + 30, x1 - 30).forEach(function (e) { o += elemSym(e[0][0], e[1], yt, false, e[0][1]); });
    o += meshArrow((x0 + x1) / 2, (yt + yb) / 2 + 18, 'I', true);
    return o + '</svg>';
  }

  // mapa de polos
  function planeSvg(poles, zeros, cancelled) {
    var pts = [];
    function push(g, k) { if (g.type === 'real') pts.push({ x: g.p, y: 0, k: k, g: g }); else { pts.push({ x: g.re, y: g.im, k: k, g: g }); pts.push({ x: g.re, y: -g.im, k: k, g: g }); } }
    poles.forEach(function (g) { push(g, 'p'); }); zeros.forEach(function (g) { push(g, 'z'); }); cancelled.forEach(function (g) { push(g, 'x'); });
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return Math.abs(p.y); });
    var xmin = Math.min(-1, Math.min.apply(null, xs.concat([0]))), xmax = Math.max(0.6, Math.max.apply(null, xs.concat([0])));
    var span = xmax - xmin; xmin -= span * 0.12; xmax += span * 0.12;
    var ymax = Math.max(1, Math.max.apply(null, ys.concat([0]))) * 1.35;
    var W = 380, H = 190, pad = 16;
    function sx(x) { return pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad); }
    function sy(y) { return H / 2 - y / ymax * (H / 2 - pad); }
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa de polos">';
    o += '<rect x="' + pad + '" y="' + pad + '" width="' + (sx(0) - pad) + '" height="' + (H - 2 * pad) + '" rx="8" ' + S('fill:var(--green-soft)') + '/>';
    o += text(pad + 8, pad + 16, 'aquí se apaga', 'fill:var(--md-sys-color-on-success-container);font-size:11px;font-weight:500', 'start');
    o += line(pad, sy(0), W - pad, sy(0), 'stroke:var(--muted);stroke-width:1') + line(sx(0), pad, sx(0), H - pad, 'stroke:var(--muted);stroke-width:1');
    o += text(W - pad, sy(0) - 6, 'parte sin i', 'fill:var(--muted);font-size:10.5px', 'end') + text(sx(0) + 6, pad + 12, 'parte con i', 'fill:var(--muted);font-size:10.5px', 'start');
    var labelled = {};
    pts.forEach(function (p) {
      var X = sx(p.x), Y = sy(p.y);
      if (p.k === 'p' || p.k === 'x') {
        var col = p.k === 'p' ? 'var(--red)' : 'var(--faint)';
        o += line(X - 6, Y - 6, X + 6, Y + 6, 'stroke:' + col + ';stroke-width:2.4') + line(X - 6, Y + 6, X + 6, Y - 6, 'stroke:' + col + ';stroke-width:2.4');
        if (p.k === 'x') o += '<circle cx="' + X + '" cy="' + Y + '" r="9" ' + S('fill:none;stroke:var(--faint);stroke-width:1.5') + '/>';
      } else {
        o += '<circle cx="' + X + '" cy="' + Y + '" r="6" ' + S('fill:none;stroke:var(--blue);stroke-width:2') + '/>';
      }
      if (p.k === 'p' && p.y >= 0) {
        var key = F(p.x, 2) + '|' + F(p.y, 2);
        if (!labelled[key]) { labelled[key] = 1; o += text(X, Y - 12, LP.rootTex(p.g).replace(' \\pm ', ' ± '), 'fill:var(--ink);font-size:11px;font-family:var(--f-mono)'); }
      }
    });
    return o + '</svg>';
  }
  function niceStep(r) { var e = Math.pow(10, Math.floor(Math.log10(r))); var f = r / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }
  function plotSvg(f, tMax, finalV, ylab) {
    var W = 600, H = 230, L = 54, R = 14, T = 14, B = 34, N = 300;
    var ys = [], mn = 0, mx = 0;
    for (var i = 0; i <= N; i++) { var t = tMax * i / N, y = f(t); ys.push([t, y]); if (isFinite(y)) { mn = Math.min(mn, y); mx = Math.max(mx, y); } }
    if (finalV !== null && finalV !== undefined) { mn = Math.min(mn, finalV); mx = Math.max(mx, finalV); }
    if (mx - mn < 1e-9) { mx += 1; mn -= 1; }
    var padY = (mx - mn) * 0.08; mx += padY; mn -= padY;
    function sx(t) { return L + t / tMax * (W - L - R); }
    function sy(y) { return T + (mx - y) / (mx - mn) * (H - T - B); }
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfica de la respuesta en el tiempo">';
    var ys1 = niceStep((mx - mn) / 4);
    for (var v = Math.ceil(mn / ys1) * ys1; v <= mx + 1e-12; v += ys1) {
      o += line(L, sy(v), W - R, sy(v), 'stroke:var(--line);stroke-width:1') + text(L - 6, sy(v) + 4, F(v, 3), 'fill:var(--muted);font-size:11px;font-family:var(--f-mono)', 'end');
    }
    var xs1 = niceStep(tMax / 5);
    for (var tt = 0; tt <= tMax + 1e-9; tt += xs1) o += text(sx(tt), H - B + 16, F(tt, 2), 'fill:var(--muted);font-size:11px;font-family:var(--f-mono)');
    o += line(L, sy(0), W - R, sy(0), 'stroke:var(--muted);stroke-width:1.2');
    o += text(W - R, H - 4, 't (segundos)', 'fill:var(--muted);font-size:11px', 'end');
    if (finalV !== null && finalV !== undefined && Math.abs(finalV) > 1e-9) {
      o += line(L, sy(finalV), W - R, sy(finalV), 'stroke:var(--green);stroke-width:1.4;stroke-dasharray:5 4');
      o += text(W - R - 4, sy(finalV) - 6, 'se queda en ' + F(finalV), 'fill:var(--green);font-size:11px;font-weight:500', 'end');
    }
    var d = ys.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1); }).join(' ');
    o += '<path d="' + d + '" ' + S('fill:none;stroke:var(--blue);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round') + '/>';
    o += text(L + 6, T + 12, ylab, 'fill:var(--blue);font-size:12px;font-weight:500', 'start');
    return o + '</svg>';
  }

  // ====================== PASOS ======================
  function sumPart(vals, suffix) {
    var a = vals.filter(nz);
    if (!a.length) return null;
    var s = a.length > 1 ? '(' + a.map(function (x) { return F(x); }).join(' + ') + ')' : F(a[0]);
    if (suffix && s === '1') s = '';
    return s + (suffix || '');
  }
  function rowExpr(J, Ds, Ks) {
    var parts = [];
    if (nz(J)) parts.push((F(J) === '1' ? '' : F(J)) + 's^2');
    var d = sumPart(Ds, 's'); if (d) parts.push(d);
    var k = sumPart(Ks, ''); if (k) parts.push(k);
    return parts.join(' + ') || '0';
  }
  function poleWord(g) {
    if (g.type === 'real') {
      var rep = g.m > 1 ? ' (repetido: también sale con t)' : '';
      if (g.p === 0) return g.m > 1 ? 'un número solo y algo con t (crece de a poquito)' : 'un número solo: se queda fijo';
      if (g.p < 0) return m('e^{' + F(g.p) + 't}') + ': se apaga' + rep;
      return m('e^{' + F(g.p) + 't}') + ': crece' + rep;
    }
    var e = LP.expBody(g.re); var w = F(g.im);
    var desc = g.re < -1e-9 ? 'va y viene mientras se apaga' : (g.re > 1e-9 ? 'va y viene y crece' : 'va y viene sin apagarse');
    return m(e + '\\cos(' + w + 't),\\ ' + e + '\\operatorname{sen}(' + w + 't)') + ': ' + desc;
  }
  function evalFactorTex(h, p) {
    var pt = F(p);
    var base;
    if (h.type === 'real') base = h.p === 0 ? '(' + pt + ')' : '(' + pt + (h.p < 0 ? ' + ' + F(-h.p) : ' - ' + F(h.p)) + ')';
    else base = '(' + pt + '^{2} + ' + F(-2 * h.re) + '(' + pt + ') + ' + F(h.re * h.re + h.im * h.im) + ')';
    return base + (h.m > 1 ? '^{' + h.m + '}' : '');
  }
  function fracTex(part, numStr) {
    var g = part.g;
    if (part.type === 'real') return part.coefs.map(function (_, i) { var f = LP.rootFactorTex(g, false); return '\\frac{' + (numStr ? numStr(part, i) : part.letters[i]) + '}{' + f + (i ? '^{' + (i + 1) + '}' : '') + '}'; });
    return ['\\frac{' + (numStr ? numStr(part, 0) : part.letters[0] + 's + ' + part.letters[1]) + '}{' + LP.rootFactorTex(g, false) + '}'];
  }
  function joinFracs(list) {
    var out = '';
    list.forEach(function (t) { out += out === '' ? t : (t.charAt(0) === '-' ? ' ' + t : ' + ' + t); });
    return out;
  }

  function pipeline(N, D, ctx, steps) {
    var a = LP.analyze(N, D);
    if (a.error) { steps.push({ tone: 'red', title: 'Algo no cuadra', html: '<p>' + esc(a.error) + '</p>' }); return { a: a }; }
    if (a.zero) { steps.push({ tone: 'red', title: 'Arriba quedó 0', html: '<p>Lo de arriba es 0, así que la respuesta es 0. Revisa el dibujo: ¿falta una pieza que una el lugar del par con lo que piden?</p>' }); return { a: a, ans: '0' }; }
    var lcD = a.lcD, Dm0 = LP.pscale(D, 1 / lcD), n = LP.deg(D);
    var html;
    // --- sacar número
    if (!LP.near(lcD, 1, 1e-9)) {
      html = '<p>La potencia más alta de abajo (' + m('s^{' + n + '}') + ') trae un <b>' + F(lcD) + '</b>. Divide todo lo de abajo entre ' + F(lcD) + ' y deja ' + m('\\frac{1}{' + F(lcD) + '}') + ' afuera. Ese número se queda esperando y al final multiplica a <b>todos</b> los pedazos.</p>' +
        M(ctx.lhs + ' = \\frac{1}{' + F(lcD) + '}\\cdot\\frac{' + LP.polyTex(N) + '}{' + LP.polyTex(Dm0) + '}');
    } else {
      html = '<p>La potencia más alta de abajo ya no trae número. No hay nada que sacar.</p>' + M(ctx.lhs + ' = \\frac{' + LP.polyTex(N) + '}{' + LP.polyTex(D) + '}');
    }
    steps.push({ tone: 'black', title: 'Saca el número de la potencia más alta', html: html });
    // --- polos
    var zeroG = a.polesAll.filter(function (g) { return g.type === 'real' && g.p === 0; })[0];
    var zc = zeroG ? zeroG.m : 0;
    var red = LP.trim(Dm0.slice(zc));
    html = '<p>Los <b>polos</b> son los números que hacen cero lo de abajo. Cada uno trae su propio pedazo a la respuesta.</p>';
    if (zc) html += '<p>Abajo hay ' + (zc === 1 ? 'una ' + m('s') : m('s^{' + zc + '}')) + ' de factor común: sácala. Eso ya es un polo (el 0).' + (LP.deg(red) >= 1 ? ' A la calculadora solo le das lo que queda, de grado ' + LP.deg(red) + ':' : '') + '</p>';
    else if (LP.deg(red) >= 3) html += '<p>En la calculadora: polinomio de grado ' + LP.deg(red) + ', con estos números (de la potencia más alta a la más baja):</p>';
    else if (LP.deg(red) >= 1) html += '<p>Es de grado ' + LP.deg(red) + ': lo puedes sacar con la fórmula general o con la calculadora. Números:</p>';
    if (LP.deg(red) >= 1) html += '<p class="mono" style="font-size:1rem">' + highFirst(red).map(function (c) { return F(c); }).join('  ,  ') + '</p>';
    html += '<div class="tbl"><table><thead><tr><th>Polo</th><th>Paréntesis</th><th>Pedazo que va a dar</th></tr></thead><tbody>';
    a.polesAll.forEach(function (g) {
      html += '<tr><td class="mono">' + esc(LP.rootTex(g).replace(' \\pm ', ' ± ')) + (g.m > 1 ? ' (×' + g.m + ')' : '') + '</td><td>' + m(LP.rootFactorTex(g)) + '</td><td>' + poleWord(g) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div class="pmap">' + planeSvg(a.groups, a.zerosAll.filter(function (z) { return !a.cancelled.some(function (c) { return LP.near(c.p !== undefined ? c.p : c.re, z.p !== undefined ? z.p : z.re, 1e-4); }); }), a.cancelled) + '</div>';
    html += '<p class="note">Cruces rojas: polos. Círculos azules: números que hacen cero lo de arriba. Cruz gris en círculo: polo que se tacha.</p>';
    if (a.zerosAll.length) html += '<p class="note">Lo de arriba se hace cero en: <span class="mono">' + a.zerosAll.map(function (g) { return LP.rootTex(g).replace(' \\pm ', ' ± '); }).join(' ; ') + '</span>.</p>';
    steps.push({ tone: 'green', title: 'Polos: lo que hace cero lo de abajo', html: html });
    // --- tachar
    var Kt = LP.near(lcD, 1, 1e-9) ? '' : '\\frac{1}{' + F(lcD) + '}\\cdot';
    if (a.cancelled.length) {
      html = '<p>Hay paréntesis que están <b>arriba y abajo</b>: ' + a.cancelled.map(function (g) { return m(LP.rootFactorTex(g)); }).join(', ') + '. Se tachan.</p>';
      html += M(ctx.lhs + ' = ' + Kt + '\\frac{' + LP.factoredTex(a.lcN, a.zerosAll) + '}{' + LP.factoredTex(1, a.polesAll) + '} = ' + Kt + '\\frac{' + LP.polyTex(a.N2) + '}{' + LP.factoredTex(1, a.groups) + '}');
      if (a.cancelled.some(function (g) { return g.type === 'real' && g.p === 0; })) html += '<div class="tip blue">Si no tachas la s y armas la tabla de letras así, a la letra de la s te sale 0. No está mal, solo es un paso de más.</div>';
    } else {
      html = '<p>Ningún número hace cero arriba y abajo al mismo tiempo. No hay nada que tachar.</p>' +
        M(ctx.lhs + ' = ' + Kt + '\\frac{' + LP.polyTex(a.N2) + '}{' + LP.factoredTex(1, a.groups) + '}');
    }
    steps.push({ tone: 'black', title: 'Tacha lo que se repite arriba y abajo', html: html });
    // --- fracciones
    if (a.unsupported) {
      steps.push({ tone: 'red', title: 'Caso raro', html: '<p>Te salió un par con i repetido. Ese caso no lo cubre la app; revisa los números del dibujo.</p>' });
      return { a: a };
    }
    var rTex = LP.polyTex(a.r);
    var setup = [];
    a.parts.forEach(function (p) { setup = setup.concat(fracTex(p)); });
    html = '';
    if (!LP.isZero(a.quot)) html += '<div class="tip red">Arriba quedó del mismo grado que abajo (o mayor). Primero se divide: sale ' + m(LP.polyTex(a.quot)) + ' entero (en el tiempo es un golpe instantáneo, ' + m('\\delta(t)') + ') y lo que sobra, ' + m(rTex) + ', se parte en fracciones. En estos problemas casi nunca pasa.</div>';
    html += '<p>Una letra por cada polo sin i; dos letras (' + m('Cs + D') + ') por cada par con i:</p>';
    html += M('\\frac{' + rTex + '}{' + LP.factoredTex(1, a.groups) + '} = ' + joinFracs(setup));
    html += '<ul class="clean">';
    a.parts.forEach(function (p, pi) {
      if (p.type === 'real' && p.g.m === 1) {
        var others = a.groups.filter(function (_, i) { return i !== pi; }).map(function (h) { return evalFactorTex(h, p.g.p); }).join('');
        html += '<li><b>' + p.letters[0] + ':</b> tapa ' + m(LP.rootFactorTex(p.g, false)) + ' y pon ' + m('s = ' + F(p.g.p)) + ' en todo lo demás: ' +
          m(p.letters[0] + ' = \\frac{' + F(p.Np) + '}{' + (others || '1') + '} = \\frac{' + F(p.Np) + '}{' + F(p.Qp) + '} = ' + F(p.coefs[0])) + '</li>';
      } else if (p.type === 'real') {
        html += '<li><b>' + p.letters.join(', ') + ':</b> el polo ' + F(p.g.p) + ' está repetido. Tapando solo sale la última (' + p.letters[p.letters.length - 1] + ' = ' + F(p.coefs[p.coefs.length - 1]) + '); las demás salen de la tabla de abajo: ' + p.letters.map(function (L, i) { return L + ' = ' + F(p.coefs[i]); }).join(', ') + '.</li>';
      } else {
        html += '<li><b>' + p.letters.join(' y ') + ':</b> son del par con i. Salen de la tabla de abajo en la calculadora: ' + m(p.letters[0] + ' = ' + F(p.C) + ',\\ ' + p.letters[1] + ' = ' + F(p.D)) + '</li>';
      }
    });
    html += '</ul>';
    var withNums = [];
    a.parts.forEach(function (p) {
      if (p.type === 'real') p.coefs.forEach(function (c, i) { var f = LP.rootFactorTex(p.g, false) + (i ? '^{' + (i + 1) + '}' : ''); withNums.push((c < 0 ? '-' : '') + '\\frac{' + F(Math.abs(c)) + '}{' + f + '}'); });
      else withNums.push('\\frac{' + LP.polyTex([p.D, p.C]) + '}{' + LP.rootFactorTex(p.g, false) + '}');
    });
    html += M('\\frac{' + rTex + '}{' + LP.factoredTex(1, a.groups) + '} = ' + joinFracs(withNums));
    // tabla de coeficientes
    var mx = a.matrix, letrs = [];
    a.parts.forEach(function (p) { letrs = letrs.concat(p.letters); });
    var t = '<details><summary>Tabla de coeficientes para la calculadora (o MATLAB: M1\\M2)</summary>';
    t += '<p class="note" style="margin-top:6px">Cada letra se multiplica por los paréntesis que no tiene abajo; se acomodan los números por potencia de s. La columna R es lo de arriba (' + m(rTex) + '), con 0 donde falte una potencia.</p><div class="tbl"><table><thead><tr><th></th>';
    letrs.forEach(function (L) { t += '<th class="num">' + L + '</th>'; });
    t += '<th class="num">R</th></tr></thead><tbody>';
    mx.rows.forEach(function (r) {
      t += '<tr><th>' + m('s^{' + r.pw + '}') + '</th>' + r.cells.map(function (c) { return '<td class="num">' + F(c) + '</td>'; }).join('') + '<td class="num"><b>' + F(r.rhs) + '</b></td></tr>';
    });
    t += '</tbody></table></div><p class="note">Resultado: <span class="mono">' + letrs.map(function (L, i) { return L + ' = ' + F(mx.vals[i]); }).join(' , ') + '</span></p></details>';
    html += t;
    steps.push({ tone: 'green', title: 'Separa en fracciones chiquitas', html: html });
    // --- tiempo
    html = '<div class="tbl"><table><thead><tr><th>Fracción</th><th>Se convierte en</th></tr></thead><tbody>';
    var raw = a.terms.map(function (T) { return Object.assign({}, T, { coef: T.coef / a.K }); });
    a.parts.forEach(function (p) {
      if (p.type === 'real') {
        p.coefs.forEach(function (c, i) {
          var f = LP.rootFactorTex(p.g, false) + (i ? '^{' + (i + 1) + '}' : '');
          var fact = 1; for (var q = 2; q <= i; q++) fact *= q;
          var T = { kind: 'exp', p: p.g.p, k: i + 1, coef: c / fact };
          html += '<tr><td>' + m((c < 0 ? '-' : '') + '\\frac{' + F(Math.abs(c)) + '}{' + f + '}') + '</td><td>' + m(LP.sumTex([T])) + '</td></tr>';
        });
      } else {
        var cs = { kind: 'cos', a: p.a, w: p.w, coef: p.cosc }, sn = { kind: 'sin', a: p.a, w: p.w, coef: p.sinc };
        html += '<tr><td>' + m('\\frac{' + LP.polyTex([p.D, p.C]) + '}{' + LP.rootFactorTex(p.g, false) + '}') + '<div class="note" style="margin-top:4px">' +
          m('a = \\tfrac{' + F(p.b) + '}{2} = ' + F(p.a)) + ' · ' + m('\\omega = \\sqrt{' + F(p.c) + ' - ' + F(p.a) + '^2} = ' + F(p.w)) + '<br>' +
          'seno: ' + m('\\frac{D - C\\cdot a}{\\omega} = \\frac{' + F(p.D) + ' - (' + F(p.C) + ')(' + F(p.a) + ')}{' + F(p.w) + '} = ' + F(p.sinc)) + '</div></td><td>' + m(LP.sumTex([cs, sn])) + '</td></tr>';
      }
    });
    html += '</tbody></table></div>';
    var imp = Math.abs(a.impulse) > 1e-9 ? F(a.impulse) + '\\,\\delta(t) + ' : '';
    var finalTex = imp + LP.sumTex(a.terms);
    if (!LP.near(lcD, 1, 1e-9)) {
      html += '<p>Ahora multiplica <b>cada</b> pedazo por el ' + m('\\frac{1}{' + F(lcD) + '}') + ' que dejaste afuera:</p>';
      html += M(ctx.lhsT + ' = \\frac{1}{' + F(lcD) + '}\\left(' + LP.sumTex(raw) + '\\right) = ' + finalTex);
    } else {
      html += M(ctx.lhsT + ' = ' + finalTex);
    }
    steps.push({ tone: 'green', title: 'Regresa al tiempo', html: html });
    // --- chequeos
    html = '';
    if (a.t0expected !== null && a.t0expected !== undefined && Math.abs(a.impulse) < 1e-9) {
      var ok = Math.abs(a.t0 - a.t0expected) < 0.006 * (1 + Math.abs(a.t0expected));
      var why = a.degDiff >= 2 ? 'abajo tiene ' + a.degDiff + ' potencias más que arriba, así que en t = 0 debe dar 0' : 'abajo tiene solo 1 potencia más que arriba, así que en t = 0 debe dar ' + F(LP.lc(a.N2)) + ' ÷ ' + F(LP.lc(a.D2)) + ' = ' + F(a.t0expected);
      var pieces = a.terms.filter(function (T) { return T.kind === 'cos' || (T.kind === 'exp' && T.k === 1); }).map(function (T) { return F(T.coef); });
      html += '<div class="check-row"><b>En t = 0:</b> suma los números de las e y de los cosenos: <span class="mono">' + pieces.join(' + ').replace(/\+ -/g, '− ') + ' = ' + F(a.t0) + '</span>. Como ' + why + '. <span class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ cuadra' : '✗ revisa') + '</span></div>';
    }
    if (a.hasZeroPole && a.finalValue !== null) {
      html += '<div class="check-row"><b>El número solo:</b> hay un polo en 0, así que con el tiempo la respuesta se queda en <b class="mono">' + F(a.finalValue) + '</b> y no regresa a 0.' + (ctx.finalHint ? ' ' + ctx.finalHint(a.finalValue) : '') + '</div>';
    } else if (a.s0orig !== undefined) {
      var ok2 = Math.abs(a.s0orig - a.s0parts) < 0.006 * (1 + Math.abs(a.s0orig));
      html += '<div class="check-row"><b>En s = 0:</b> la fracción original da <span class="mono">' + F(a.s0orig, 4) + '</span> y tus fracciones juntas dan <span class="mono">' + F(a.s0parts, 4) + '</span>. <span class="' + (ok2 ? 'ok' : 'bad') + '">' + (ok2 ? '✓ cuadra' : '✗ revisa') + '</span></div>';
    }
    if (ctx.check1) html += ctx.check1;
    html += '<div class="plot">' + plotSvg(a.f, a.tMax, a.hasZeroPole ? a.finalValue : null, ctx.ylab) + '</div>';
    html += '<p class="note">Así se ve la respuesta: ' + (a.hasZeroPole && a.finalValue !== null ? 'sube y se queda en un número fijo (polo en 0).' : (a.groups.some(function (g) { return g.type === 'pair'; }) ? 'va y viene un poco mientras se apaga (par con i).' : 'sube y se apaga.')) + '</p>';
    steps.push({ tone: 'red', title: 'Comprueba', html: html });
    return { a: a, ans: ctx.lhsT + ' = ' + finalTex };
  }

  function detSteps(r1, r2, c, on, out, names, steps) {
    var rhs1 = on === 1 ? names.inp : '0', rhs2 = on === 2 ? names.inp : '0';
    var nc = negTex(c);
    var numDet = out === 1 ? '\\begin{vmatrix} ' + rhs1 + ' & ' + nc + ' \\\\ ' + rhs2 + ' & ' + LP.polyTex(r2) + ' \\end{vmatrix}' : '\\begin{vmatrix} ' + LP.polyTex(r1) + ' & ' + rhs1 + ' \\\\ ' + nc + ' & ' + rhs2 + ' \\end{vmatrix}';
    var denDet = '\\begin{vmatrix} ' + LP.polyTex(r1) + ' & ' + nc + ' \\\\ ' + nc + ' & ' + LP.polyTex(r2) + ' \\end{vmatrix}';
    var num = on === out ? (out === 1 ? r2 : r1) : c;
    var prod = LP.pmul(r1, r2), c2 = LP.pmul(c, c), det = LP.psub(prod, c2);
    var which = on === out ? 'Lo que piden está donde está ' + (names.inpWord) + ', así que arriba queda la <b>fila del otro</b> (' + (out === 1 ? names.row2 : names.row1) + ').' : 'Lo que piden está en el otro lado, así que arriba queda <b>lo compartido</b>.';
    var html = '<p>' + which + ' Abajo siempre: (fila 1)(fila 2) − compartido².</p>';
    html += M(names.x[out - 1] + ' = \\frac{' + numDet + '}{' + denDet + '} = \\frac{' + par(num) + '\\,' + names.inp + '}{' + par(r1) + par(r2) + ' - ' + (LP.trim(c).filter(nz).length > 1 ? '(' + LP.polyTex(c) + ')^2' : (LP.isZero(c) ? '0' : '(' + LP.polyTex(c) + ')^2')) + '}');
    html += '<p>Multiplica con calma lo de abajo:</p>';
    html += M(par(r1) + par(r2) + ' = ' + LP.polyTex(prod));
    if (!LP.isZero(c)) html += M('(' + LP.polyTex(c) + ')^2 = ' + LP.polyTex(c2));
    html += M('\\text{Abajo} = ' + LP.polyTex(prod) + (LP.isZero(c) ? '' : ' - (' + LP.polyTex(c2) + ')') + ' = ' + LP.polyTex(det));
    var v1 = LP.peval(r1, 1) * LP.peval(r2, 1) - Math.pow(LP.peval(c, 1), 2), v2 = LP.peval(det, 1);
    html += '<div class="tip green">Comprueba con s = 1: ' + F(LP.peval(r1, 1)) + ' × ' + F(LP.peval(r2, 1)) + ' − ' + F(LP.peval(c, 1)) + '² = <b>' + F(v1) + '</b>, y sumando los números de tu resultado: <b>' + F(v2) + '</b>. ' + (Math.abs(v1 - v2) < 1e-6 ? '<span class="ok">✓ iguales</span>' : '<span class="bad">✗</span>') + '</div>';
    steps.push({ tone: 'black', title: 'Despeja con determinantes', html: html });
    return { num: num, det: det };
  }

  function buildMec2(v) {
    var steps = [];
    var on = +v.on, out = +v.out;
    var r1 = LP.trim([v.K1 + v.Kc, v.D1 + v.Dc, v.J1]), r2 = LP.trim([v.Kc + v.K2, v.Dc + v.D2, v.J2]), c = LP.trim([v.Kc, v.Dc]);
    var items = [];
    function it(val, what, conv, where) { if (nz(val)) items.push('<li>' + what + ' <b>' + F(val) + '</b> → ' + m(conv) + ' · ' + where + '</li>'); }
    it(v.J1, 'Cilindro J1', LP.polyTex([0, 0, v.J1]), 'solo en la fila de θ1');
    it(v.D1, 'Amortiguador de θ1 a la pared', LP.polyTex([0, v.D1]), 'solo en la fila de θ1');
    it(v.K1, 'Resorte de θ1 a la pared', F(v.K1), 'solo en la fila de θ1');
    it(v.Dc, 'Amortiguador entre θ1 y θ2', LP.polyTex([0, v.Dc]), 'en las dos filas y en lo compartido');
    it(v.Kc, 'Resorte entre θ1 y θ2', F(v.Kc), 'en las dos filas y en lo compartido');
    it(v.J2, 'Cilindro J2', LP.polyTex([0, 0, v.J2]), 'solo en la fila de θ2');
    it(v.D2, 'Amortiguador de θ2 a la pared', LP.polyTex([0, v.D2]), 'solo en la fila de θ2');
    it(v.K2, 'Resorte de θ2 a la pared', F(v.K2), 'solo en la fila de θ2');
    var html = '<p>Cilindro → ' + m('Js^2') + ', amortiguador → ' + m('Ds') + ', resorte → ' + m('K') + '.</p><ul class="clean">' + items.join('') + '</ul>';
    if (!nz(v.J1)) html += '<div class="tip blue">θ1 es un punto sin cilindro: su fila no lleva ' + m('s^2') + '.</div>';
    if (!nz(v.J2)) html += '<div class="tip blue">θ2 es un punto sin cilindro: su fila no lleva ' + m('s^2') + '.</div>';
    steps.push({ tone: 'blue', title: 'Traduce cada pieza', html: html });
    var e1 = rowExpr(v.J1, [v.D1, v.Dc], [v.K1, v.Kc]), e2 = rowExpr(v.J2, [v.Dc, v.D2], [v.Kc, v.K2]);
    var T1 = on === 1 ? 'T(s)' : '0', T2 = on === 2 ? 'T(s)' : '0';
    html = '<p><b>Fila de θ1</b> = todo lo que toca a θ1. <b>Fila de θ2</b> = todo lo que toca a θ2. <b>Compartido</b> = lo que está entre los dos, con signo menos.</p>';
    html += M('\\text{Fila }\\theta_1 = ' + e1 + (e1 !== LP.polyTex(r1) ? ' = ' + LP.polyTex(r1) : ''));
    html += M('\\text{Fila }\\theta_2 = ' + e2 + (e2 !== LP.polyTex(r2) ? ' = ' + LP.polyTex(r2) : ''));
    html += M('\\text{Compartido} = ' + LP.polyTex(c));
    html += M('\\begin{bmatrix} ' + LP.polyTex(r1) + ' & ' + negTex(c) + ' \\\\ ' + negTex(c) + ' & ' + LP.polyTex(r2) + ' \\end{bmatrix}\\begin{bmatrix}\\theta_1(s)\\\\ \\theta_2(s)\\end{bmatrix} = \\begin{bmatrix}' + T1 + '\\\\ ' + T2 + '\\end{bmatrix}');
    html += '<p class="note">Escrito como ecuaciones:</p>' + M(par(r1) + '\\theta_1 ' + (LP.isZero(c) ? '' : '- ' + par(c) + '\\theta_2') + ' = ' + T1) + M((LP.isZero(c) ? '' : '-' + par(c) + '\\theta_1 + ') + par(r2) + '\\theta_2 = ' + T2);
    steps.push({ tone: 'blue', title: 'Arma la tabla 2×2', html: html });
    var d = detSteps(r1, r2, c, on, out, { x: ['\\theta_1(s)', '\\theta_2(s)'], inp: 'T(s)', inpWord: 'el par', row1: 'θ1', row2: 'θ2' }, steps);
    var ctx = { lhs: '\\frac{\\theta_' + out + '(s)}{T(s)}', lhsT: '\\frac{\\theta_' + out + '(t)}{T(t)}', ylab: 'θ' + out + '(t) / T' };
    // pista del número solo (un amortiguador a la pared y sin resortes a la pared)
    var g1 = nz(v.D1) || nz(v.K1), g2 = nz(v.D2) || nz(v.K2);
    if (!nz(v.K1) && !nz(v.K2) && (g1 !== g2) && (nz(v.Kc) || (g1 ? out === 1 : out === 2))) {
      var Dw = g1 ? v.D1 : v.D2;
      if (nz(Dw)) ctx.finalHint = function (fv) { return 'En este dibujo ese número es 1 entre el amortiguador a la pared: 1 ÷ ' + F(Dw) + ' = ' + F(1 / Dw) + ' <span class="' + (Math.abs(fv - 1 / Dw) < 0.006 ? 'ok">✓' : 'bad">✗') + '</span>'; };
    }
    var res = pipeline(d.num, d.det, ctx, steps);
    return { steps: steps, ans: res.ans, diagram: mecSvg(v), cap: 'J = cilindro (kg·m²) · D = amortiguador (N·m·s/rad) · K = resorte (N·m/rad). En azul, lo que piden; en rojo, el par.' };
  }
  function buildMec1(v) {
    var steps = [];
    var row = LP.trim([v.K, v.D, v.J]);
    var html = '<ul class="clean">' + (nz(v.J) ? '<li>Cilindro <b>' + F(v.J) + '</b> → ' + m(LP.polyTex([0, 0, v.J])) + '</li>' : '') + (nz(v.D) ? '<li>Amortiguador <b>' + F(v.D) + '</b> → ' + m(LP.polyTex([0, v.D])) + '</li>' : '') + (nz(v.K) ? '<li>Resorte <b>' + F(v.K) + '</b> → ' + m(F(v.K)) + '</li>' : '') + '</ul>';
    steps.push({ tone: 'blue', title: 'Traduce cada pieza', html: html });
    html = '<p>Con una sola cosa que gira no hay tabla: sumas todo y despejas.</p>' + M('(' + LP.polyTex(row) + ')\\,\\theta(s) = T(s)') + M('\\frac{\\theta(s)}{T(s)} = \\frac{1}{' + LP.polyTex(row) + '}');
    steps.push({ tone: 'blue', title: 'Suma y despeja', html: html });
    var res = pipeline([1], row, { lhs: '\\frac{\\theta(s)}{T(s)}', lhsT: '\\frac{\\theta(t)}{T(t)}', ylab: 'θ(t) / T' }, steps);
    return { steps: steps, ans: res.ans, diagram: mecSvg(v, true), cap: 'J = cilindro (kg·m²) · D = amortiguador (N·m·s/rad) · K = resorte (N·m/rad).' };
  }
  function zExpr(Ls, Rs, Cs) {
    var parts = [];
    var l = sumPart(Ls, 's'); if (l) parts.push(l);
    var r = sumPart(Rs, ''); if (r) parts.push(r);
    var c = Cs.filter(nz); if (c.length) parts.push('\\frac{' + (c.length > 1 ? c.map(function (x) { return F(x); }).join(' + ') : F(c[0])) + '}{s}');
    return parts.join(' + ') || '0';
  }
  function buildEle2(v) {
    var steps = [], on = +v.on, out = +v.out;
    var hasCap = [v.C1, v.Cc, v.C2].some(nz);
    var items = [];
    function it(val, what, conv, where) { if (nz(val)) items.push('<li>' + what + ' <b>' + F(val) + '</b> → ' + m(conv) + ' · ' + where + '</li>'); }
    [['1', 'malla 1', 'solo en la fila de la malla 1'], ['c', 'compartido', 'en las dos filas y en lo compartido'], ['2', 'malla 2', 'solo en la fila de la malla 2']].forEach(function (k) {
      it(v['R' + k[0]], 'Resistencia (' + k[1] + ')', F(v['R' + k[0]]), k[2]);
      it(v['L' + k[0]], 'Bobina (' + k[1] + ')', LP.polyTex([0, v['L' + k[0]]]), k[2]);
      it(v['C' + k[0]], 'Capacitor (' + k[1] + ')', '\\frac{' + F(v['C' + k[0]]) + '}{s}', k[2]);
    });
    steps.push({ tone: 'blue', title: 'Traduce cada pieza', html: '<p>Resistencia → número, bobina → algo con s, capacitor → algo entre s.</p><ul class="clean">' + items.join('') + '</ul>' });
    var z1 = zExpr([v.L1, v.Lc], [v.R1, v.Rc], [v.C1, v.Cc]), z2 = zExpr([v.Lc, v.L2], [v.Rc, v.R2], [v.C2, v.Cc]), zc = zExpr([v.Lc], [v.Rc], [v.Cc]);
    var V1 = on === 1 ? 'V(s)' : '0', V2 = on === 2 ? 'V(s)' : '0';
    var html = M('\\begin{bmatrix} ' + z1 + ' & -(' + zc + ') \\\\ -(' + zc + ') & ' + z2 + ' \\end{bmatrix}\\begin{bmatrix}I_1(s)\\\\ I_2(s)\\end{bmatrix} = \\begin{bmatrix}' + V1 + '\\\\ ' + V2 + '\\end{bmatrix}');
    var r1, r2, c;
    if (hasCap) {
      r1 = LP.trim([v.C1 + v.Cc, v.R1 + v.Rc, v.L1 + v.Lc]); r2 = LP.trim([v.Cc + v.C2, v.Rc + v.R2, v.Lc + v.L2]); c = LP.trim([v.Cc, v.Rc, v.Lc]);
      html += '<div class="tip blue">Hay capacitores (algo entre s). Multiplica cada casilla por s para quitar las fracciones. Al final eso deja una <b>s extra arriba</b>.</div>';
      html += M('\\begin{bmatrix} ' + LP.polyTex(r1) + ' & ' + negTex(c) + ' \\\\ ' + negTex(c) + ' & ' + LP.polyTex(r2) + ' \\end{bmatrix}\\quad(\\text{todo por } s)');
    } else {
      r1 = LP.trim([v.R1 + v.Rc, v.L1 + v.Lc]); r2 = LP.trim([v.Rc + v.R2, v.Lc + v.L2]); c = LP.trim([v.Rc, v.Lc]);
    }
    steps.push({ tone: 'blue', title: 'Arma la tabla 2×2', html: '<p>En cada malla sumas todo lo que hay dentro; lo de la rama del centro va con menos fuera de la diagonal.</p>' + html });
    var d = detSteps(r1, r2, c, on, out, { x: ['I_1(s)', 'I_2(s)'], inp: 'V(s)', inpWord: 'la fuente', row1: 'malla 1', row2: 'malla 2' }, steps);
    var num = d.num;
    if (hasCap) { num = LP.pmul(num, [0, 1]); steps[steps.length - 1].html += '<p>Por haber multiplicado la tabla por s, arriba se agrega una s: queda ' + m(LP.polyTex(num)) + '.</p>'; }
    var ctx = { lhs: '\\frac{I_' + out + '(s)}{V(s)}', lhsT: '\\frac{i_' + out + '(t)}{v(t)}', ylab: 'i' + out + '(t) / V' };
    var res = pipeline(num, d.det, ctx, steps);
    return { steps: steps, ans: res.ans, diagram: eleSvg(v), cap: 'R en ohms, bobina con s, capacitor entre s (por ejemplo, 6 s⁻¹ se escribe 6/s). En azul, lo que piden.' };
  }
  function buildRlc(v) {
    var steps = [];
    var z = zExpr([v.L], [v.R], [v.C]);
    steps.push({ tone: 'blue', title: 'Traduce cada pieza', html: '<ul class="clean">' + (nz(v.L) ? '<li>Bobina <b>' + F(v.L) + '</b> → ' + m(LP.polyTex([0, v.L])) + '</li>' : '') + (nz(v.R) ? '<li>Resistencia <b>' + F(v.R) + '</b> → ' + m(F(v.R)) + '</li>' : '') + (nz(v.C) ? '<li>Capacitor <b>' + F(v.C) + '</b> → ' + m('\\frac{' + F(v.C) + '}{s}') + '</li>' : '') + '</ul>' });
    var num, den, html = M('\\left(' + z + '\\right) I(s) = V(s)');
    if (nz(v.C)) {
      den = LP.trim([v.C, v.R, v.L]); num = [0, 1];
      html += '<p>Despeja y multiplica arriba y abajo por s para quitar la fracción:</p>' + M('\\frac{I(s)}{V(s)} = \\frac{1}{' + z + '}\\cdot\\frac{s}{s} = \\frac{s}{' + LP.polyTex(den) + '}');
    } else { den = LP.trim([v.R, v.L]); num = [1]; html += M('\\frac{I(s)}{V(s)} = \\frac{1}{' + LP.polyTex(den) + '}'); }
    steps.push({ tone: 'blue', title: 'Suma todo el lazo y despeja', html: html });
    var res = pipeline(num, den, { lhs: '\\frac{I(s)}{V(s)}', lhsT: '\\frac{i(t)}{v(t)}', ylab: 'i(t) / V' }, steps);
    return { steps: steps, ans: res.ans, diagram: rlcSvg(v), cap: 'Un solo lazo: todo se suma.' };
  }
  function parseCoefs(s) {
    var a = String(s || '').trim().split(/[\s,;]+/).filter(function (x) { return x !== ''; }).map(function (x) { return parseFloat(x); });
    if (!a.length || a.some(function (x) { return !isFinite(x); })) return null;
    return a.reverse();
  }
  function buildInv(v) {
    var steps = [];
    var N = parseCoefs(v.num), D = parseCoefs(v.den);
    if (!N || !D || LP.isZero(D)) {
      steps.push({ tone: 'red', title: 'Escribe los números', html: '<p>Escribe los números separados por espacios, de la potencia más alta a la más baja. Pon 0 donde falte una potencia: 3s⁴ + 5s² + 2 se escribe <span class="mono">3 0 5 0 2</span>.</p>' });
      return { steps: steps, ans: null, diagram: '', cap: '' };
    }
    steps.push({ tone: 'blue', title: 'La fracción que te dan', html: M('G(s) = \\frac{' + LP.polyTex(N) + '}{' + LP.polyTex(D) + '}') + '<p class="note">Aquí no hay dibujo: empiezas directo en la fracción.</p>' });
    var res = pipeline(N, D, { lhs: 'G(s)', lhsT: 'g(t)', ylab: 'g(t)' }, steps);
    return { steps: steps, ans: res.ans, diagram: '', cap: '' };
  }
  var BUILD = { mec2: buildMec2, mec1: buildMec1, ele2: buildEle2, rlc: buildRlc, inv: buildInv };

  // ====================== PINTAR ======================
  var last = null;
  function render() {
    readForm();
    var out;
    try { out = BUILD[state.model](state.vals); }
    catch (e) { out = { steps: [{ tone: 'red', title: 'No se pudo calcular', html: '<p>Revisa los números. (' + esc(e.message) + ')</p>' }], ans: null, diagram: '', cap: '' }; }
    last = out;
    var dg = $('diagram');
    dg.parentNode.hidden = !out.diagram;
    dg.innerHTML = out.diagram || ''; $('diagram-cap').textContent = out.cap || '';
    var b = $('ex-banner');
    if (state.ex) { b.hidden = false; b.innerHTML = '<span class="chip ' + (state.ex.tone || 'blue') + '">Ejemplo ' + esc(state.ex.id) + '</span><strong>' + esc(state.ex.title) + '</strong><span class="note">' + esc(state.ex.desc || '') + '</span>'; }
    else b.hidden = true;
    var html = '';
    var practice = state.practice;
    out.steps.forEach(function (s, i) {
      var hidden = practice && i >= state.revealed;
      html += '<article class="panel step t-' + s.tone + (hidden ? ' hidden' : '') + '" id="step-' + i + '"><div class="step-h"><span class="chip">Paso ' + (i + 1) + '</span><h3>' + esc(s.title) + '</h3>' +
        (hidden ? '<button class="btn ghost" type="button" data-reveal="' + i + '">Mostrar</button>' : '') + '</div><div class="step-body">' + (hidden ? '' : s.html) + '</div></article>';
    });
    $('steps').innerHTML = html;
    var ansHidden = practice && state.revealed < out.steps.length;
    $('answer').innerHTML = out.ans ? '<div class="answer' + (ansHidden ? ' hidden-ans' : '') + '"><span class="chip">Respuesta</span>' + (ansHidden ? ' <button class="btn primary" type="button" data-reveal="all">Ver respuesta</button>' : '') + '<div class="ans-body">' + (ansHidden ? M('\\text{(oculta)}') : M(out.ans)) + '</div></div>' : '';
    $('practice-bar').hidden = !(practice && state.revealed < out.steps.length);
  }
  function reveal(i) {
    if (i === 'all') state.revealed = last ? last.steps.length : 99; else state.revealed = Math.max(state.revealed, i + 1);
    render();
    if (i !== 'all') { var el = $('step-' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  // ====================== EJERCICIOS ======================
  var EX = window.LP_EJERCICIOS || [];
  function buildExercises() {
    var html = '';
    EX.forEach(function (g, gi) {
      html += '<div class="ex-group"><h3>' + esc(g.group) + '</h3>' + (g.desc ? '<p class="note">' + esc(g.desc) + '</p>' : '') + '<div class="ex-grid">';
      g.items.forEach(function (e, ei) {
        html += '<div class="panel ex"><span class="chip ' + (g.tone || 'blue') + '" style="align-self:flex-start">' + esc(e.id) + '</span><h4>' + esc(e.title) + '</h4><p>' + esc(e.desc) + '</p><div class="row">' +
          '<button class="btn primary" type="button" data-ex="' + gi + ':' + ei + ':p">Practicar</button><button class="btn outlined" type="button" data-ex="' + gi + ':' + ei + ':s">Ver resuelto</button></div></div>';
      });
      html += '</div></div>';
    });
    $('ex-list').innerHTML = html;
  }

  // ====================== EXPLORADOR DE POLOS ======================
  var pole = { re: -0.5, im: 2 };
  function drawExplorer() {
    var W = 320, H = 240, xmin = -3, xmax = 1, ymax = 4;
    function sx(x) { return (x - xmin) / (xmax - xmin) * W; }
    function sy(y) { return H / 2 - y / ymax * (H / 2 - 10); }
    var o = '<rect x="0" y="0" width="' + W + '" height="' + H + '" ' + S('fill:var(--panel-2)') + '/>';
    o += '<rect x="0" y="0" width="' + sx(0) + '" height="' + H + '" ' + S('fill:var(--green-soft)') + '/>';
    o += text(8, 16, 'aquí se apaga', 'fill:var(--md-sys-color-on-success-container);font-size:11px;font-weight:500', 'start') + text(W - 6, 16, 'aquí crece', 'fill:var(--red);font-size:11px;font-weight:500', 'end');
    for (var x = -2; x <= 0; x++) { o += line(sx(x), sy(0) - 4, sx(x), sy(0) + 4, 'stroke:var(--muted);stroke-width:1') + text(sx(x), sy(0) + 16, String(x), 'fill:var(--muted);font-size:10px'); }
    o += line(0, sy(0), W, sy(0), 'stroke:var(--muted);stroke-width:1') + line(sx(0), 0, sx(0), H, 'stroke:var(--muted);stroke-width:1');
    var pts = Math.abs(pole.im) < 0.05 ? [[pole.re, 0]] : [[pole.re, pole.im], [pole.re, -pole.im]];
    pts.forEach(function (p) { var X = sx(p[0]), Y = sy(p[1]); o += line(X - 7, Y - 7, X + 7, Y + 7, 'stroke:var(--red);stroke-width:3') + line(X - 7, Y + 7, X + 7, Y - 7, 'stroke:var(--red);stroke-width:3'); });
    $('splane').innerHTML = o;
    var re = Math.round(pole.re * 10) / 10, im = Math.round(Math.abs(pole.im) * 10) / 10;
    var termT, verdict;
    var e = LP.expBody(re);
    if (im < 0.05) {
      termT = re === 0 ? 'A' : 'A\\,' + e;
      verdict = re < 0 ? 'Polo ' + F(re) + ': se apaga' + (re < -1.5 ? ' rápido' : ' despacio') : (re === 0 ? 'Polo en 0: un número que se queda fijo' : 'Polo positivo: crece sin parar');
    } else {
      termT = (e ? e : '') + '\\cos(' + F(im) + 't),\\ ' + (e ? e : '') + '\\operatorname{sen}(' + F(im) + 't)';
      verdict = 'Par ' + F(re) + ' ± ' + F(im) + 'i: ' + (re < 0 ? 'va y viene mientras se apaga' : re === 0 ? 'va y viene para siempre' : 'va y viene y crece');
    }
    $('pole-verdict').textContent = verdict;
    $('pole-term').innerHTML = tex(termT, true);
    var f = function (t) { return Math.exp(re * t) * (im < 0.05 ? 1 : Math.cos(im * t)); };
    var P = 320, PH = 180, tM = 8, ymx = 1.2, vals = [];
    for (var i = 0; i <= 200; i++) { var t = tM * i / 200; vals.push(f(t)); ymx = Math.max(ymx, Math.min(4, Math.abs(f(t)) * 1.1)); }
    function px(t) { return 10 + t / tM * (P - 20); }
    function py(y) { y = Math.max(-ymx, Math.min(ymx, y)); return PH / 2 - y / ymx * (PH / 2 - 12); }
    var po = '<rect x="0" y="0" width="' + P + '" height="' + PH + '" ' + S('fill:var(--panel-2)') + '/>' + line(10, PH / 2, P - 10, PH / 2, 'stroke:var(--muted);stroke-width:1');
    po += '<path d="' + vals.map(function (y, i) { return (i ? 'L' : 'M') + px(tM * i / 200).toFixed(1) + ',' + py(y).toFixed(1); }).join(' ') + '" ' + S('fill:none;stroke:var(--blue);stroke-width:2.6;stroke-linecap:round') + '/>';
    po += text(P - 12, PH - 8, 't →', 'fill:var(--muted);font-size:11px', 'end');
    $('pole-plot').innerHTML = po;
  }
  function setupExplorer() {
    var svg = $('splane'), drag = false;
    function at(ev) {
      var r = svg.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width * 320, y = (ev.clientY - r.top) / r.height * 240;
      pole.re = Math.max(-3, Math.min(1, -3 + x / 320 * 4));
      pole.im = Math.max(0, Math.min(4, Math.abs((120 - y) / 110 * 4)));
      if (Math.abs(pole.re) < 0.08) pole.re = 0;
      if (pole.im < 0.15) pole.im = 0;
      drawExplorer();
    }
    svg.addEventListener('pointerdown', function (e) { drag = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } at(e); });
    svg.addEventListener('pointermove', function (e) { if (drag) at(e); });
    svg.addEventListener('pointerup', function () { drag = false; });
    document.querySelectorAll('[data-pole]').forEach(function (b) {
      b.addEventListener('click', function () { var p = b.getAttribute('data-pole').split(','); pole.re = +p[0]; pole.im = +p[1]; drawExplorer(); });
    });
    drawExplorer();
  }

  // ====================== RUTAS ======================
  var VIEWS = ['conceptos', 'resolver', 'ejercicios'];
  function route() {
    var h = (location.hash || '').replace('#', '');
    var view = VIEWS.indexOf(h) >= 0 ? h : (h.indexOf('c-') === 0 ? 'conceptos' : 'resolver');
    VIEWS.forEach(function (v) { $('view-' + v).hidden = v !== view; });
    document.querySelectorAll('.nav a').forEach(function (a) { if (a.getAttribute('data-view') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (h.indexOf('c-') === 0) { var el = $(h); if (el) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0); }
    else window.scrollTo(0, 0);
  }

  // ====================== TEMA, ESTADO Y PWA ======================
  var ICON_DARK = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
  var ICON_LIGHT = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>';
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintThemeIcon() {
    var svg = $('theme').querySelector('svg');
    svg.innerHTML = isDark() ? ICON_LIGHT : ICON_DARK;
  }
  function setupTheme() {
    var saved = null;
    try { saved = localStorage.getItem('lp-theme'); } catch (e) { /* sin almacenamiento */ }
    if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
    paintThemeIcon();
    $('theme').addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('lp-theme', next); } catch (e) { /* sin almacenamiento */ }
      paintThemeIcon();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', paintThemeIcon);
    }
  }
  function setupStatus() {
    var el = $('status');
    if (IS_APP) { el.innerHTML = '<span class="dot on"></span>App Android · funciona sin internet'; return; }
    fetch('api/salud', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { el.innerHTML = '<span class="dot on"></span>Servidor en línea · v' + esc(j.version); })
      .catch(function () { el.innerHTML = '<span class="dot"></span>Sin conexión al servidor (funciona igual)'; });
  }
  function setupPwa() {
    if (IS_APP || !('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* nada */ }); });
  }
  function setupTopBar() {
    var top = document.querySelector('.top');
    function onScroll() { top.classList.toggle('scrolled', window.scrollY > 4); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // ====================== ARRANQUE ======================
  function renderStaticTex() {
    document.querySelectorAll('[data-tex]').forEach(function (el) { el.innerHTML = tex(el.getAttribute('data-tex'), el.hasAttribute('data-block')); });
  }
  var timer = null;
  function init() {
    setupTheme();
    setupTopBar();
    buildModelSelect();
    buildExercises();
    renderStaticTex();
    setupExplorer();
    $('fields').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 120); });
    $('fields').addEventListener('change', render);
    $('presets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]'); if (!b) return;
      loadModel(state.model, MODELS[state.model].presets[+b.getAttribute('data-preset')].vals, state.practice, null);
    });
    $('practice').addEventListener('change', function () { state.practice = this.checked; state.revealed = 0; render(); });
    document.addEventListener('click', function (e) {
      var r = e.target.closest('[data-reveal]');
      if (r) { var v = r.getAttribute('data-reveal'); reveal(v === 'all' ? 'all' : +v); return; }
      var x = e.target.closest('[data-ex]');
      if (x) {
        var p = x.getAttribute('data-ex').split(':'); var g = EX[+p[0]], it = g.items[+p[1]];
        loadModel(it.model, it.vals, p[2] === 'p', { id: it.id, title: it.title, desc: it.desc, tone: g.tone });
        if (location.hash !== '#resolver') location.hash = '#resolver'; else window.scrollTo(0, 0);
      }
    });
    $('next-step').addEventListener('click', function () { reveal(state.revealed); });
    window.addEventListener('hashchange', route);
    loadModel('mec2', MODELS.mec2.presets[0].vals, false, null);
    route();
    setupStatus();
    setupPwa();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
