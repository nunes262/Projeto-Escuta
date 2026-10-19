// src/pages/Transparencia.jsx
// Tela 6: prestar contas à comunidade (metas 16.6 e 16.10) sem expor ninguém.
// Lê só estatisticas/publico e mudancas. Nenhuma denúncia é lida aqui.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconeSeta } from '../components/Icones';
import ResumoNumeros from '../components/ResumoNumeros';
import { MINIMO_POR_CATEGORIA } from '../constantes';
import { useContagem } from '../hooks/useContagem';
import { useEstatisticas } from '../hooks/useEstatisticas';
import { useTitulo } from '../hooks/useTitulo';
import { ouvirMudancas } from '../services/transparencia';
import { formatarData } from '../utils/datas';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const META_PRAZO = 90;

// Topo "redondo" e divisível por 4, para as 5 linhas do eixo serem inteiras
function topoDaEscala(maximo) {
  const passos = [4, 8, 12, 16, 20, 24, 32, 40, 60, 80, 100, 120, 200, 400, 800, 1000];
  return passos.find((p) => p >= maximo) ?? Math.ceil(maximo / 400) * 400;
}

function GraficoMensal({ porMes, ano }) {
  const hoje = new Date();
  const anoAtual = ano === hoje.getFullYear();
  const ultimoMes = anoAtual ? hoje.getMonth() : 11;
  const meses = MESES.slice(0, ultimoMes + 1).map((nome, i) => ({
    nome,
    longo: MESES_LONGOS[i],
    valor: porMes?.[String(i + 1).padStart(2, '0')] ?? 0,
    parcial: anoAtual && i === hoje.getMonth(),
  }));
  const topo = topoDaEscala(Math.max(1, ...meses.map((m) => m.valor)));
  const linhas = [topo, topo * 0.75, topo / 2, topo / 4, 0];
  const maiorMes = meses.reduce((a, b) => (b.valor > a.valor ? b : a), meses[0]);

  return (
    <figure className="grafico">
      <div className="grafico-area">
        <div className="grafico-eixo" aria-hidden="true">
          {linhas.map((v) => (
            <span key={v}>{Math.round(v)}</span>
          ))}
        </div>
        <div className="grafico-barras">
          {linhas.map((v) => (
            <span key={v} className="grafico-grade" style={{ bottom: `${(v / topo) * 100}%` }} />
          ))}
          {meses.map((m, i) => (
            <div key={m.nome} className="grafico-coluna" style={{ '--i': i }}>
              <span
                className={m.parcial ? 'grafico-barra parcial' : 'grafico-barra'}
                style={{ height: `${(m.valor / topo) * 100}%` }}
                tabIndex={0}
                aria-label={`${m.longo}: ${m.valor} denúncias${m.parcial ? ' (parcial)' : ''}`}
              >
                <span className="grafico-dica" aria-hidden="true">
                  <strong>{m.valor}</strong> em {m.longo}
                  {m.parcial ? ' (até hoje)' : ''}
                </span>
              </span>
              <span className="grafico-mes" aria-hidden="true">
                {m.nome}
                {m.parcial ? '*' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="nota">
        {maiorMes?.valor > 0 && <>Mês com mais relatos: {maiorMes.longo}. </>}
        {anoAtual && '* mês em andamento, números parciais. '}
        Passe o mouse ou use Tab para ver cada mês.
      </figcaption>
    </figure>
  );
}

function MedidorPrazo({ percentual }) {
  const valor = useContagem(typeof percentual === 'number' ? percentual : null, 1200);
  const fracao = typeof valor === 'number' ? valor / 100 : 0;
  // Semicírculo: 180° de arco
  const raio = 80;
  const comprimento = Math.PI * raio;
  const anguloMeta = Math.PI * (1 - META_PRAZO / 100);
  const metaX = 100 + raio * Math.cos(anguloMeta);
  const metaY = 100 - raio * Math.sin(anguloMeta);

  return (
    <figure className="medidor-prazo">
      <svg viewBox="0 0 200 116" role="img" aria-label={`${percentual ?? 0}% respondidas no prazo; meta de ${META_PRAZO}%`}>
        <path d="M20 100 A80 80 0 0 1 180 100" className="medidor-trilho" />
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          className={percentual >= META_PRAZO ? 'medidor-valor ok' : 'medidor-valor'}
          strokeDasharray={comprimento}
          strokeDashoffset={comprimento * (1 - fracao)}
        />
        <line
          x1={metaX * 0.88 + 100 * 0.12}
          y1={metaY * 0.88 + 100 * 0.12}
          x2={metaX * 1.08 - 100 * 0.08}
          y2={metaY * 1.08 - 100 * 0.08}
          className="medidor-meta"
        />
        <text x="100" y="92" textAnchor="middle" className="medidor-numero">
          {typeof percentual === 'number' ? `${valor}%` : '—'}
        </text>
      </svg>
      <figcaption>
        respondidas no prazo · <span className="meta-legenda">meta {META_PRAZO}%</span>
      </figcaption>
    </figure>
  );
}

function SituacaoAtual({ dados }) {
  const total = dados?.total ?? 0;
  const partes = [
    { chave: 'concluida', rotulo: 'Concluídas', valor: dados?.concluidas ?? 0 },
    { chave: 'arquivada', rotulo: 'Arquivadas com motivo', valor: dados?.arquivadas ?? 0 },
    { chave: 'andamento', rotulo: 'Em andamento', valor: dados?.emAndamento ?? 0 },
  ];
  if (!total) return null;

  return (
    <div className="situacao">
      <div className="situacao-barra" role="img" aria-label={partes.map((p) => `${p.rotulo}: ${p.valor}`).join(', ')}>
        {partes.map((p) => (
          <span
            key={p.chave}
            className={`situacao-${p.chave}`}
            style={{ flexGrow: p.valor }}
          />
        ))}
      </div>
      <ul className="legenda">
        {partes.map((p) => (
          <li key={p.chave}>
            <span className={`legenda-cor situacao-${p.chave}`} aria-hidden="true" />
            {p.rotulo} <strong>{p.valor}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaCategorias({ porCategoria, total }) {
  const linhas = Object.entries(porCategoria ?? {}).sort((a, b) => b[1] - a[1]);
  if (!total || linhas.length === 0) return <p className="nota">Ainda sem denúncias neste ano.</p>;
  const maior = linhas[0][1];

  return (
    <ol className="categorias">
      {linhas.map(([categoria, quantidade]) => {
        const pct = Math.round((quantidade / total) * 100);
        return (
          <li key={categoria}>
            <span className="categoria-nome">{categoria}</span>
            <span className="categoria-trilho" aria-hidden="true">
              <span style={{ width: `${(quantidade / maior) * 100}%` }} />
            </span>
            <span className="categoria-pct">
              {pct}%<small>{quantidade}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function rotuloMes(mes) {
  const [ano, numero] = mes.split('-');
  return { mes: MESES[Number(numero) - 1], ano };
}

export default function Transparencia() {
  useTitulo('Transparência');
  const { dados, carregando, erro } = useEstatisticas();
  const [mudancas, setMudancas] = useState([]);

  useEffect(() => ouvirMudancas(setMudancas, () => {}), []);

  const ano = dados?.ano ?? new Date().getFullYear();

  return (
    <div className="largura">
      <header className="pagina-cabeca">
        <p className="sobretitulo">Prestação de contas · {ano}</p>
        <h1>Transparência da ouvidoria</h1>
        <p className="lead">
          Só números: nenhum relato é publicado.
          {dados?.atualizadoEm && <> Atualizado em {formatarData(dados.atualizadoEm)}.</>}
        </p>
      </header>

      {erro && (
        <p className="erro" role="alert">
          Não foi possível carregar os números agora.
        </p>
      )}

      <ResumoNumeros dados={dados} carregando={carregando} completo />

      <div className="painel-grade">
        <section className="caixa caixa-larga" aria-labelledby="t-mes">
          <h2 id="t-mes" className="titulo-caixa">Denúncias recebidas por mês</h2>
          <GraficoMensal porMes={dados?.porMes} ano={ano} />
        </section>

        <section className="caixa" aria-labelledby="t-prazo">
          <h2 id="t-prazo" className="titulo-caixa">Cumprimento do prazo</h2>
          <MedidorPrazo percentual={dados?.percentualNoPrazo} />
          <SituacaoAtual dados={dados} />
        </section>

        <section className="caixa caixa-larga" aria-labelledby="t-cat">
          <h2 id="t-cat" className="titulo-caixa">Por categoria</h2>
          <ListaCategorias porCategoria={dados?.porCategoria} total={dados?.total} />
          <p className="nota">
            Categorias com menos de {MINIMO_POR_CATEGORIA} casos aparecem somadas em “Outro”, para
            que nenhum número aponte para uma pessoa.
          </p>
        </section>

        <section className="caixa" aria-labelledby="t-mudou">
          <h2 id="t-mudou" className="titulo-caixa">O que mudou a partir das denúncias</h2>
          {mudancas.length === 0 ? (
            <p className="nota">A ouvidoria ainda não publicou mudanças.</p>
          ) : (
            <ol className="mudancas">
              {mudancas.map((m) => {
                const r = rotuloMes(m.mes);
                return (
                  <li key={m.id}>
                    <time dateTime={m.mes}>
                      {r.mes}
                      <small>{r.ano}</small>
                    </time>
                    <span>{m.texto}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <section className="citacao citacao-compacta">
        <blockquote>
          <p>Denúncia sem retorno não gera confiança. Este painel é o retorno para todos.</p>
        </blockquote>
        <Link to="/denunciar" className="botao botao-primario botao-grande">
          Fazer uma denúncia <IconeSeta />
        </Link>
      </section>
    </div>
  );
}
