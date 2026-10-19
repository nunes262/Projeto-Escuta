// src/pages/DenunciaEnviada.jsx
// Tela 3: garantir que a pessoa guarde o código antes de sair da página.
// O código chega pelo state do React Router (não pela URL) e é apagado do
// histórico assim que a página abre: recarregar ou voltar não o mostra de novo.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconeAlerta, IconeBaixar, IconeCheck, IconeCopiar, IconeSeta } from '../components/Icones';
import Ticket from '../components/Ticket';
import { INSTITUICAO } from '../config';
import { useTitulo } from '../hooks/useTitulo';
import { formatarData, formatarDataHora } from '../utils/datas';
import { formatarCodigo } from '../utils/seguranca';

function baixarComprovante({ protocolo, codigo, recebidaEm, prazo }) {
  const texto = [
    `ESCUTA · OUVIDORIA DA ${INSTITUICAO.toUpperCase()}`,
    'Comprovante de denúncia anônima',
    '',
    `Protocolo: ${protocolo}`,
    `Código de acompanhamento: ${formatarCodigo(codigo)}`,
    `Recebida em: ${formatarDataHora(recebidaEm)}`,
    `Resposta até: ${formatarData(prazo)}`,
    '',
    `Acompanhe em: ${window.location.origin}/acompanhar`,
    '',
    'ATENÇÃO: quem tiver este código pode ler a denúncia e a conversa.',
    'Guarde em lugar seguro e não compartilhe.',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `comprovante-${protocolo}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DenunciaEnviada() {
  useTitulo('Denúncia enviada');
  const location = useLocation();
  const navigate = useNavigate();
  // Copia o comprovante para a memória da página antes de limpar o histórico
  const [comprovante] = useState(location.state);
  const [guardou, setGuardou] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  // Pede confirmação ao fechar a aba se o código ainda não foi copiado nem salvo
  useEffect(() => {
    if (!comprovante || guardou) return undefined;
    function aoSair(evento) {
      evento.preventDefault();
    }
    window.addEventListener('beforeunload', aoSair);
    return () => window.removeEventListener('beforeunload', aoSair);
  }, [comprovante, guardou]);

  if (!comprovante) {
    return (
      <section className="largura pagina-texto">
        <h1>Comprovante indisponível</h1>
        <p>
          Para proteger seu anonimato, o código só aparece uma vez, logo depois do envio. Se você
          guardou o código, use-o para acompanhar a denúncia.
        </p>
        <div className="acoes">
          <Link to="/acompanhar" className="botao botao-primario">
            Acompanhar com o código
          </Link>
          <Link to="/denunciar" className="botao botao-secundario">
            Fazer uma denúncia
          </Link>
        </div>
      </section>
    );
  }

  const { protocolo, codigo, recebidaEm, prazo } = comprovante;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(formatarCodigo(codigo));
      setCopiado(true);
      setGuardou(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="largura enviada">
      <div className="enviada-texto">
        <span className="circulo-ok">
          <IconeCheck />
        </span>
        <h1>Denúncia enviada.</h1>
        <p className="lead">
          Obrigado por confiar. A ouvidoria vai ler e responder pelo código ao lado, que só você
          tem.
        </p>

        <p className="aviso aviso-forte">
          <IconeAlerta />
          <span>
            <strong>Guarde o código agora.</strong> Ele é a única forma de acompanhar a denúncia.
            Para proteger seu anonimato, a ouvidoria não tem como recuperá-lo.
          </span>
        </p>

        <div className="acoes acoes-coluna">
          <button type="button" className="botao botao-primario botao-grande" onClick={copiar}>
            {copiado ? <IconeCheck /> : <IconeCopiar />} {copiado ? 'Código copiado' : 'Copiar código'}
          </button>
          <button
            type="button"
            className="botao botao-secundario botao-grande"
            onClick={() => {
              baixarComprovante(comprovante);
              setGuardou(true);
            }}
          >
            <IconeBaixar /> Salvar comprovante (.txt)
          </button>
          <button
            type="button"
            className="botao botao-neutro botao-grande"
            onClick={() => navigate('/acompanhar', { state: { codigo } })}
          >
            Acompanhar agora <IconeSeta />
          </button>
        </div>
        <p className="visualmente-oculto" aria-live="polite">
          {copiado ? 'Código copiado para a área de transferência.' : ''}
        </p>

        <h2 className="sobretitulo">O que acontece agora</h2>
        <ol className="lista-passos">
          <li>A ouvidoria lê e classifica a denúncia.</li>
          <li>Se precisar, faz perguntas pela conversa anônima.</li>
          <li>Você recebe a resposta final até {formatarData(prazo)}.</li>
        </ol>
      </div>

      <div className="enviada-ticket">
        <Ticket
          animar
          protocolo={protocolo}
          codigo={codigo}
          recebidaEm={recebidaEm}
          prazo={prazo}
          status="Recebida"
        />
      </div>
    </section>
  );
}
