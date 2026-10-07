// Lo que la familia ha marcado, en memoria y en el dispositivo, y la fecha de hoy.
import { computed, signal } from '@preact/signals';
import { almacenDelNavegador, claveProgreso, conElemento, conRecord, escribir, leer } from './nucleo/almacen';
import { anoDeCurso, fechaDeDate, situacion, type Fecha } from './nucleo/calendario';
import { claveCurso, type Curso, type Datos, type Elemento, type Semilla } from './nucleo/tipos';

export const almacen = almacenDelNavegador();

/** `false` si el dispositivo no deja guardar (navegación privada): la web funciona igual, pero se olvida. */
export const hayAlmacen = almacen !== null;

export const datos = signal<Datos>(leer(almacen).datos);

export function guardar(nuevos: Datos): void {
  datos.value = nuevos;
  escribir(almacen, nuevos);
}

/** Fecha local de hoy. Se refresca al volver a la página o al navegar, por si pasó la medianoche. */
export const hoyFecha = signal<Fecha>(fechaDeDate(new Date()));
export const refrescarHoy = (): void => {
  const f = fechaDeDate(new Date());
  const antes = hoyFecha.value;
  if (f.a !== antes.a || f.m !== antes.m || f.d !== antes.d) hoyFecha.value = f;
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refrescarHoy);

export const situacionHoy = computed(() => situacion(hoyFecha.value));
export const anoCursoHoy = computed(() => anoDeCurso(hoyFecha.value));

/** Lo marcado de una semilla en el año de curso actual. */
export function marcadoDe(curso: Curso, claveSemilla: string): Semilla | undefined {
  return datos.value.progreso[claveProgreso(anoCursoHoy.value, curso)]?.[claveSemilla];
}

let persistenciaPedida = false;

function pedirPersistencia(): void {
  if (persistenciaPedida) return;
  persistenciaPedida = true;
  try {
    void navigator.storage?.persist?.();
  } catch {
    // no pasa nada: el navegador decide
  }
}

/** Marca o desmarca una casilla. Si el curso no estaba entre los guardados, lo añade. Devuelve si queda marcada. */
export function alternarElemento(curso: Curso, claveSemilla: string, elemento: Elemento): boolean {
  const ano = anoCursoHoy.value;
  const antes = marcadoDe(curso, claveSemilla)?.hecho.includes(elemento) ?? false;
  let nuevos = conElemento(datos.value, ano, curso, claveSemilla, elemento, !antes);
  const clave = claveCurso(curso);
  if (!nuevos.cursos.includes(clave)) nuevos = { ...nuevos, cursos: [...nuevos.cursos, clave], cursoActivo: nuevos.cursoActivo ?? clave };
  if (nuevos.ultimoAnoCurso === null) nuevos = { ...nuevos, ultimoAnoCurso: ano };
  if (!antes) pedirPersistencia();
  guardar(nuevos);
  return !antes;
}

/** Apunta un resultado. Solo se guarda si mejora el récord. Devuelve `true` si es un récord nuevo. */
export function apuntarRecord(curso: Curso, claveSemilla: string, valor: number): boolean {
  const anterior = marcadoDe(curso, claveSemilla)?.record;
  if (anterior !== undefined && valor <= anterior) return false;
  guardar(conRecord(datos.value, anoCursoHoy.value, curso, claveSemilla, valor));
  return true;
}
