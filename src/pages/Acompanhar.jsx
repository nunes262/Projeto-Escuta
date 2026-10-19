// src/pages/Acompanhar.jsx
// Tela 4: mostrar em que pé está a denúncia e conversar sem se identificar.
// O código fica só na memória da página: não vai para a URL nem para o navegador.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Conversa from '../components/Conversa';
import CampoCodigo from '../components/CampoCodigo';
import { IconeCadeado, IconeOlho, IconeSeta } from '../components/Icones';
import PrazoAnel from '../components/PrazoAnel';
import StatusBadge from '../components/StatusBadge';
import LinhaDoTempo from '../components/LinhaDoTempo';
import { STATUS_FINAIS } from '../constantes';
import { useTitulo } from '../hooks/useTitulo';
import { enviarMensagem, ouvirDenuncia, ouvirMensagens } from '../services/denuncias';
import { formatarData, formatarDataHora } from '../utils/datas';
import { codigoValido, formatarCodigo, limparCodigo } from '../utils/seguranca';

export default function Acompanhar() {
  useTitulo('Acompanhar denúncia');
  const location = useLocation();
  const navigate = useNavigate();

  // Vindo de "Acompanhar agora" no comprovante, o código chega pelo state
  const [codigo, setCodigo] = useState(location.state?.codigo ?? null);
  const [digitado, setDigitado] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [denuncia, setDenuncia] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(codigo));
  const [erro, setErro] = useState('');

  // Tira o código do histórico do navegador
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  // Denúncia e conversa em tempo real enquanto o código estiver aberto
  useEffect(() => {
    if (!codigo) return undefined;
    const pararDenuncia = ouvirDenuncia(
      codigo,
      (encontrada) => {
        setCarregando(false);
        if (encontrada) {
          setDenuncia(encontrada);
          setErro('');
        } else {
          setDenuncia(null);
          setCodigo(null);
          setErro('Código não encontrado. Confira as letras e os números.');
        }
      },
      () => {
        setCarregando(false);
        setCodigo(null);
        setErro('Não foi possível abrir agora. Verifique a conexão e tente de novo.');
      },
    );
    const pararMensagens = ouvirMensagens(codigo, setMensagens, () => {});
    return () => {
      pararDenuncia();
      pararMensagens();
    };
  }, [codigo]);

  function abrir(evento) {
    evento.preventDefault();
    const limpo = limparCodigo(digitado);
    if (limpo.length !== 16) {
      setErro('O código tem 16 letras e números.');
      return;
    }
    if (!codigoValido(limpo)) {
      setErro('Este código tem caracteres que não existem nos códigos da Escuta (0, 1, I, L ou O).');
      return;
    }
    setErro('');
    setCarregando(true);
    setDigitado('');
    setMostrar(false);
    setCodigo(limpo);
  }

  function trocarCodigo() {
    setCodigo(null);
    setDenuncia(null);
    setMensagens([]);
    setErro('');
  }

  function responder(texto) {
    return enviarMensagem(codigo, texto, 'denunciante');
  }

  if (!codigo || (!denuncia && !carregando)) {
    return (
      <section className="largura pagina-estreita acompanhar-entrada">
        <span className="icone-grande" aria-hidden="true">
          <IconeCadeado width={28} height={28} />
        </span>
        <h1>Acompanhar denúncia</h1>
        <p className="subtitulo">
          Digite o código de 16 caracteres que você recebeu ao enviar a denúncia.
        </p>
        <form onSubmit={abrir} className="form-codigo">
          <p className="campo" id="rotulo-codigo">
            Código de acompanhamento
          </p>
          <CampoCodigo
            valor={digitado}
            aoMudar={setDigitado}
            oculto={!mostrar}
            invalido={Boolean(erro)}
            idDescricao={erro ? 'erro-codigo' : undefined}
          />
          <button
            type="button"
            className="link link-icone"
            onClick={() => setMostrar(!mostrar)}
            aria-pressed={mostrar}
          >
            <IconeOlho aberto={mostrar} width={16} height={16} /> {mostrar ? 'Ocultar código' : 'Mostrar código'}
          </button>
          {erro && (
            <p className="erro" id="erro-codigo" role="alert">
              {erro}
            </p>
          )}
          <button type="submit" className="botao botao-primario botao-grande" disabled={digitado.length < 16}>
            Abrir denúncia <IconeSeta />
          </button>
        </form>
        <p className="nota">
          O código fica oculto enquanto você digita, para ninguém ler por cima do seu ombro. Ele não
          é salvo neste navegador.
        </p>
      </section>
    );
  }

  if (!denuncia) {
    return <p className="carregando largura">Abrindo a denúncia…</p>;
  }

  const encerrada = STATUS_FINAIS.includes(denuncia.status);

  return (
    <section className="largura">
      <div className="barra-codigo">
        <span className="codigo-mono">{formatarCodigo(codigo)}</span>
        <button type="button" className="botao botao-neutro" onClick={trocarCodigo}>
          Trocar código
        </button>
      </div>

      <div className="acompanhar-cabeca">
        <div>
          <p className="sobretitulo">Protocolo {denuncia.protocolo}</p>
          <h1>{denuncia.categoria}</h1>
          <p className="subtitulo">
            <StatusBadge status={denuncia.status} /> Enviada em {formatarData(denuncia.criadoEm)} ·{' '}
            {encerrada ? 'encerrada' : `resposta até ${formatarData(denuncia.prazo)}`}
          </p>
        </div>
        <PrazoAnel denuncia={denuncia} />
      </div>

      {denuncia.prorrogado && !encerrada && (
        <p className="aviso">
          <span>
            <strong>Prazo prorrogado até {formatarData(denuncia.prazo)}.</strong> Justificativa da
            ouvidoria: {denuncia.justificativaProrrogacao}
          </span>
        </p>
      )}

      <div className="acompanhar-grade">
        <div>
          <LinhaDoTempo denuncia={denuncia} />
          <details className="seu-relato">
            <summary>Ver o que você escreveu</summary>
            <dl className="revisao">
              <dt>Enviada em</dt>
              <dd>{formatarDataHora(denuncia.criadoEm)}</dd>
              <dt>Onde</dt>
              <dd>{denuncia.local || 'Não informado'}</dd>
              <dt>Quando</dt>
              <dd>{denuncia.quando || 'Não informado'}</dd>
              <dt>Relato</dt>
              <dd className="relato">{denuncia.descricao}</dd>
            </dl>
          </details>
        </div>
        <Conversa
          mensagens={mensagens}
          autorAtual="denunciante"
          aoEnviar={responder}
          bloqueada={encerrada}
          aviso={
            encerrada
              ? 'Esta denúncia foi encerrada. Se algo novo aconteceu, faça uma nova denúncia.'
              : 'Não escreva seu nome nem dados que identifiquem você.'
          }
        />
      </div>
    </section>
  );
}
