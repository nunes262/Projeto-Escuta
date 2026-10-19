// src/components/LinhaDoTempo.jsx
// Mostra em que etapa a denúncia está, com datas e observações da ouvidoria.
import { formatarData, formatarDataHora } from '../utils/datas';

const ETAPAS = [
  { status: 'recebida', rotulo: 'Recebida' },
  { status: 'em_analise', rotulo: 'Em análise' },
  { status: 'encaminhada', rotulo: 'Encaminhada ao setor responsável' },
  { status: 'concluida', rotulo: 'Concluída' },
];

export default function LinhaDoTempo({ denuncia }) {
  const { historico, status, prazo, setor } = denuncia;
  const arquivada = status === 'arquivada';

  // Última passagem por cada etapa (o status pode ir e voltar)
  const passagens = {};
  historico.forEach((h) => {
    passagens[h.status] = h;
  });

  const indiceAtual = ETAPAS.findIndex((e) => e.status === status);
  const ultima = historico.at(-1);

  return (
    <div>
      <ol className="linha-do-tempo">
        {ETAPAS.map((etapa, indice) => {
          let classe = 'pendente';
          if (arquivada) classe = passagens[etapa.status] ? 'feita' : 'pendente';
          else if (indice < indiceAtual) classe = 'feita';
          else if (indice === indiceAtual) classe = status === 'concluida' ? 'feita atual' : 'atual';

          // Datas de etapas "à frente" da atual não aparecem (status voltou)
          const passagem = classe === 'pendente' ? null : passagens[etapa.status];

          return (
            <li
              key={etapa.status}
              className={classe}
              aria-current={classe.includes('atual') ? 'step' : undefined}
            >
              <strong>{etapa.rotulo}</strong>
              {passagem && <time>{formatarDataHora(passagem.em)}</time>}
              {etapa.status === 'encaminhada' && passagem && setor && (
                <span className="linha-detalhe">{setor}</span>
              )}
              {passagem?.observacao && etapa.status !== 'concluida' && (
                <span className="linha-detalhe">{passagem.observacao}</span>
              )}
              {etapa.status === 'concluida' && !passagem && (
                <time>prazo {formatarData(prazo)}</time>
              )}
            </li>
          );
        })}
      </ol>

      {status === 'concluida' && (
        <div className="resposta-final">
          <h3>Resposta da ouvidoria</h3>
          <p>{ultima.observacao}</p>
        </div>
      )}

      {arquivada && (
        <div className="resposta-final arquivada">
          <h3>Arquivada em {formatarData(ultima.em)}</h3>
          <p>
            <strong>Motivo:</strong> {ultima.observacao}
          </p>
        </div>
      )}
    </div>
  );
}
