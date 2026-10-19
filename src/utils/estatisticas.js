// src/utils/estatisticas.js
// Calcula os números do painel público. Recebe as denúncias completas,
// devolve só contagens: nenhum texto, local ou data exata sai daqui.
import { MINIMO_POR_CATEGORIA, STATUS_FINAIS } from '../constantes.js';
import { paraMillis, UM_DIA } from './datas.js';

// Momento da resposta final (última entrada do histórico com o status atual)
function momentoFinal(denuncia) {
  const entrada = [...(denuncia.historico ?? [])]
    .reverse()
    .find((h) => h.status === denuncia.status);
  return paraMillis(entrada?.em);
}

export function calcularEstatisticas(denuncias, ano = new Date().getFullYear()) {
  const porMes = {};
  const porCategoriaBruto = {};
  let total = 0;
  let concluidas = 0;
  let arquivadas = 0;
  let noPrazo = 0;
  let somaDias = 0;

  for (const d of denuncias) {
    const criado = paraMillis(d.criadoEm);
    if (!Number.isFinite(criado) || new Date(criado).getFullYear() !== ano) continue;

    total += 1;
    const mes = String(new Date(criado).getMonth() + 1).padStart(2, '0');
    porMes[mes] = (porMes[mes] ?? 0) + 1;
    porCategoriaBruto[d.categoria] = (porCategoriaBruto[d.categoria] ?? 0) + 1;

    if (STATUS_FINAIS.includes(d.status)) {
      if (d.status === 'concluida') concluidas += 1;
      else arquivadas += 1;
      const fim = momentoFinal(d);
      if (fim <= paraMillis(d.prazo)) noPrazo += 1;
      somaDias += Math.max(0, (fim - criado) / UM_DIA);
    }
  }

  // Categorias com poucos casos são somadas em "Outro" (proteção contra reidentificação)
  const porCategoria = {};
  let agrupadas = 0;
  for (const [categoria, quantidade] of Object.entries(porCategoriaBruto)) {
    if (quantidade < MINIMO_POR_CATEGORIA && categoria !== 'Outro') agrupadas += quantidade;
    else porCategoria[categoria] = quantidade;
  }
  if (agrupadas > 0) porCategoria.Outro = (porCategoria.Outro ?? 0) + agrupadas;

  const respondidas = concluidas + arquivadas;
  return {
    ano,
    total,
    concluidas,
    arquivadas,
    emAndamento: total - respondidas,
    respondidas,
    noPrazo,
    percentualNoPrazo: respondidas ? Math.round((noPrazo / respondidas) * 100) : null,
    tempoMedioDias: respondidas ? Math.round(somaDias / respondidas) : null,
    porMes,
    porCategoria,
  };
}
