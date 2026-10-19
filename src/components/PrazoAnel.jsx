// src/components/PrazoAnel.jsx
// Anel que mostra quanto do prazo já passou e quantos dias faltam.
import { STATUS_FINAIS } from '../constantes';
import { diasAte, paraMillis, UM_DIA } from '../utils/datas';

export default function PrazoAnel({ denuncia, tamanho = 92 }) {
  const encerrada = STATUS_FINAIS.includes(denuncia.status);
  const inicio = paraMillis(denuncia.criadoEm);
  const fim = paraMillis(denuncia.prazo);
  const total = Math.max(1, (fim - inicio) / UM_DIA);
  const restantes = diasAte(denuncia.prazo);
  const fracao = encerrada ? 1 : Math.min(1, Math.max(0, 1 - restantes / total));

  const raio = 40;
  const perimetro = 2 * Math.PI * raio;
  let estado = 'ok';
  if (!encerrada && restantes <= 5) estado = 'curto';
  if (encerrada) estado = 'fim';

  let rotulo = `${Math.max(restantes, 0)}`;
  let legenda = restantes === 1 ? 'dia restante' : 'dias restantes';
  if (encerrada) {
    rotulo = '✓';
    legenda = 'respondida';
  } else if (restantes < 0) {
    rotulo = '!';
    legenda = 'prazo vencido';
  }

  return (
    <figure className={`prazo-anel prazo-${estado}`} style={{ width: tamanho }}>
      <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} aria-hidden="true">
        <circle cx="50" cy="50" r={raio} className="anel-trilho" />
        <circle
          cx="50"
          cy="50"
          r={raio}
          className="anel-valor"
          strokeDasharray={perimetro}
          strokeDashoffset={perimetro * (1 - fracao)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="anel-numero">{rotulo}</span>
      <figcaption className="anel-legenda">{legenda}</figcaption>
    </figure>
  );
}
