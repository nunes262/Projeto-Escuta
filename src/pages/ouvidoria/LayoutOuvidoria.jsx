// src/pages/ouvidoria/LayoutOuvidoria.jsx
// Área protegida da ouvidoria. Só ouvidores entram (as regras também barram).
// Escuta a coleção inteira em tempo real e repassa às páginas filhas.
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import Marca from '../../components/Marca';
import { auth } from '../../firebaseAuth';
import { useOuvidor } from '../../hooks/useOuvidor';
import { ouvirTodas } from '../../services/denuncias';
import { publicarEstatisticas } from '../../services/transparencia';

const INATIVIDADE_MS = 30 * 60 * 1000; // sai sozinho após 30 minutos parado

// "Maria Souza" -> "MS"; "Ouvidoria" -> "OU"
function iniciais(nome = 'Ouvidoria') {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : partes[0].slice(0, 2);
  return letras.toUpperCase();
}

function AreaOuvidoria({ ouvidor }) {
  const [denuncias, setDenuncias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const assinatura = useRef(null);

  useEffect(
    () =>
      ouvirTodas(
        (lista) => {
          setDenuncias(lista);
          setCarregando(false);
        },
        () => {
          setErro('Sem permissão para listar as denúncias ou sem conexão.');
          setCarregando(false);
        },
      ),
    [],
  );

  // Sempre que a lista muda, o painel público é atualizado (só números,
  // e só quando os números mudam de fato)
  useEffect(() => {
    if (carregando || denuncias.length === 0) return;
    publicarEstatisticas(denuncias, assinatura.current)
      .then((nova) => {
        assinatura.current = nova;
      })
      .catch((e) => console.warn('Falha ao publicar estatísticas', e));
  }, [denuncias, carregando]);

  // Saída automática por inatividade (computadores compartilhados)
  useEffect(() => {
    let timer;
    function reiniciar() {
      clearTimeout(timer);
      timer = setTimeout(() => signOut(auth), INATIVIDADE_MS);
    }
    const eventos = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    return () => {
      clearTimeout(timer);
      eventos.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, []);

  const novasMensagens = denuncias.filter((d) => d.mensagemNova).length;

  return (
    <>
      <a href="#conteudo" className="pular-link">
        Pular para o conteúdo
      </a>
      <header className="cabecalho cabecalho-ouvidoria">
        <div className="cabecalho-interno">
          <Marca para="/ouvidoria" subtitulo="Área da ouvidoria" />
          <nav aria-label="Ouvidoria" className="nav-principal">
            <NavLink to="/ouvidoria" end>
              Denúncias
              {novasMensagens > 0 && (
                <span className="contador" aria-label={`${novasMensagens} com mensagem nova`}>
                  {novasMensagens}
                </span>
              )}
            </NavLink>
            <NavLink to="/ouvidoria/mudancas">O que mudou</NavLink>
            <Link to="/transparencia" target="_blank" rel="noreferrer">
              Transparência
            </Link>
            <span className="usuario" title={ouvidor.nome}>
              <span className="avatar" aria-hidden="true">
                {iniciais(ouvidor.nome)}
              </span>
              <span className="usuario-nome">{ouvidor.nome ?? 'Ouvidoria'}</span>
            </span>
            <button type="button" className="botao botao-neutro botao-pequeno" onClick={() => signOut(auth)}>
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="largura principal">
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <Outlet context={{ denuncias, carregando, ouvidor }} />
      </main>
    </>
  );
}

export default function LayoutOuvidoria() {
  const { carregando, ouvidor } = useOuvidor();

  if (carregando) return <p className="carregando">Carregando…</p>;
  if (!ouvidor) return <Navigate to="/ouvidoria/login" replace />;
  return <AreaOuvidoria ouvidor={ouvidor} />;
}
