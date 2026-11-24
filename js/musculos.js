/* Músculos que trabaja cada ejercicio y la figurita del cuerpo (frente y espalda) que los pinta.
   Cada ejercicio: [principales, secundarios]. Los principales se pintan en verde lima y los secundarios más tenues. */
(function (root) {
  const G = root.GYM;
  const NOMBRE = {
    pecho: 'Pecho', hombro: 'Hombros', hombro_post: 'Hombro posterior', biceps: 'Bíceps', triceps: 'Tríceps', antebrazo: 'Antebrazos',
    abdomen: 'Abdomen', oblicuos: 'Oblicuos', dorsal: 'Dorsales', trapecio: 'Trapecio', lumbar: 'Espalda baja',
    gluteo: 'Glúteos', cuadriceps: 'Cuádriceps', femoral: 'Femorales', aductor: 'Aductores', pantorrilla: 'Pantorrillas'
  };
  const M = (p, s) => [p.split(' '), s ? s.split(' ') : []];
  const PIERNA = M('cuadriceps gluteo', 'femoral aductor'), CURL = M('biceps', 'antebrazo'), TRI = M('triceps'), PANT = M('pantorrilla');
  const REMO = M('dorsal trapecio', 'biceps hombro_post'), PRESS = M('pecho', 'hombro triceps'), INCL = M('pecho hombro', 'triceps');
  const HOMBRO = M('hombro', 'triceps trapecio'), GLUTEO = M('gluteo', 'femoral'), AV = M('pecho', 'hombro'), POST = M('hombro_post', 'trapecio');
  const POR_EJ = {
    sentadilla_barra: M('cuadriceps gluteo', 'femoral lumbar aductor'), prensa: PIERNA, sentadilla_goblet: M('cuadriceps gluteo', 'abdomen aductor'),
    sentadilla_smith: M('cuadriceps gluteo', 'femoral'), hack: M('cuadriceps', 'gluteo'), sentadilla_mancuernas: M('cuadriceps gluteo', 'femoral'),
    sentadilla_libre: M('cuadriceps gluteo', 'femoral'), desplante_mancuernas: PIERNA, sentadilla_bulgara: PIERNA, step_up: M('cuadriceps gluteo', 'femoral'),
    desplante_atras: M('gluteo cuadriceps', 'femoral'), desplante_caminando: PIERNA, extension_pierna: M('cuadriceps'),
    curl_femoral_acostado: M('femoral', 'pantorrilla'), curl_femoral_sentado: M('femoral', 'pantorrilla'),
    pantorrilla_parado: PANT, pantorrilla_sentado: PANT, pantorrilla_mancuerna: PANT, pantorrilla_prensa: PANT,
    peso_muerto_rumano: M('femoral gluteo', 'lumbar'), peso_muerto: M('gluteo femoral lumbar', 'trapecio cuadriceps antebrazo'),
    pm_rumano_mancuernas: M('femoral gluteo', 'lumbar'), hiperextension: M('lumbar', 'gluteo femoral'),
    hip_thrust: GLUTEO, puente_gluteo: GLUTEO, puente_una_pierna: GLUTEO, patada_polea: GLUTEO, patada_gluteo: GLUTEO, abductor: M('gluteo'),
    press_banca: PRESS, press_mancuernas: PRESS, press_maquina: PRESS, lagartijas: M('pecho', 'hombro triceps abdomen'), lagartijas_inclinadas: PRESS,
    press_inclinado_mancuernas: INCL, press_inclinado_barra: INCL, press_inclinado_maquina: INCL, lagartijas_declinadas: INCL,
    aperturas_mancuernas: AV, pec_deck: AV, cruce_poleas: AV,
    press_hombro_mancuernas: HOMBRO, press_militar: HOMBRO, press_hombro_maquina: HOMBRO, press_arnold: HOMBRO,
    elevacion_lateral: M('hombro', 'trapecio'), elevacion_lateral_polea: M('hombro', 'trapecio'), face_pull: POST, pec_deck_inverso: POST, pajaros: POST,
    jalon_pecho: M('dorsal', 'biceps hombro_post'), dominadas: M('dorsal', 'biceps hombro_post'), chin_up: M('dorsal biceps', 'hombro_post'),
    jalon_cerrado: M('dorsal', 'biceps'), dominada_asistida: M('dorsal', 'biceps'),
    remo_polea: REMO, remo_barra: M('dorsal trapecio', 'biceps hombro_post lumbar'), remo_mancuerna: REMO, remo_maquina: REMO, remo_t: REMO,
    remo_invertido: M('dorsal', 'biceps hombro_post'), remo_inclinado_mancuernas: REMO, superman: M('lumbar', 'gluteo'),
    curl_barra: CURL, curl_mancuernas: CURL, curl_martillo: M('biceps antebrazo'), curl_predicador: CURL, curl_polea: CURL, curl_inclinado: CURL, curl_concentrado: CURL,
    extension_cuerda: TRI, extension_polea_barra: TRI, rompecraneos: TRI, extension_tras_nuca: TRI, patada_triceps: TRI,
    fondos_banco: M('triceps', 'pecho hombro'), fondos: M('triceps pecho', 'hombro'), lagartijas_cerradas: M('triceps', 'pecho'),
    plancha: M('abdomen', 'oblicuos hombro'), crunch: M('abdomen'), elevacion_piernas_colgado: M('abdomen', 'oblicuos antebrazo'),
    crunch_polea: M('abdomen', 'oblicuos'), giro_ruso: M('oblicuos', 'abdomen'), dead_bug: M('abdomen'), crunch_inverso: M('abdomen'),
    escaladores: M('abdomen', 'hombro cuadriceps'), plancha_lateral: M('oblicuos', 'abdomen'), elevacion_piernas_banco: M('abdomen'),
    caminadora: M('cuadriceps pantorrilla', 'gluteo femoral'), trote: M('cuadriceps pantorrilla', 'gluteo femoral'), caminata: M('cuadriceps pantorrilla', 'gluteo femoral'),
    bici: M('cuadriceps', 'pantorrilla gluteo'), eliptica: M('cuadriceps gluteo', 'pantorrilla femoral'), remo_cardio: M('dorsal cuadriceps', 'biceps gluteo'),
    escaladora: M('gluteo cuadriceps', 'pantorrilla'), cuerda: M('pantorrilla', 'hombro cuadriceps')
  };
  // Para ejercicios propios: según su zona.
  const POR_GRUPO = { pecho: PRESS, espalda: REMO, hombros: HOMBRO, biceps: CURL, triceps: TRI, piernas: PIERNA, gluteos: GLUTEO, core: M('abdomen', 'oblicuos'), cardio: M('cuadriceps pantorrilla') };
  function de(e) { return (e && (POR_EJ[e.id] || POR_GRUPO[e.grupo])) || [[], []]; }

  // Figura: cada zona es [músculo, forma SVG]. Las formas sin músculo son la base del cuerpo.
  const el = (cx, cy, rx, ry, r) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + (r ? ' transform="rotate(' + r + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
  const pa = d => '<path d="' + d + '"/>';
  const par = (f, x, ...a) => [f(x, ...a), f(100 - x, ...a.map((v, i) => i === a.length - 1 && f === el && a.length === 4 ? -v : v))];
  const BASE = [el(50, 14, 9, 11), pa('M45 22h10v9H45z'), pa('M33 32 Q50 26 67 32 L64 92 Q50 98 36 92 Z'), pa('M36 88 Q50 84 64 88 L66 104 Q50 110 34 104 Z'),
    ...par(el, 21, 96, 4, 5), ...par(el, 41, 186, 6, 4), ...par(el, 41, 140, 6, 6)];
  const FRENTE = [
    ['trapecio', pa('M45 27 L36 33 L45 34 Z')], ['trapecio', pa('M55 27 L64 33 L55 34 Z')],
    ['hombro', el(31, 38, 7, 8)], ['hombro', el(69, 38, 7, 8)],
    ['pecho', pa('M49 33 Q40 31 37 38 Q36 49 49 51 Z')], ['pecho', pa('M51 33 Q60 31 63 38 Q64 49 51 51 Z')],
    ['abdomen', '<rect x="43.5" y="53" width="13" height="34" rx="4"/>'],
    ['oblicuos', pa('M42 54 Q37 62 38 86 L42 88 Z')], ['oblicuos', pa('M58 54 Q63 62 62 86 L58 88 Z')],
    ['biceps', el(27, 56, 5, 10, 10)], ['biceps', el(73, 56, 5, 10, -10)],
    ['antebrazo', el(23, 78, 4.5, 11, 8)], ['antebrazo', el(77, 78, 4.5, 11, -8)],
    ['cuadriceps', el(41, 120, 7.5, 21, 4)], ['cuadriceps', el(59, 120, 7.5, 21, -4)],
    ['aductor', el(47.5, 112, 2.6, 12)], ['aductor', el(52.5, 112, 2.6, 12)],
    ['pantorrilla', el(40.5, 162, 5, 16)], ['pantorrilla', el(59.5, 162, 5, 16)]
  ];
  const ESPALDA = [
    ['trapecio', pa('M50 24 L35 34 L50 58 L65 34 Z')],
    ['hombro_post', el(31, 38, 7, 8)], ['hombro_post', el(69, 38, 7, 8)],
    ['dorsal', pa('M48 46 Q36 42 36 54 Q39 72 48 78 Z')], ['dorsal', pa('M52 46 Q64 42 64 54 Q61 72 52 78 Z')],
    ['lumbar', '<rect x="45" y="70" width="10" height="20" rx="3"/>'],
    ['triceps', el(27, 56, 5, 10, 10)], ['triceps', el(73, 56, 5, 10, -10)],
    ['antebrazo', el(23, 78, 4.5, 11, 8)], ['antebrazo', el(77, 78, 4.5, 11, -8)],
    ['gluteo', el(43, 100, 8, 10)], ['gluteo', el(57, 100, 8, 10)],
    ['femoral', el(41, 128, 7, 17, 3)], ['femoral', el(59, 128, 7, 17, -3)],
    ['pantorrilla', el(40.5, 160, 6, 14)], ['pantorrilla', el(59.5, 160, 6, 14)]
  ];
  function lado(zonas, p, s, x) {
    return '<g transform="translate(' + x + ' 0)"><g class="mm-base">' + BASE.join('') + '</g>' +
      zonas.map(z => '<g class="mm' + (p.indexOf(z[0]) >= 0 ? ' p' : s.indexOf(z[0]) >= 0 ? ' s' : '') + '">' + z[1] + '</g>').join('') + '</g>';
  }
  function figura(e) {
    const m = de(e);
    if (!m[0].length) return '';
    return '<svg class="mapa-m" viewBox="0 0 200 196" aria-label="Músculos que trabaja: ' + m[0].map(k => NOMBRE[k]).join(', ') + '">' + lado(FRENTE, m[0], m[1], 0) + lado(ESPALDA, m[0], m[1], 100) + '</svg>';
  }
  function texto(e) { const m = de(e); return { p: m[0].map(k => NOMBRE[k]), s: m[1].map(k => NOMBRE[k]) }; }
  G.Musculos = { figura, texto, de, NOMBRE };
})(window);
