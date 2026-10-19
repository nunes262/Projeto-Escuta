// src/components/Cabecalho.jsx
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { INSTITUICAO } from '../config';
import Marca from './Marca';

export default function Cabecalho() {
  const { pathname } = useLocation();
  const denunciando = pathname.startsWith('/denuncia');
  const [rolou, setRolou] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // Sombra discreta quando a página rola por baixo do cabeçalho fixo
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 8);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  useEffect(() => setMenuAberto(false), [pathname]);

  return (
    <header className={rolou ? 'cabecalho rolou' : 'cabecalho'}>
      <div className="cabecalho-interno">
        <Marca subtitulo={INSTITUICAO} />
        <button
          type="button"
          className="botao-menu"
          aria-expanded={menuAberto}
          aria-controls="nav-principal"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <span aria-hidden="true" className="menu-linhas" />
          Menu
        </button>
        <nav
          id="nav-principal"
          aria-label="Principal"
          className={menuAberto ? 'nav-principal aberto' : 'nav-principal'}
        >
          <NavLink to="/como-funciona">Como funciona</NavLink>
          <NavLink to="/acompanhar">Acompanhar</NavLink>
          <NavLink to="/transparencia">Transparência</NavLink>
          {!denunciando && (
            <Link to="/denunciar" className="botao botao-primario botao-pequeno">
              Fazer denúncia
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
