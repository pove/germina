// Palabras de Germina (especificación, 5.4): no aparecen en la interfaz ni en el contenido,
// en ningún idioma, ni siquiera para negarlas. Se buscan como palabra completa, sin mayúsculas.
export const PALABRAS_PROHIBIDAS = [
  // es
  'deberes', 'tarea', 'tareas', 'ficha', 'fichas', 'ejercicio', 'ejercicios', 'repaso', 'repasos', 'repasar',
  'examen', 'exámenes', 'examenes', 'prueba', 'pruebas', 'nota', 'notas', 'evaluar', 'evaluación', 'corregir',
  'solución', 'soluciones', 'obligatorio', 'obligatoria', 'obligatorios', 'obligatorias',
  'progreso', 'progresos', 'rendimiento', 'guerra', 'batalla',
  // va
  'deures', 'tasca', 'tasques', 'fitxa', 'fitxes', 'exercici', 'exercicis', 'repàs', 'repassar',
  'exàmens', 'prova', 'proves', 'avaluar', 'solució', 'solucions',
  'obligatori', 'obligatòria', 'obligatoris', 'obligatòries', 'progrés', 'rendiment',
  // en
  'homework', 'worksheet', 'worksheets', 'test', 'tests', 'exercise', 'exercises', 'exam', 'exams',
  'solution', 'solutions', 'mandatory', 'compulsory', 'obligatory', 'progress', 'battle', 'war',
  // fr
  'devoirs', 'fiche', 'fiches', 'exercice', 'exercices', 'contrôle', 'contrôles', 'examens',
  'corriger', 'obligatoire', 'obligatoires', 'progrès', 'évaluer', 'guerre', 'bataille',
  // ar
  'واجب', 'واجبات', 'تمرين', 'تمارين', 'امتحان', 'امتحانات', 'اختبار', 'اختبارات', 'حرب', 'معركة',
];

const letra = String.raw`[\p{L}\p{M}\p{N}_]`;
const regex = new RegExp(`(?<!${letra})(${PALABRAS_PROHIBIDAS.join('|')})(?!${letra})`, 'giu');

/** Devuelve las palabras prohibidas que aparecen en el texto (sin repetir). */
export function palabrasProhibidasEn(texto) {
  return [...new Set([...texto.matchAll(regex)].map((m) => m[1].toLowerCase()))];
}
