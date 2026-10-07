import { render } from 'preact';
import { App } from './App';
import { iniciarActualizaciones } from './actualizaciones';
import { iniciarIdioma } from './idioma';
import './estilos.css';

iniciarIdioma();
render(<App />, document.getElementById('app')!);
iniciarActualizaciones();
