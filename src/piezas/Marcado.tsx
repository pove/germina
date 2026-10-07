import { partirMarcado } from '../nucleo/marcado';

/** Un texto de contenido: lo que va entre {{…}} se pinta aislado de izquierda a derecha (operaciones en árabe). */
export function Marcado({ texto }: { texto: string }) {
  return (
    <>
      {partirMarcado(texto).map((s, i) =>
        s.tipo === 'operacion' ? (
          <bdi key={i} dir="ltr">
            {s.valor}
          </bdi>
        ) : (
          s.valor
        ),
      )}
    </>
  );
}
