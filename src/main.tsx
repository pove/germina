import { render } from 'preact';
import { App } from './App';
import { iniciarIdioma } from './idioma';
import './estilos.css';

iniciarIdioma();
render(<App />, document.getElementById('app')!);
