/* Catálogo de ejercicios.
   Cada ejercicio: id, nombre, grupo muscular, equipo, nivel (1 fácil, 2 medio, 3 avanzado),
   evitar (molestias con las que NO se recomienda), tipo (c = compuesto, i = aislado,
   n = core, k = cardio), img (carpeta de imágenes) y tips.
   Las fotos vienen de free-exercise-db (dominio público). */
(function () {
  const L = [];
  function E(id, nombre, grupo, equipo, nivel, evitar, tipo, img, tips) {
    L.push({ id, nombre, grupo, equipo, nivel, evitar, tipo, img, tips });
  }

  // ---------- Piernas ----------
  E('sentadilla_barra', 'Sentadilla con barra', 'piernas', 'barra', 2, ['rodillas', 'espalda'], 'c', 'Barbell_Squat', [
    'Pies al ancho de hombros, puntas un poco hacia afuera.',
    'Baja como si te sentaras hacia atrás, con el pecho arriba y la espalda recta.',
    'Las rodillas siguen la línea de las puntas; no dejes que se metan.']);
  E('prensa', 'Prensa de piernas', 'piernas', 'maquina', 1, [], 'c', 'Leg_Press', [
    'Pies al ancho de hombros a media plataforma.',
    'Baja hasta unos 90° sin que la cadera se despegue del asiento.',
    'No bloquees las rodillas al estirar.']);
  E('sentadilla_goblet', 'Sentadilla goblet', 'piernas', 'mancuernas', 1, [], 'c', 'Goblet_Squat', [
    'Sostén la mancuerna pegada al pecho con las dos manos.',
    'Baja entre tus rodillas con el torso erguido.',
    'Empuja el piso con todo el pie, no solo con las puntas.']);
  E('sentadilla_smith', 'Sentadilla en Smith', 'piernas', 'maquina', 1, ['rodillas'], 'c', 'Smith_Machine_Squat', [
    'Coloca los pies un poco adelante de la barra.',
    'Baja controlado hasta que los muslos queden paralelos al piso.',
    'Mantén la espalda pegada a su curva natural, sin redondear.']);
  E('hack', 'Sentadilla hack', 'piernas', 'maquina2', 2, ['rodillas'], 'c', 'Hack_Squat', [
    'Espalda y cadera bien apoyadas en el respaldo.',
    'Baja lento, sube fuerte, sin rebotar abajo.',
    'No bloquees las rodillas arriba.']);
  E('sentadilla_mancuernas', 'Sentadilla con mancuernas', 'piernas', 'mancuernas', 1, [], 'c', 'Dumbbell_Squat', [
    'Mancuernas a los lados, brazos relajados.',
    'Cadera hacia atrás y pecho arriba al bajar.',
    'Sube apretando glúteos sin inclinarte al frente.']);
  E('sentadilla_libre', 'Sentadilla sin peso', 'piernas', 'cuerpo', 1, [], 'c', 'Bodyweight_Squat', [
    'Brazos al frente para equilibrarte.',
    'Baja hasta donde puedas mantener los talones en el piso.',
    'Controla la bajada: 2 segundos abajo, 1 arriba.']);
  E('desplante_mancuernas', 'Desplantes con mancuernas', 'piernas', 'mancuernas', 1, ['rodillas'], 'c', 'Dumbbell_Lunges', [
    'Da un paso largo; las dos rodillas llegan a unos 90°.',
    'El torso se queda derecho, mirada al frente.',
    'Empuja con el talón de la pierna de adelante para regresar.']);
  E('sentadilla_bulgara', 'Sentadilla búlgara', 'piernas', 'mancuernas', 2, ['rodillas'], 'c', 'Split_Squat_with_Dumbbells', [
    'Empeine de atrás apoyado en el banco.',
    'Baja recto, la rodilla de adelante no rebasa mucho la punta.',
    'Empieza con poco peso: el equilibrio es lo difícil.']);
  E('step_up', 'Subidas al banco', 'piernas', 'mancuernas', 1, [], 'c', 'Dumbbell_Step_Ups', [
    'Apoya todo el pie sobre el banco.',
    'Sube empujando con la pierna de arriba, no te impulses con la de abajo.',
    'Baja lento y controlado.']);
  E('desplante_atras', 'Desplante hacia atrás', 'piernas', 'mancuernas', 1, [], 'c', 'Dumbbell_Rear_Lunge', [
    'Da el paso hacia atrás: es más amable con las rodillas.',
    'Baja la rodilla de atrás casi hasta el piso.',
    'Mantén el peso en el talón de adelante.']);
  E('desplante_caminando', 'Desplantes caminando', 'piernas', 'cuerpo', 1, ['rodillas'], 'c', 'Bodyweight_Walking_Lunge', [
    'Pasos largos y torso erguido.',
    'La rodilla de atrás baja cerca del piso sin golpearlo.',
    'Aprieta el abdomen para no tambalearte.']);
  E('extension_pierna', 'Extensión de pierna', 'piernas', 'maquina', 1, ['rodillas'], 'i', 'Leg_Extensions', [
    'Ajusta el rodillo arriba del empeine, rodillas alineadas al eje de la máquina.',
    'Estira y aprieta el cuádriceps 1 segundo arriba.',
    'Baja lento, sin dejar caer el peso.']);
  E('curl_femoral_acostado', 'Curl femoral acostado', 'piernas', 'maquina', 1, [], 'i', 'Lying_Leg_Curls', [
    'Cadera pegada al banco todo el tiempo.',
    'Lleva los talones hacia los glúteos sin jalones.',
    'Baja en 2 o 3 segundos.']);
  E('curl_femoral_sentado', 'Curl femoral sentado', 'piernas', 'maquina', 1, [], 'i', 'Seated_Leg_Curl', [
    'Espalda bien apoyada y el cojín sujetando los muslos.',
    'Flexiona hasta abajo y aprieta.',
    'Regresa controlando el peso.']);
  E('pantorrilla_parado', 'Pantorrilla de pie', 'piernas', 'maquina', 1, [], 'i', 'Standing_Calf_Raises', [
    'Sube lo más alto que puedas sobre las puntas.',
    'Pausa 1 segundo arriba.',
    'Baja hasta sentir el estirón, sin rebotar.']);
  E('pantorrilla_sentado', 'Pantorrilla sentado', 'piernas', 'maquina', 1, [], 'i', 'Seated_Calf_Raise', [
    'Apoya solo la punta del pie en la plataforma.',
    'Recorrido completo: abajo estira, arriba aprieta.',
    'Movimiento lento, sin impulso.']);
  E('pantorrilla_mancuerna', 'Pantorrilla con mancuernas', 'piernas', 'mancuernas', 1, [], 'i', 'Standing_Dumbbell_Calf_Raise', [
    'Párate en un escalón o disco para tener más recorrido.',
    'Sube a las puntas y sostén 1 segundo.',
    'Rodillas casi estiradas todo el tiempo.']);
  E('pantorrilla_prensa', 'Pantorrilla en prensa', 'piernas', 'maquina', 1, [], 'i', 'Calf_Press_On_The_Leg_Press_Machine', [
    'Solo las puntas en el borde de la plataforma.',
    'Empuja con los dedos y aprieta arriba.',
    'No quites los seguros de la prensa.']);

  // ---------- Glúteos y cadena posterior ----------
  E('peso_muerto_rumano', 'Peso muerto rumano', 'gluteos', 'barra', 2, ['espalda'], 'c', 'Romanian_Deadlift', [
    'Rodillas un poco flexionadas y fijas.',
    'Lleva la cadera hacia atrás con la barra pegada a las piernas.',
    'Baja hasta sentir el estirón atrás del muslo, con la espalda recta.']);
  E('peso_muerto', 'Peso muerto', 'gluteos', 'barra', 3, ['espalda'], 'c', 'Barbell_Deadlift', [
    'Barra sobre la mitad del pie, espalda recta y pecho arriba.',
    'Empuja el piso con las piernas; la barra sube pegada al cuerpo.',
    'No redondees la espalda: si pasa, baja el peso.']);
  E('pm_rumano_mancuernas', 'Peso muerto rumano con mancuernas', 'gluteos', 'mancuernas', 1, ['espalda'], 'c', 'Stiff-Legged_Dumbbell_Deadlift', [
    'Mancuernas al frente de los muslos.',
    'Cadera atrás, espalda recta, baja hasta media espinilla.',
    'Sube apretando los glúteos.']);
  E('hiperextension', 'Hiperextensiones', 'gluteos', 'maquina', 1, [], 'c', 'Hyperextensions_Back_Extensions', [
    'El cojín queda abajo de la cadera.',
    'Sube hasta quedar en línea recta, sin arquearte de más.',
    'Hazlo lento; agrega peso solo cuando domines el movimiento.']);
  E('hip_thrust', 'Hip thrust con barra', 'gluteos', 'barra', 2, [], 'c', 'Barbell_Hip_Thrust', [
    'Espalda alta apoyada en el banco, barra sobre la cadera con protector.',
    'Sube hasta que el torso quede paralelo al piso.',
    'Aprieta los glúteos 1 segundo arriba, barbilla al pecho.']);
  E('puente_gluteo', 'Puente de glúteo', 'gluteos', 'cuerpo', 1, [], 'c', 'Butt_Lift_Bridge', [
    'Acostado, pies cerca de los glúteos.',
    'Sube la cadera empujando con los talones.',
    'Aprieta arriba 2 segundos y baja lento.']);
  E('puente_una_pierna', 'Puente a una pierna', 'gluteos', 'cuerpo', 1, [], 'c', 'Single_Leg_Glute_Bridge', [
    'Una pierna estirada al aire, la otra empuja.',
    'Mantén la cadera nivelada, sin girarla.',
    'Mismas repeticiones con cada pierna.']);
  E('patada_polea', 'Patada de glúteo en polea', 'gluteos', 'polea', 1, [], 'i', 'One-Legged_Cable_Kickback', [
    'Inclina un poco el torso y sujétate de la máquina.',
    'Lleva la pierna atrás sin arquear la espalda baja.',
    'Aprieta el glúteo al final del recorrido.']);
  E('patada_gluteo', 'Patada de glúteo en el piso', 'gluteos', 'cuerpo', 1, [], 'i', 'Glute_Kickback', [
    'En cuatro puntos, abdomen firme.',
    'Sube el talón hacia el techo con la rodilla a 90°.',
    'No dejes que la espalda baja se hunda.']);
  E('abductor', 'Abductor en máquina', 'gluteos', 'maquina2', 1, [], 'i', 'Thigh_Abductor', [
    'Espalda apoyada, abre las piernas contra los cojines.',
    'Pausa 1 segundo con las piernas abiertas.',
    'Cierra lento, sin dejar que las placas choquen.']);

  // ---------- Pecho ----------
  E('press_banca', 'Press de banca', 'pecho', 'barra', 2, ['hombros'], 'c', 'Barbell_Bench_Press_-_Medium_Grip', [
    'Junta los omóplatos y mantén los pies firmes en el piso.',
    'Baja la barra a medio pecho con los codos a unos 45° del cuerpo.',
    'Pide ayuda o usa seguros cuando subas el peso.']);
  E('press_mancuernas', 'Press con mancuernas', 'pecho', 'mancuernas', 1, [], 'c', 'Dumbbell_Bench_Press', [
    'Baja las mancuernas a los lados del pecho.',
    'Codos a unos 45° del cuerpo, no totalmente abiertos.',
    'Sube juntándolas un poco arriba, sin chocarlas.']);
  E('press_maquina', 'Press de pecho en máquina', 'pecho', 'maquina', 1, [], 'c', 'Machine_Bench_Press', [
    'Ajusta el asiento para que los agarres queden a media altura del pecho.',
    'Espalda y cabeza pegadas al respaldo.',
    'Empuja sin bloquear los codos y regresa lento.']);
  E('lagartijas', 'Lagartijas', 'pecho', 'cuerpo', 1, [], 'c', 'Pushups', [
    'Cuerpo en línea recta de la cabeza a los talones.',
    'Manos un poco más abiertas que los hombros.',
    'Baja el pecho casi al piso; si cuesta, apoya las rodillas.']);
  E('lagartijas_inclinadas', 'Lagartijas con manos elevadas', 'pecho', 'cuerpo', 1, [], 'c', 'Incline_Push-Up', [
    'Manos sobre un banco: es la versión más fácil.',
    'Abdomen apretado, cadera sin caerse.',
    'Baja el pecho hasta el borde del banco.']);
  E('press_inclinado_mancuernas', 'Press inclinado con mancuernas', 'pecho', 'mancuernas', 1, [], 'c', 'Incline_Dumbbell_Press', [
    'Banco a unos 30°.',
    'Baja las mancuernas a la parte alta del pecho.',
    'No arquees de más la espalda baja.']);
  E('press_inclinado_barra', 'Press inclinado con barra', 'pecho', 'barra', 2, ['hombros'], 'c', 'Barbell_Incline_Bench_Press_-_Medium_Grip', [
    'Banco a 30 o 45°.',
    'La barra baja a la parte alta del pecho, debajo de la clavícula.',
    'Muñecas rectas y omóplatos juntos.']);
  E('press_inclinado_maquina', 'Press inclinado en máquina', 'pecho', 'maquina2', 1, [], 'c', 'Leverage_Incline_Chest_Press', [
    'Asiento ajustado para que los agarres queden a la altura del pecho alto.',
    'Empuja hacia arriba y al frente.',
    'Regresa lento hasta sentir el estirón.']);
  E('lagartijas_declinadas', 'Lagartijas con pies elevados', 'pecho', 'cuerpo', 2, ['hombros'], 'c', 'Decline_Push-Up', [
    'Pies sobre un banco, manos en el piso.',
    'Trabaja más la parte alta del pecho y los hombros.',
    'No dejes que la cadera se hunda.']);
  E('aperturas_mancuernas', 'Aperturas con mancuernas', 'pecho', 'mancuernas', 1, ['hombros'], 'i', 'Dumbbell_Flyes', [
    'Codos un poco flexionados y fijos, como abrazando un árbol.',
    'Baja solo hasta la altura del pecho.',
    'Usa menos peso que en el press.']);
  E('pec_deck', 'Pec deck (mariposa)', 'pecho', 'maquina', 1, [], 'i', 'Butterfly', [
    'Espalda pegada al respaldo.',
    'Junta los brazos al frente y aprieta el pecho 1 segundo.',
    'Abre lento, sin pasar la línea de los hombros.']);
  E('cruce_poleas', 'Cruce de poleas', 'pecho', 'polea', 2, [], 'i', 'Cable_Crossover', [
    'Un pie adelante y el torso un poco inclinado.',
    'Junta las manos al frente con los codos semiflexionados.',
    'Regresa controlando, sin que los brazos se vayan muy atrás.']);

  // ---------- Hombros ----------
  E('press_hombro_mancuernas', 'Press de hombro con mancuernas', 'hombros', 'mancuernas', 1, ['hombros'], 'c', 'Dumbbell_Shoulder_Press', [
    'Sentado con la espalda apoyada.',
    'Mancuernas a la altura de las orejas, codos un poco al frente.',
    'Sube sin arquear la espalda baja.']);
  E('press_militar', 'Press militar con barra', 'hombros', 'barra', 2, ['hombros', 'espalda'], 'c', 'Standing_Military_Press', [
    'Aprieta abdomen y glúteos para no arquearte.',
    'La barra sube en línea recta y pasa cerca de la cara.',
    'Termina con la barra sobre la cabeza, no al frente.']);
  E('press_hombro_maquina', 'Press de hombro en máquina', 'hombros', 'maquina', 1, [], 'c', 'Machine_Shoulder_Military_Press', [
    'Ajusta el asiento para que los agarres queden a la altura de los hombros.',
    'Empuja hacia arriba sin bloquear los codos.',
    'Espalda pegada al respaldo todo el tiempo.']);
  E('press_arnold', 'Press Arnold', 'hombros', 'mancuernas', 2, ['hombros'], 'c', 'Arnold_Dumbbell_Press', [
    'Empieza con las palmas hacia ti, frente al pecho.',
    'Gira las muñecas mientras subes.',
    'Hazlo lento; usa menos peso que en el press normal.']);
  E('elevacion_lateral', 'Elevaciones laterales', 'hombros', 'mancuernas', 1, [], 'i', 'Side_Lateral_Raise', [
    'Sube los brazos a los lados hasta la altura de los hombros.',
    'Codos un poco flexionados, guía con el codo y no con la mano.',
    'Poco peso y sin balancear el cuerpo.']);
  E('elevacion_lateral_polea', 'Elevación lateral en polea', 'hombros', 'polea', 1, [], 'i', 'Standing_Low-Pulley_Deltoid_Raise', [
    'Polea abajo, del lado contrario al brazo que trabaja.',
    'Sube hasta la altura del hombro.',
    'Baja lento: el cable jala todo el recorrido.']);
  E('face_pull', 'Face pull', 'hombros', 'polea', 1, [], 'i', 'Face_Pull', [
    'Polea a la altura de la cara, con cuerda.',
    'Jala hacia la frente abriendo los codos hacia afuera.',
    'Junta los omóplatos al final. Muy bueno para la postura.']);
  E('pec_deck_inverso', 'Pec deck inverso', 'hombros', 'maquina', 1, [], 'i', 'Reverse_Machine_Flyes', [
    'Pecho contra el respaldo.',
    'Abre los brazos hacia atrás con los codos casi estirados.',
    'Aprieta atrás del hombro y regresa lento.']);
  E('pajaros', 'Pájaros con mancuernas', 'hombros', 'mancuernas', 1, [], 'i', 'Seated_Bent-Over_Rear_Delt_Raise', [
    'Sentado, con el pecho cerca de los muslos.',
    'Abre los brazos a los lados con los codos un poco flexionados.',
    'Peso ligero y movimiento controlado.']);

  // ---------- Espalda ----------
  E('jalon_pecho', 'Jalón al pecho', 'espalda', 'polea', 1, [], 'c', 'Wide-Grip_Lat_Pulldown', [
    'Agarre un poco más ancho que los hombros.',
    'Jala la barra a la parte alta del pecho llevando los codos hacia abajo.',
    'No te impulses hacia atrás con el cuerpo.']);
  E('dominadas', 'Dominadas', 'espalda', 'barra_fija', 3, [], 'c', 'Pullups', [
    'Empieza colgado con los brazos estirados.',
    'Sube hasta pasar la barbilla sobre la barra.',
    'Baja lento; no te dejes caer.']);
  E('chin_up', 'Dominadas supinas', 'espalda', 'barra_fija', 2, [], 'c', 'Chin-Up', [
    'Palmas hacia ti, agarre al ancho de hombros.',
    'Lleva el pecho hacia la barra.',
    'También trabaja mucho el bíceps.']);
  E('jalon_cerrado', 'Jalón con agarre cerrado', 'espalda', 'polea', 1, [], 'c', 'Close-Grip_Front_Lat_Pulldown', [
    'Agarre cerrado, torso apenas inclinado hacia atrás.',
    'Lleva los codos pegados al cuerpo hacia abajo.',
    'Estira bien los brazos arriba.']);
  E('dominada_asistida', 'Dominada asistida con liga', 'espalda', 'barra_fija', 1, [], 'c', 'Band_Assisted_Pull-Up', [
    'Amarra la liga a la barra y apoya la rodilla o el pie.',
    'Sube con el pecho hacia la barra.',
    'Usa una liga más delgada conforme te hagas fuerte.']);
  E('remo_polea', 'Remo sentado en polea', 'espalda', 'polea', 1, [], 'c', 'Seated_Cable_Rows', [
    'Espalda recta y pecho arriba.',
    'Jala hacia el abdomen juntando los omóplatos.',
    'No te balancees hacia atrás para jalar.']);
  E('remo_barra', 'Remo con barra', 'espalda', 'barra', 2, ['espalda'], 'c', 'Bent_Over_Barbell_Row', [
    'Torso inclinado a unos 45°, espalda recta.',
    'Jala la barra hacia el ombligo.',
    'Si la espalda se redondea, baja el peso.']);
  E('remo_mancuerna', 'Remo con mancuerna a una mano', 'espalda', 'mancuernas', 1, [], 'c', 'One-Arm_Dumbbell_Row', [
    'Mano y rodilla apoyadas en el banco, espalda plana.',
    'Jala la mancuerna hacia la cadera, codo pegado al cuerpo.',
    'No gires el torso para subirla.']);
  E('remo_maquina', 'Remo en máquina', 'espalda', 'maquina', 1, [], 'c', 'Leverage_Iso_Row', [
    'Pecho apoyado en el cojín.',
    'Jala llevando los codos hacia atrás.',
    'Aprieta la espalda 1 segundo y regresa lento.']);
  E('remo_t', 'Remo en barra T', 'espalda', 'barra', 2, ['espalda'], 'c', 'T-Bar_Row_with_Handle', [
    'Rodillas flexionadas y espalda recta.',
    'Jala hacia el pecho bajo.',
    'Sin jalones: el torso no debe subir y bajar.']);
  E('remo_invertido', 'Remo invertido', 'espalda', 'barra_fija', 2, [], 'c', 'Inverted_Row', [
    'Cuerpo recto debajo de una barra baja.',
    'Jala el pecho hacia la barra.',
    'Más fácil con las rodillas flexionadas.']);
  E('remo_inclinado_mancuernas', 'Remo con pecho apoyado', 'espalda', 'mancuernas', 1, [], 'c', 'Dumbbell_Incline_Row', [
    'Pecho sobre un banco inclinado: cuida la espalda baja.',
    'Jala las mancuernas hacia la cadera.',
    'Junta los omóplatos arriba.']);
  E('superman', 'Superman', 'espalda', 'cuerpo', 1, [], 'c', 'Superman', [
    'Boca abajo, brazos estirados al frente.',
    'Levanta brazos y piernas al mismo tiempo unos centímetros.',
    'Sostén 2 segundos arriba y baja lento.']);

  // ---------- Bíceps ----------
  E('curl_barra', 'Curl con barra', 'biceps', 'barra', 1, [], 'i', 'Barbell_Curl', [
    'Codos pegados al cuerpo.',
    'Sube sin balancear la espalda.',
    'Baja lento hasta estirar casi por completo.']);
  E('curl_mancuernas', 'Curl con mancuernas', 'biceps', 'mancuernas', 1, [], 'i', 'Dumbbell_Bicep_Curl', [
    'Gira la palma hacia arriba mientras subes.',
    'Codos quietos a los lados.',
    'Aprieta arriba y baja controlado.']);
  E('curl_martillo', 'Curl martillo', 'biceps', 'mancuernas', 1, [], 'i', 'Hammer_Curls', [
    'Palmas viéndose entre sí todo el tiempo.',
    'Sube sin mover los codos.',
    'Trabaja también el antebrazo.']);
  E('curl_predicador', 'Curl predicador', 'biceps', 'barra', 2, [], 'i', 'Preacher_Curl', [
    'Axilas pegadas al borde del cojín.',
    'Baja casi hasta estirar, sin soltar la tensión.',
    'No despegues los brazos del cojín al subir.']);
  E('curl_polea', 'Curl en polea', 'biceps', 'polea', 1, [], 'i', 'Standing_Biceps_Cable_Curl', [
    'Polea abajo, codos pegados al cuerpo.',
    'Sube y aprieta 1 segundo.',
    'La tensión del cable es constante: baja lento.']);
  E('curl_inclinado', 'Curl en banco inclinado', 'biceps', 'mancuernas', 2, [], 'i', 'Incline_Dumbbell_Curl', [
    'Banco a unos 45°, brazos colgando atrás del cuerpo.',
    'Sube sin que los codos se vayan al frente.',
    'Usa menos peso: el estirón es mayor.']);
  E('curl_concentrado', 'Curl concentrado', 'biceps', 'mancuernas', 1, [], 'i', 'Concentration_Curls', [
    'Sentado, codo apoyado en la cara interna del muslo.',
    'Sube girando el meñique hacia arriba.',
    'Sin impulso del hombro.']);

  // ---------- Tríceps ----------
  E('extension_cuerda', 'Extensión de tríceps con cuerda', 'triceps', 'polea', 1, [], 'i', 'Triceps_Pushdown_-_Rope_Attachment', [
    'Codos pegados a las costillas.',
    'Empuja hacia abajo y separa la cuerda al final.',
    'Solo se mueve el antebrazo.']);
  E('extension_polea_barra', 'Extensión de tríceps con barra', 'triceps', 'polea', 1, [], 'i', 'Triceps_Pushdown', [
    'Torso apenas inclinado al frente.',
    'Estira los brazos por completo y aprieta.',
    'Sube solo hasta que el antebrazo quede paralelo al piso.']);
  E('rompecraneos', 'Rompecráneos', 'triceps', 'barra', 2, [], 'i', 'EZ-Bar_Skullcrusher', [
    'Acostado, brazos apuntando al techo.',
    'Flexiona solo los codos y baja la barra hacia la frente.',
    'Codos apuntando arriba, sin abrirse.']);
  E('extension_tras_nuca', 'Extensión tras nuca con mancuerna', 'triceps', 'mancuernas', 1, ['hombros'], 'i', 'Standing_Dumbbell_Triceps_Extension', [
    'Sostén la mancuerna con las dos manos sobre la cabeza.',
    'Baja atrás de la nuca con los codos cerca de las orejas.',
    'Abdomen apretado para no arquearte.']);
  E('fondos_banco', 'Fondos en banco', 'triceps', 'cuerpo', 1, ['hombros'], 'c', 'Bench_Dips', [
    'Manos en el borde del banco, espalda pegada a él.',
    'Baja hasta que los codos lleguen a 90°.',
    'Con las rodillas flexionadas es más fácil.']);
  E('fondos', 'Fondos en paralelas', 'triceps', 'barra_fija', 2, ['hombros'], 'c', 'Dips_-_Triceps_Version', [
    'Torso derecho para cargar más el tríceps.',
    'Baja hasta 90° en los codos.',
    'No dejes que los hombros suban hacia las orejas.']);
  E('patada_triceps', 'Patada de tríceps', 'triceps', 'mancuernas', 1, [], 'i', 'Tricep_Dumbbell_Kickback', [
    'Torso inclinado, brazo pegado al cuerpo y paralelo al piso.',
    'Estira el codo por completo y aprieta.',
    'Peso ligero y sin balanceo.']);
  E('lagartijas_cerradas', 'Lagartijas cerradas', 'triceps', 'cuerpo', 1, [], 'c', 'Push-Ups_-_Close_Triceps_Position', [
    'Manos debajo del pecho, casi juntas.',
    'Codos rozando las costillas al bajar.',
    'Apoya las rodillas si todavía no te salen completas.']);

  // ---------- Abdomen y core ----------
  E('plancha', 'Plancha', 'core', 'cuerpo', 1, [], 'n', 'Plank', [
    'Codos debajo de los hombros.',
    'Cuerpo en línea recta, glúteos y abdomen apretados.',
    'Respira normal; termina cuando la cadera empiece a caerse.']);
  E('crunch', 'Abdominales (crunch)', 'core', 'cuerpo', 1, [], 'n', 'Crunches', [
    'Despega solo los omóplatos del piso.',
    'No jales el cuello con las manos.',
    'Saca el aire al subir.']);
  E('elevacion_piernas_colgado', 'Elevación de piernas colgado', 'core', 'barra_fija', 2, [], 'n', 'Hanging_Leg_Raise', [
    'Colgado de la barra, sin columpiarte.',
    'Sube las piernas hasta la altura de la cadera.',
    'Con las rodillas flexionadas es más fácil.']);
  E('crunch_polea', 'Crunch en polea', 'core', 'polea', 1, [], 'n', 'Cable_Crunch', [
    'De rodillas, cuerda a los lados de la cabeza.',
    'Enrolla el torso llevando los codos a las rodillas.',
    'La cadera se queda quieta.']);
  E('giro_ruso', 'Giro ruso', 'core', 'cuerpo', 1, ['espalda'], 'n', 'Russian_Twist', [
    'Sentado, torso inclinado hacia atrás y espalda recta.',
    'Gira los hombros de lado a lado, no solo los brazos.',
    'Pies en el piso para hacerlo más fácil.']);
  E('dead_bug', 'Dead bug', 'core', 'cuerpo', 1, [], 'n', 'Dead_Bug', [
    'Boca arriba, espalda baja pegada al piso.',
    'Estira un brazo y la pierna contraria al mismo tiempo.',
    'Lento y controlado. Muy seguro para la espalda.']);
  E('crunch_inverso', 'Crunch inverso', 'core', 'cuerpo', 1, [], 'n', 'Reverse_Crunch', [
    'Boca arriba, rodillas a 90°.',
    'Despega la cadera del piso llevando las rodillas al pecho.',
    'Baja lento, sin impulso.']);
  E('escaladores', 'Escaladores', 'core', 'cuerpo', 1, [], 'n', 'Mountain_Climbers', [
    'Posición de lagartija, manos debajo de los hombros.',
    'Lleva las rodillas al pecho alternando rápido.',
    'Cadera abajo, sin levantarla.']);
  E('plancha_lateral', 'Plancha lateral', 'core', 'cuerpo', 1, [], 'n', 'Side_Bridge', [
    'Codo debajo del hombro, cuerpo en línea recta.',
    'No dejes caer la cadera.',
    'Mismo tiempo de cada lado.']);
  E('elevacion_piernas_banco', 'Elevación de piernas acostado', 'core', 'cuerpo', 1, ['espalda'], 'n', 'Flat_Bench_Lying_Leg_Raise', [
    'Acostado, manos sujetando el banco o bajo la cadera.',
    'Sube las piernas casi rectas hasta la vertical.',
    'Baja lento sin tocar el piso y sin arquear la espalda.']);

  // ---------- Cardio ----------
  E('caminadora', 'Caminata en caminadora', 'cardio', 'cardio', 1, [], 'k', 'Walking_Treadmill', [
    'Paso rápido: debes poder hablar, pero no cantar.',
    'Sube la inclinación para más intensidad sin impacto.',
    'No te cuelgues de los barandales.']);
  E('trote', 'Trote en caminadora', 'cardio', 'cardio', 2, ['rodillas'], 'k', 'Jogging_Treadmill', [
    'Ritmo cómodo y constante.',
    'Pisa suave, con pasos cortos.',
    'Si molestan las rodillas, cambia a bici o elíptica.']);
  E('bici', 'Bicicleta fija', 'cardio', 'cardio', 1, [], 'k', 'Bicycling_Stationary', [
    'Ajusta el asiento: la pierna casi estirada abajo.',
    'Resistencia media y cadencia constante.',
    'Cero impacto para las rodillas.']);
  E('eliptica', 'Elíptica', 'cardio', 'cardio', 1, [], 'k', 'Elliptical_Trainer', [
    'Espalda recta, sin encorvarte sobre los manubrios.',
    'Empuja y jala también con los brazos.',
    'Bajo impacto: buena opción si pesan las articulaciones.']);
  E('remo_cardio', 'Remadora', 'cardio', 'cardio', 2, ['espalda'], 'k', 'Rowing_Stationary', [
    'Orden: piernas, torso, brazos; al regresar, al revés.',
    'Espalda recta todo el tiempo.',
    'El impulso viene de las piernas.']);
  E('escaladora', 'Escaladora', 'cardio', 'cardio', 2, ['rodillas'], 'k', 'Step_Mill', [
    'Apoya el pie completo en cada escalón.',
    'No te recargues en los barandales.',
    'Ritmo constante que puedas sostener.']);
  E('cuerda', 'Saltar la cuerda', 'cardio', 'cuerpo', 2, ['rodillas'], 'k', 'Rope_Jumping', [
    'Saltos bajos, sobre las puntas.',
    'Gira con las muñecas, no con los brazos.',
    'Alterna 1 minuto de salto y 30 segundos de descanso.']);
  E('caminata', 'Caminata rápida', 'cardio', 'cuerpo', 1, [], 'k', 'Trail_Running_Walking', [
    'Paso ligero que te suba el pulso.',
    'Brazos activos, espalda erguida.',
    'Se puede hacer en cualquier lugar, sin equipo.']);

  const byId = {};
  L.forEach(e => { byId[e.id] = e; });

  // Qué ejercicios pueden ocupar cada "hueco" de una sesión, en orden de preferencia.
  const SLOTS = {
    squat: ['sentadilla_barra', 'prensa', 'sentadilla_goblet', 'sentadilla_smith', 'hack', 'sentadilla_mancuernas', 'sentadilla_libre'],
    squat2: ['prensa', 'hack', 'sentadilla_smith', 'sentadilla_goblet', 'sentadilla_barra', 'sentadilla_mancuernas', 'sentadilla_libre'],
    lunge: ['desplante_mancuernas', 'sentadilla_bulgara', 'desplante_atras', 'step_up', 'desplante_caminando'],
    hinge: ['peso_muerto_rumano', 'peso_muerto', 'pm_rumano_mancuernas', 'hiperextension', 'puente_gluteo'],
    glute: ['hip_thrust', 'puente_una_pierna', 'puente_gluteo', 'hiperextension'],
    gluteiso: ['patada_polea', 'abductor', 'patada_gluteo'],
    quadiso: ['extension_pierna', 'step_up', 'sentadilla_libre'],
    hamcurl: ['curl_femoral_acostado', 'curl_femoral_sentado', 'puente_una_pierna'],
    calves: ['pantorrilla_parado', 'pantorrilla_sentado', 'pantorrilla_prensa', 'pantorrilla_mancuerna'],
    hpush: ['press_banca', 'press_mancuernas', 'press_maquina', 'lagartijas', 'lagartijas_inclinadas'],
    incline: ['press_inclinado_mancuernas', 'press_inclinado_barra', 'press_inclinado_maquina', 'lagartijas_declinadas', 'lagartijas'],
    fly: ['pec_deck', 'aperturas_mancuernas', 'cruce_poleas'],
    vpush: ['press_hombro_mancuernas', 'press_militar', 'press_hombro_maquina', 'press_arnold'],
    lateral: ['elevacion_lateral', 'elevacion_lateral_polea'],
    reardelt: ['face_pull', 'pec_deck_inverso', 'pajaros'],
    vpull: ['jalon_pecho', 'dominadas', 'chin_up', 'jalon_cerrado', 'dominada_asistida'],
    hpull: ['remo_polea', 'remo_barra', 'remo_mancuerna', 'remo_maquina', 'remo_t', 'remo_inclinado_mancuernas', 'remo_invertido', 'superman'],
    biceps: ['curl_barra', 'curl_mancuernas', 'curl_martillo', 'curl_polea', 'curl_predicador', 'curl_inclinado', 'curl_concentrado'],
    triceps: ['extension_cuerda', 'extension_polea_barra', 'rompecraneos', 'extension_tras_nuca', 'patada_triceps', 'fondos_banco', 'fondos', 'lagartijas_cerradas'],
    core: ['plancha', 'crunch', 'elevacion_piernas_colgado', 'crunch_polea', 'dead_bug', 'giro_ruso', 'crunch_inverso', 'plancha_lateral', 'escaladores', 'elevacion_piernas_banco'],
    cardio: ['caminadora', 'bici', 'eliptica', 'trote', 'remo_cardio', 'escaladora', 'cuerda', 'caminata']
  };

  const GRUPOS = {
    pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps',
    piernas: 'Piernas', gluteos: 'Glúteos', core: 'Abdomen', cardio: 'Cardio', otro: 'Otro'
  };

  // "root" permite cargar este archivo también desde el service worker (sw.js).
  const root = typeof window !== 'undefined' ? window : self;
  root.GYM = root.GYM || {};
  root.GYM.EXERCISES = L;
  root.GYM.EX = byId;
  root.GYM.SLOTS = SLOTS;
  root.GYM.GRUPOS = GRUPOS;
})();
