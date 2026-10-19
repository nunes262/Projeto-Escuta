// src/pages/ouvidoria/DetalheDenuncia.jsx
// Uma denúncia vista pela ouvidoria: relato, histórico, conversa e ações.
// A rota usa o protocolo, nunca o código secreto, para o código não aparecer
// na barra de endereço nem no histórico do navegador da equipe.
import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import Conversa from '../../components/Conversa';
import { IconeAlerta } from '../../components/Icones';
import PrazoAnel from '../../components/PrazoAnel';
import StatusBadge from '../../components/StatusBadge';
import { LIMITES, PRORROGACAO_DIAS, SETORES, STATUS, STATUS_FINAIS } from '../../constantes';
import { useTitulo } from '../../hooks/useTitulo';
import {
  enviarMensagem,
  marcarComoLida,
  mudarStatus,
  ouvirMensagens,
  prorrogarPrazo,
} from '../../services/denuncias';
import { diasAte, formatarData, formatarDataHora } from '../../utils/datas';

const AJUDA_OBSERVACAO = {
  concluida: 'Resposta final ao denunciante (obrigatória). Ele verá este texto.',
  arquivada: 'Motivo do arquivamento (obrigatório). O denunciante verá este texto.',
  encaminhada: 'Observação (opcional). O denunciante verá este texto, o setor não vê o relato inteiro por aqui.',
  em_analise: 'Observação (opcional). O denunciante verá este texto.',
  recebida: 'Observação (opcional). O denunciante verá este texto.',
};

function FormStatus({ denuncia }) {
  const [status, setStatus] = useState(denuncia.status === 'recebida' ? 'em_analise' : denuncia.status);
  const [setor, setSetor] = useState(denuncia.setor || '');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const final = STATUS_FINAIS.includes(status);
  const obsCurta = observacao.trim().length < LIMITES.observacaoMin;
  const semMudanca = status === denuncia.status && (status !== 'encaminhada' || setor === denuncia.setor);
  const invalido =
    semMudanca || (final && obsCurta) || (status === 'encaminhada' && !setor);

  async function salvar(evento) {
    evento.preventDefault();
    if (invalido) return;
    if (final && !window.confirm(`Marcar como "${STATUS[status]}"? O denunciante verá a resposta e não poderá mais enviar mensagens.`)) {
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      await mudarStatus(denuncia, status, observacao, setor);
      setObservacao('');
      setMensagem({ tipo: 'sucesso', texto: 'Status atualizado.' });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar. Confira os campos e a conexão.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="caixa" onSubmit={salvar}>
      <h2 className="titulo-caixa">Atualizar status</h2>
      <label className="campo">
        Novo status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(STATUS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
              {valor === denuncia.status ? ' (atual)' : ''}
            </option>
          ))}
        </select>
      </label>
      {status === 'encaminhada' && (
        <label className="campo">
          Setor responsável
          <select value={setor} onChange={(e) => setSetor(e.target.value)} required>
            <option value="">Escolha o setor</option>
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="campo">
        {AJUDA_OBSERVACAO[status]}
        <textarea
          rows={final ? 5 : 3}
          value={observacao}
          maxLength={LIMITES.observacao}
          onChange={(e) => setObservacao(e.target.value)}
          required={final}
        />
      </label>
      {final && obsCurta && (
        <p className="dica-campo">Mínimo de {LIMITES.observacaoMin} caracteres.</p>
      )}
      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}
      <button type="submit" className="botao botao-primario" disabled={invalido || salvando}>
        {salvando ? 'Salvando…' : 'Salvar status'}
      </button>
    </form>
  );
}

function FormProrrogacao({ denuncia }) {
  const [justificativa, setJustificativa] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (denuncia.prorrogado) {
    return (
      <div className="caixa">
        <h2 className="titulo-caixa">Prazo prorrogado</h2>
        <p>
          Novo prazo: <strong>{formatarData(denuncia.prazo)}</strong>
          {denuncia.prorrogadoEm && <> (prorrogado em {formatarData(denuncia.prorrogadoEm)})</>}.
        </p>
        <p className="texto-suave">Justificativa: {denuncia.justificativaProrrogacao}</p>
        <p className="nota">A prorrogação só pode acontecer uma vez (Lei 13.460/2017).</p>
      </div>
    );
  }

  async function prorrogar(evento) {
    evento.preventDefault();
    if (!window.confirm(`Prorrogar o prazo por mais ${PRORROGACAO_DIAS} dias? Isso só pode ser feito uma vez.`)) return;
    setSalvando(true);
    setErro('');
    try {
      await prorrogarPrazo(denuncia, justificativa);
    } catch {
      setErro('Não foi possível prorrogar. Tente de novo.');
      setSalvando(false);
    }
  }

  const curta = justificativa.trim().length < LIMITES.observacaoMin;

  return (
    <form className="caixa" onSubmit={prorrogar}>
      <h2 className="titulo-caixa">Prorrogar prazo</h2>
      <p className="nota">
        Mais {PRORROGACAO_DIAS} dias, uma única vez, com justificativa que o denunciante vê
        (Lei 13.460/2017).
      </p>
      <label className="campo">
        Justificativa
        <textarea
          rows={3}
          value={justificativa}
          maxLength={LIMITES.observacao}
          onChange={(e) => setJustificativa(e.target.value)}
        />
      </label>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      <button type="submit" className="botao botao-secundario" disabled={curta || salvando}>
        Prorrogar por {PRORROGACAO_DIAS} dias
      </button>
    </form>
  );
}

export default function DetalheDenuncia() {
  const { protocolo } = useParams();
  useTitulo(`Denúncia ${protocolo}`);
  const { denuncias, carregando } = useOutletContext();
  const denuncia = denuncias.find((d) => d.protocolo === protocolo);
  const [mensagens, setMensagens] = useState([]);
  const id = denuncia?.id;

  useEffect(() => {
    if (!id) return undefined;
    return ouvirMensagens(id, setMensagens, () => {});
  }, [id]);

  // Abrir a denúncia conta como ler a mensagem nova
  useEffect(() => {
    if (denuncia?.mensagemNova) marcarComoLida(denuncia).catch(() => {});
  }, [denuncia]);

  if (carregando) return <p className="carregando">Carregando…</p>;
  if (!denuncia) {
    return (
      <section>
        <h1>Denúncia não encontrada</h1>
        <p>
          <Link to="/ouvidoria">Voltar para a fila</Link>
        </p>
      </section>
    );
  }

  const encerrada = STATUS_FINAIS.includes(denuncia.status);
  const dias = diasAte(denuncia.prazo);

  return (
    <section>
      <p>
        <Link to="/ouvidoria">← Voltar para a fila</Link>
      </p>
      <div className="detalhe-topo">
        <div>
          <h1>Denúncia {denuncia.protocolo}</h1>
          <p className="subtitulo">
            {denuncia.categoria} · recebida em {formatarDataHora(denuncia.criadoEm)}
          </p>
        </div>
        <div className="detalhe-status">
          <div>
            <StatusBadge status={denuncia.status} />
            {!encerrada && (
              <span className={dias <= 5 ? 'prazo-curto bloco' : 'texto-suave bloco'}>
                {dias < 0 ? 'Prazo vencido' : `Prazo: ${formatarData(denuncia.prazo)}`}
              </span>
            )}
          </div>
          <PrazoAnel denuncia={denuncia} tamanho={76} />
        </div>
      </div>

      {denuncia.riscoImediato && !encerrada && (
        <p className="aviso aviso-erro" role="note">
          <IconeAlerta />
          <span>
            <strong>Urgente:</strong> quem denunciou marcou que alguém corre risco agora. Avalie
            acionar a segurança do campus ou os serviços de emergência.
          </span>
        </p>
      )}

      <div className="detalhe-grade">
        <div className="detalhe-coluna">
          <div className="caixa">
            <h2 className="titulo-caixa">Relato</h2>
            <dl className="revisao">
              <dt>Onde</dt>
              <dd>{denuncia.local || 'Não informado'}</dd>
              <dt>Quando</dt>
              <dd>{denuncia.quando || 'Não informado'}</dd>
              <dt>O que aconteceu</dt>
              <dd className="relato">{denuncia.descricao}</dd>
            </dl>
            <p className="nota">
              Dados de terceiros (LGPD): ao encaminhar, repasse ao setor só o necessário para agir.
            </p>
          </div>

          <div className="caixa">
            <h2 className="titulo-caixa">Histórico</h2>
            <ol className="historico">
              {[...denuncia.historico].reverse().map((h, i) => (
                <li key={`${h.status}-${i}`}>
                  <StatusBadge status={h.status} />
                  <time>{formatarDataHora(h.em)}</time>
                  {h.observacao && <p>{h.observacao}</p>}
                </li>
              ))}
            </ol>
          </div>

          <Conversa
            mensagens={mensagens}
            autorAtual="ouvidoria"
            aoEnviar={(texto) => enviarMensagem(denuncia.id, texto, 'ouvidoria')}
            aviso="Não peça nome nem dados que identifiquem quem denunciou."
          />
        </div>

        <div className="detalhe-coluna">
          <FormStatus key={`${denuncia.status}-${denuncia.historico.length}`} denuncia={denuncia} />
          {!encerrada || denuncia.prorrogado ? <FormProrrogacao denuncia={denuncia} /> : null}
        </div>
      </div>
    </section>
  );
}
