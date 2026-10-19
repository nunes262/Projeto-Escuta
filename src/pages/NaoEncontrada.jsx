// src/pages/NaoEncontrada.jsx
import { Link } from 'react-router-dom';
import { useTitulo } from '../hooks/useTitulo';

export default function NaoEncontrada() {
  useTitulo('Página não encontrada');
  return (
    <section className="largura pagina-texto">
      <p className="numero-gigante" aria-hidden="true">404</p>
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter sido digitado errado ou a página mudou de lugar.</p>
      <div className="acoes">
        <Link to="/" className="botao botao-primario">
          Ir para o início
        </Link>
        <Link to="/acompanhar" className="botao botao-secundario">
          Acompanhar denúncia
        </Link>
      </div>
    </section>
  );
}
