// src/components/Ticket.jsx
// Comprovante em forma de canhoto: picote, carimbo de sigilo e código.
// Usado no comprovante real e, como exemplo animado, na tela inicial.
import { useEffect, useState } from 'react';
import { formatarData, formatarDataHora } from '../utils/datas';
import { formatarCodigo } from '../utils/seguranca';

const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Efeito "sorteio": as letras giram e vão se fixando da esquerda para a direita
function useCodigoEmbaralhado(codigo, ativo) {
  const [texto, setTexto] = useState(ativo ? '' : codigo);

  useEffect(() => {
    if (!ativo || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setTexto(codigo);
      return undefined;
    }
    let quadro = 0;
    const timer = setInterval(() => {
      quadro += 1;
      const fixas = Math.floor(quadro / 2);
      const novo = codigo
        .split('')
        .map((c, i) => (i < fixas ? c : ALFABETO[Math.floor(Math.random() * ALFABETO.length)]))
        .join('');
      setTexto(novo);
      if (fixas >= codigo.length) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [codigo, ativo]);

  return texto || codigo;
}

export default function Ticket({
  protocolo,
  codigo,
  recebidaEm,
  prazo,
  categoria,
  status = 'Em análise',
  exemplo = false,
  animar = false,
}) {
  const embaralhado = useCodigoEmbaralhado(codigo, animar);

  return (
    <article
      className={exemplo ? 'ticket ticket-exemplo' : 'ticket'}
      aria-label={exemplo ? 'Exemplo de comprovante' : 'Comprovante da denúncia'}
    >
      <header className="ticket-topo">
        <span>Escuta · Ouvidoria</span>
        <span>{exemplo ? 'Exemplo' : 'Comprovante'}</span>
      </header>
      <div className="ticket-corpo">
        <p className="ticket-rotulo">Protocolo</p>
        <p className="ticket-protocolo">{protocolo}</p>
        <p className="ticket-rotulo">Código de acompanhamento</p>
        <p className="ticket-codigo" aria-label={formatarCodigo(codigo)}>
          {formatarCodigo(embaralhado)}
        </p>
      </div>
      <div className="ticket-picote" aria-hidden="true" />
      <dl className="ticket-dados">
        <div>
          <dt>Recebida</dt>
          <dd>{formatarDataHora(recebidaEm).replace(' às ', ' ')}</dd>
        </div>
        <div>
          <dt>Prazo (30 dias)</dt>
          <dd>{formatarData(prazo)}</dd>
        </div>
        {categoria && (
          <div>
            <dt>Categoria</dt>
            <dd>{categoria}</dd>
          </div>
        )}
        <div>
          <dt>Identificação</dt>
          <dd>Anônima</dd>
        </div>
      </dl>
      <footer className="ticket-rodape">
        <span className="ticket-status">{status}</span>
        <span className="carimbo" aria-hidden="true">
          Sigilo
        </span>
      </footer>
    </article>
  );
}
