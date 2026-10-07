import { useEffect } from 'preact/hooks';
import catalogoJson from '../config/catalogo.json';
import { irA, ruta } from './enrutador';
import { anoCursoHoy, datos, refrescarHoy, situacionHoy } from './estado';
import { hayCambioDeAno } from './nucleo/cambio-de-curso';
import { esCursoActivo, type Catalogo } from './nucleo/catalogo';
import { destinoInicio } from './nucleo/inicio';
import { construir, cursoDe, type Ruta } from './nucleo/rutas';
import { Aprenden } from './pantallas/Aprenden';
import { Ajustes } from './pantallas/Ajustes';
import { Ayuda } from './pantallas/Ayuda';
import { Bienvenida } from './pantallas/Bienvenida';
import { CambioDeCurso } from './pantallas/CambioDeCurso';
import { Jardin } from './pantallas/Jardin';
import { Pregunta } from './pantallas/Pregunta';
import { Reto } from './pantallas/Reto';
import { Semana } from './pantallas/Semana';
import { Layout } from './piezas/Layout';

const catalogo = catalogoJson as Catalogo;

/** Una ruta desconocida, `#/` o un curso que no está activo llevan a la semana actual (o a la bienvenida). */
function redireccion(r: Ruta): Ruta | null {
  const sinSentido = r.tipo === 'inicio' || r.tipo === 'desconocida' || ('ciclo' in r && !esCursoActivo(r, catalogo));
  return sinSentido ? destinoInicio(datos.value, situacionHoy.value) : null;
}

function Pantalla({ r }: { r: Ruta }) {
  switch (r.tipo) {
    case 'bienvenida':
      return <Bienvenida />;
    case 'semana':
      return <Semana curso={cursoDe(r)} n={r.n} verano={false} />;
    case 'verano':
      return <Semana curso={cursoDe(r)} n={r.n} verano={true} />;
    case 'pregunta':
      return <Pregunta curso={cursoDe(r)} n={r.n} p={r.p} />;
    case 'reto':
      return <Reto curso={cursoDe(r)} n={r.n} verano={false} />;
    case 'veranoReto':
      return <Reto curso={cursoDe(r)} n={r.n} verano={true} />;
    case 'jardin':
      return <Jardin curso={cursoDe(r)} />;
    case 'aprenden':
      return <Aprenden curso={cursoDe(r)} />;
    case 'ayuda':
      return <Ayuda />;
    case 'ajustes':
      return <Ajustes />;
    default:
      return null; // inicio, desconocida, recibir, imprimir, privacidad y accesibilidad: otras etapas
  }
}

export function App() {
  const r = ruta.value;
  const destino = redireccion(r);
  const clave = destino ? construir(destino) : null;

  useEffect(() => {
    refrescarHoy();
    if (destino) irA(destino, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, construir(r)]);

  if (destino) return null;
  if (hayCambioDeAno(datos.value, anoCursoHoy.value)) {
    return (
      <Layout ruta={r} sinMenu>
        <CambioDeCurso />
      </Layout>
    );
  }
  return (
    <Layout ruta={r} sinMenu={r.tipo === 'bienvenida'}>
      <Pantalla key={construir(r)} r={r} />
    </Layout>
  );
}
