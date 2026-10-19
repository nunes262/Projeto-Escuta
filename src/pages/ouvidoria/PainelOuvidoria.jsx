// src/pages/ouvidoria/PainelOuvidoria.jsx
// Tela 5: organizar a fila por urgência e prazo, para nenhuma denúncia
// ficar sem resposta.
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_FINAIS } from '../../constantes';
import { useTitulo } from '../../hooks/useTitulo';
import { diasAte, formatarData, paraMillis, UM_DIA } from '../../utils/datas';

const FILTROS = [
  { valor: 'abertas', rotulo: 'Abertas' },
  { valor: 'urgentes', rotulo: 'Urgentes' },
  { valor: 'mensagens', rotulo: 'Mensagem nova' },
  { valor: 'concluida', rotulo: 'Concluídas' },
  { valor: 'arquivada', rotulo: 'Arquivadas' },
  { valor: 'todas', rotulo: 'Todas' },
];

const aberta = (d) => !STATUS_FINAIS.includes(d.status);

function filtrar(denuncias, filtro) {
  switch (filtro) {
    case 'abertas':
      return denuncias.filter(aberta);
    case 'urgentes':
      return denuncias.filter((d) => aberta(d) && d.riscoImediato);
    case 'mensagens':
      return denuncias.filter((d) => d.mensagemNova);
    case 'todas':
      return denuncias;
    default:
      return denuncias.filter((d) => d.status === filtro);
  }
}

// Abertas: urgentes primeiro, depois quem vence antes. Encerradas: mais recentes primeiro.
function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (aberta(a) !== aberta(b)) return aberta(a) ? -1 : 1;
    if (!aberta(a)) return paraMillis(b.criadoEm) - paraMillis(a.criadoEm);
    if (a.riscoImediato !== b.riscoImediato) return a.riscoImediato ? -1 : 1;
    return paraMillis(a.prazo) - paraMillis(b.prazo);
  });
}

function Prazo({ denuncia }) {
  if (!aberta(denuncia)) return <span className="texto-suave">encerrada</span>;
  const dias = diasAte(denuncia.prazo);
  const total = Math.max(1, (paraMillis(denuncia.prazo) - paraMillis(denuncia.criadoEm)) / UM_DIA);
  const usado = Math.min(100, Math.max(0, (1 - dias / total) * 100));
  let estado = 'ok';
  if (dias <= 10) estado = 'medio';
  if (dias <= 5) estado = 'curto';
  return (
    <>
      <span className={`barra-prazo barra-${estado}`} aria-hidden="true">
        <span style={{ width: `${usado}%` }} />
      </span>
      <span className={dias <= 5 ? 'prazo-curto' : undefined}>
        {dias < 0 ? `Vencido há ${-dias} ${dias === -1 ? 'dia' : 'dias'}` : `${dias} ${dias === 1 ? 'dia' : 'dias'}`}
      </span>
      {denuncia.prorrogado && (
        <span className="texto-suave bloco">prorrogado até {formatarData(denuncia.prazo)}</span>
      )}
    </>
  );
}

export default function PainelOuvidoria() {
  useTitulo('Ouvidoria');
  const { denuncias, carregando } = useOutletContext();
  const [filtro, setFiltro] = useState('abertas');
  const [busca, setBusca] = useState('');

  const abertas = denuncias.filter(aberta);
  const contagem = {
    novas: abertas.filter((d) => d.status === 'recebida').length,
    analise: abertas.filter((d) => d.status === 'em_analise').length,
    encaminhadas: abertas.filter((d) => d.status === 'encaminhada').length,
    vencendo: abertas.filter((d) => diasAte(d.prazo) <= 5).length,
    urgentes: abertas.filter((d) => d.riscoImediato).length,
  };

  const termo = busca.trim().toUpperCase();
  const visiveis = ordenar(
    filtrar(denuncias, filtro).filter(
      (d) => !termo || d.protocolo.includes(termo) || d.categoria.toUpperCase().includes(termo),
    ),
  );

  return (
    <section>
      <h1>Denúncias abertas</h1>
      <p className="subtitulo">
        {abertas.length} em andamento · {contagem.urgentes}{' '}
        {contagem.urgentes === 1 ? 'urgente' : 'urgentes'} · {contagem.vencendo} vence
        {contagem.vencendo === 1 ? '' : 'm'} nos próximos 5 dias
      </p>

      <dl className="cartoes cartoes-4">
        <div className="cartao-numero">
          <dt>Novas</dt>
          <dd>{contagem.novas}</dd>
        </div>
        <div className="cartao-numero">
          <dt>Em análise</dt>
          <dd>{contagem.analise}</dd>
        </div>
        <div className="cartao-numero">
          <dt>Encaminhadas</dt>
          <dd>{contagem.encaminhadas}</dd>
        </div>
        <div className="cartao-numero">
          <dt>Vencem em até 5 dias</dt>
          <dd className={contagem.vencendo > 0 ? 'prazo-curto' : undefined}>{contagem.vencendo}</dd>
        </div>
      </dl>

      <div className="barra-filtros">
        <div className="filtros" role="group" aria-label="Filtrar denúncias">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              className={filtro === f.valor ? 'chip ativo' : 'chip'}
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
        <label className="busca">
          <span className="visualmente-oculto">Buscar por protocolo ou categoria</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar protocolo ou categoria"
          />
        </label>
      </div>

      {carregando ? (
        <p className="carregando">Carregando denúncias…</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Categoria</th>
                <th scope="col">Recebida</th>
                <th scope="col">Prazo</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visualmente-oculto">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={6} className="tabela-vazia">
                    {denuncias.length === 0
                      ? 'Nenhuma denúncia recebida ainda.'
                      : 'Nenhuma denúncia neste filtro.'}
                  </td>
                </tr>
              )}
              {visiveis.map((d) => (
                <tr key={d.id} className={d.riscoImediato && aberta(d) ? 'linha-urgente' : undefined}>
                  <td className="codigo-mono">
                    {d.protocolo}
                    {d.riscoImediato && aberta(d) && <span className="tag-urgente">Urgente</span>}
                    {d.mensagemNova && <span className="tag-mensagem">Mensagem nova</span>}
                  </td>
                  <td>{d.categoria}</td>
                  <td>{formatarData(d.criadoEm).slice(0, 5)}</td>
                  <td>
                    <Prazo denuncia={d} />
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                    {d.status === 'encaminhada' && d.setor && (
                      <span className="texto-suave bloco">{d.setor}</span>
                    )}
                  </td>
                  <td>
                    <Link to={`/ouvidoria/denuncias/${d.protocolo}`} className="link-forte">
                      Abrir<span className="visualmente-oculto"> {d.protocolo}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
