// src/components/Marca.jsx
import { Link } from 'react-router-dom';
import { IconeLogo } from './Icones';

export default function Marca({ para = '/', subtitulo }) {
  return (
    <Link to={para} className="marca" aria-label={`Escuta${subtitulo ? `, ${subtitulo}` : ''}, início`}>
      <span className="marca-icone">
        <IconeLogo />
      </span>
      <span className="marca-nome">Escuta</span>
      {subtitulo && <span className="marca-instituicao">{subtitulo}</span>}
    </Link>
  );
}
