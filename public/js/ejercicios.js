/* Banco de ejemplos. Lo usan la app (variable global LP_EJERCICIOS) y el servidor (GET /api/ejercicios). */
var LP_EJERCICIOS = (function () {
  'use strict';
  // mecánico: J1, D1, K1, Dc, Kc, J2, D2, K2, par en, piden
  function mv(J1, D1, K1, Dc, Kc, J2, D2, K2, on, out) { return { J1: J1, D1: D1, K1: K1, Dc: Dc, Kc: Kc, J2: J2, D2: D2, K2: K2, on: String(on), out: String(out) }; }
  // dos mallas: R, L, C de malla 1, compartido y malla 2
  function ev(R1, L1, C1, Rc, Lc, Cc, R2, L2, C2) { return { R1: R1, L1: L1, C1: C1, Rc: Rc, Lc: Lc, Cc: Cc, R2: R2, L2: L2, C2: C2, on: '1', out: '1' }; }
  return [
    { group: 'Mecánicos: cilindros sueltos y puntos sin cilindro', tone: 'blue', desc: 'Tienen un polo en 0: la respuesta se queda en un número fijo.', items: [
      { id: 'M1', title: 'Cilindro suelto y amortiguador a la pared', desc: 'J1 = 1 suelto; resorte 1 y amortiguador 2 entre cilindros; J2 = 2 con amortiguador 1 a la pared. Piden θ2.', model: 'mec2', vals: mv(1, 0, 0, 2, 1, 2, 1, 0, 1, 2) },
      { id: 'M2', title: 'Punto sin cilindro', desc: 'J = 1 con amortiguador 2 a la pared; amortiguador 1 hasta θ2; en θ2 amortiguador 2 y resorte 2 a la pared.', model: 'mec2', vals: mv(1, 2, 0, 1, 0, 0, 2, 2, 1, 2) },
      { id: 'M3', title: 'Punto sin cilindro', desc: 'J1 = 1, amortiguador 1 a la pared; acople amortiguador 2; en θ2 amortiguador 1 y resorte 3.', model: 'mec2', vals: mv(1, 1, 0, 2, 0, 0, 1, 3, 1, 2) },
      { id: 'M4', title: 'Punto sin cilindro', desc: 'J1 = 2, amortiguador 1 a la pared; acople amortiguador 1; en θ2 amortiguador 3 y resorte 1.', model: 'mec2', vals: mv(2, 1, 0, 1, 0, 0, 3, 1, 1, 2) },
      { id: 'M5', title: 'Punto sin cilindro, resorte en θ1', desc: 'J1 = 1 con amortiguador 1 y resorte 2 a la pared; acople amortiguador 1; en θ2 amortiguador 2 y resorte 1.', model: 'mec2', vals: mv(1, 1, 2, 1, 0, 0, 2, 1, 1, 2) },
      { id: 'M6', title: 'Dos cilindros, el primero suelto', desc: 'J1 = 1; acople resorte 2 y amortiguador 1; J2 = 1 con amortiguador 2 a la pared.', model: 'mec2', vals: mv(1, 0, 0, 1, 2, 1, 2, 0, 1, 2) },
      { id: 'M7', title: 'Dos cilindros, el primero suelto', desc: 'J1 = 2; acople resorte 1 y amortiguador 1; J2 = 1 con amortiguador 1 a la pared.', model: 'mec2', vals: mv(2, 0, 0, 1, 1, 1, 1, 0, 1, 2) },
      { id: 'M8', title: 'Dos cilindros, el primero suelto', desc: 'J1 = 1; acople resorte 1 y amortiguador 1; J2 = 1 con amortiguador 3 a la pared.', model: 'mec2', vals: mv(1, 0, 0, 1, 1, 1, 3, 0, 1, 2) },
      { id: 'M9', title: 'Punto con resorte y amortiguador', desc: 'J = 1; entre θ1 y θ2 resorte 2 y amortiguador 1; en θ2 a la pared resorte 1 y amortiguador 2.', model: 'mec2', vals: mv(1, 0, 0, 1, 2, 0, 2, 1, 1, 2) },
      { id: 'M10', title: 'Punto sin cilindro, J = 2', desc: 'J = 2; entre θ1 y θ2 resorte 1 y amortiguador 1; en θ2 resorte 3 y amortiguador 1.', model: 'mec2', vals: mv(2, 0, 0, 1, 1, 0, 1, 3, 1, 2) }
    ] },
    { group: 'Mecánicos: dos cilindros entre paredes', tone: 'black', desc: 'Inversas de cuarto grado: polos sin i y pares con i.', items: [
      { id: 'M11', title: 'Mismo lugar del par y lo que piden', desc: 'J = 1, 1; D = 1, 2, 1; K = 1, 3, 2. T en J1, piden θ1.', model: 'mec2', vals: mv(1, 1, 1, 2, 3, 1, 1, 2, 1, 1) },
      { id: 'M12', title: 'Dos pares con i', desc: 'J = 2, 1; D = 1, 1, 2; K = 3, 2, 2. T en J2, piden θ2.', model: 'mec2', vals: mv(2, 1, 3, 1, 2, 1, 2, 2, 2, 2) },
      { id: 'M13', title: 'Par en J2, piden θ1', desc: 'J = 1, 1; D = 2, 3, 2; K = 2, 4, 1.', model: 'mec2', vals: mv(1, 2, 2, 3, 4, 1, 2, 1, 2, 1) },
      { id: 'M14', title: 'Par en J1, piden θ2', desc: 'J = 1, 2; D = 1, 2, 1; K = 2, 1, 1.', model: 'mec2', vals: mv(1, 1, 2, 2, 1, 2, 1, 1, 1, 2) },
      { id: 'M15', title: 'Par en J2, piden θ2', desc: 'J = 1, 1; D = 3, 1, 1; K = 1, 2, 3.', model: 'mec2', vals: mv(1, 3, 1, 1, 2, 1, 1, 3, 2, 2) }
    ] },
    { group: 'Inversas de Laplace', tone: 'green', desc: 'Te dan la fracción y la regresas al tiempo.', items: [
      { id: 'I1', title: 'Cuatro polos sin i', desc: 'G = (2s + 1) / ((s+1)(s+2)(s+3)(s+4))', model: 'inv', vals: { num: '2 1', den: '1 10 35 50 24' } },
      { id: 'I2', title: 'Dos sin i y un par con i', desc: 'G = (s + 4) / ((s+1)(s+3)(s² + 2s + 5))', model: 'inv', vals: { num: '1 4', den: '1 6 16 26 15' } },
      { id: 'I3', title: 'Dos pares con i', desc: 'G = s / ((s² + 2s + 2)(s² + 4s + 13))', model: 'inv', vals: { num: '1 0', den: '1 6 23 34 26' } },
      { id: 'I4', title: 'Grado 3', desc: 'G = 3s / (s³ + 3s² + 7s + 5)', model: 'inv', vals: { num: '3 0', den: '1 3 7 5' } },
      { id: 'I5', title: 'Saca el 2 primero', desc: 'G = (s + 1) / (2s⁴ + 3s³ + 6s² + 4s + 2)', model: 'inv', vals: { num: '1 1', den: '2 3 6 4 2' } },
      { id: 'I6', title: 'Un par que crece', desc: 'G = 3s / (3s⁴ + 2s³ + 5s² + 3s + 2). Uno de los pares tiene parte real positiva.', model: 'inv', vals: { num: '3 0', den: '3 2 5 3 2' } }
    ] },
    { group: 'Circuitos eléctricos', tone: 'red', desc: 'Dos mallas y RLC en serie: misma receta, otras piezas.', items: [
      { id: 'C1', title: 'Dos mallas con dos bobinas', desc: 'Resistencias 2 y 3; bobinas de 2s en el centro y a la derecha. Piden I1.', model: 'ele2', vals: ev(2, 0, 0, 0, 2, 0, 3, 2, 0) },
      { id: 'C2', title: 'Dos mallas', desc: 'R1 = 2, bobina central s, R2 = 4, bobina derecha 2s.', model: 'ele2', vals: ev(2, 0, 0, 0, 1, 0, 4, 2, 0) },
      { id: 'C3', title: 'Dos mallas', desc: 'R1 = 4, bobina central 2s, R2 = 6, bobina derecha 2s.', model: 'ele2', vals: ev(4, 0, 0, 0, 2, 0, 6, 2, 0) },
      { id: 'C4', title: 'Dos mallas con bobina de ¼s', desc: 'R1 = 2, bobina central 2s, R2 = 3, bobina derecha ¼s.', model: 'ele2', vals: ev(2, 0, 0, 0, 2, 0, 3, 0.25, 0) },
      { id: 'C5', title: 'RLC con par con i', desc: 'Bobina s, resistencia 2, capacitor 10/s.', model: 'rlc', vals: { L: 1, R: 2, C: 10 } },
      { id: 'C6', title: 'RLC en serie', desc: 'Bobina 2s, resistencia 2, capacitor 4/s.', model: 'rlc', vals: { L: 2, R: 2, C: 4 } }
    ] }
  ];
})();
if (typeof module !== 'undefined' && module.exports) module.exports = LP_EJERCICIOS;
