// src/components/ResumoNumeros.jsx
// Números públicos em destaque, com contador animado.
// Recebe o documento estatisticas/publico.
import { useContagem } from '../hooks/useContagem';

function Numero({ valor, sufixo = '', carregando }) {
  const animado = useContagem(typeof valor === 'number' ? valor : null);
  if (typeof valor !== 'number') {
    return <span className="numero-vazio">{carregando ? '…' : '—'}</span>;
  }
  return (
    <>
      {animado}
      {sufixo && <span className="numero-sufixo">{sufixo}</span>}
    </>
  );
}

export default function ResumoNumeros({ dados, carregando, completo = false }) {
  const ano = dados?.ano ?? new Date().getFullYear();
  const dias = dados?.tempoMedioDias;

  const itens = [
    {
      rotulo: `Denúncias recebidas em ${ano}`,
      valor: dados?.total,
    },
    completo && { rotulo: 'Concluídas', valor: dados?.concluidas },
    {
      rotulo: 'Respondidas dentro do prazo',
      valor: dados?.percentualNoPrazo ?? undefined,
      sufixo: '%',
    },
    {
      rotulo: 'Tempo médio até a resposta',
      valor: dias ?? undefined,
      sufixo: dias === 1 ? ' dia' : ' dias',
    },
  ].filter(Boolean);

  return (
    <dl className={`numeros numeros-${itens.length}`}>
      {itens.map((item) => (
        <div key={item.rotulo} className="numero">
          <dd>
            <Numero valor={item.valor} sufixo={item.sufixo} carregando={carregando} />
          </dd>
          <dt>{item.rotulo}</dt>
        </div>
      ))}
    </dl>
  );
}
