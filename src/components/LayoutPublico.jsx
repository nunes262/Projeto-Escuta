// src/components/LayoutPublico.jsx
// Moldura das páginas públicas: cabeçalho, faixa de emergência, saída rápida.
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { firebaseConfigurado } from '../firebase';
import Cabecalho from './Cabecalho';
import FaixaEmergencia from './FaixaEmergencia';
import Rodape from './Rodape';
import SaidaRapida from './SaidaRapida';

export default function LayoutPublico() {
  const { pathname, hash } = useLocation();
  const principal = useRef(null);
  const primeiraVez = useRef(true);

  // Ao trocar de página: volta ao topo e leva o foco ao conteúdo (leitores de tela)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
    principal.current?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return (
    <>
      <a href="#conteudo" className="pular-link">
        Pular para o conteúdo
      </a>
      <FaixaEmergencia />
      <Cabecalho />
      <SaidaRapida />
      {!firebaseConfigurado && (
        <div className="largura">
          <p className="aviso aviso-erro" role="alert">
            Firebase não configurado. Copie <code>.env.example</code> para{' '}
            <code>.env.local</code> e preencha as chaves, ou use{' '}
            <code>VITE_USE_EMULATORS=true</code> com <code>npm run emuladores</code>.
          </p>
        </div>
      )}
      <main id="conteudo" ref={principal} tabIndex={-1} className="principal">
        {/* key: a animação de entrada roda a cada troca de página */}
        <div key={pathname} className="entrada">
          <Outlet />
        </div>
      </main>
      <Rodape />
    </>
  );
}
