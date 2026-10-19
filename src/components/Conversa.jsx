// src/components/Conversa.jsx
// Conversa anônima entre denunciante e ouvidoria (usada pelos dois lados).
import { useEffect, useRef, useState } from 'react';
import { LIMITES } from '../constantes';
import { formatarCurto } from '../utils/datas';

// Como cada lado vê o próprio nome e o do outro
const NOMES = {
  denunciante: { proprio: 'Você', outro: 'Ouvidoria' },
  ouvidoria: { proprio: 'Você (ouvidoria)', outro: 'Denunciante' },
};

export default function Conversa({ mensagens, autorAtual, aoEnviar, bloqueada, aviso }) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const lista = useRef(null);

  // Rola para a mensagem mais recente
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [mensagens.length]);

  async function enviar(evento) {
    evento.preventDefault();
    const limpo = texto.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    setErro('');
    // Limpa na hora (a mensagem já aparece na lista); devolve o texto se falhar
    setTexto('');
    try {
      await aoEnviar(limpo);
    } catch {
      setTexto(limpo);
      setErro('A mensagem não foi enviada. Verifique a conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  function aoTeclar(evento) {
    // Enter envia; Shift+Enter quebra a linha
    if (evento.key === 'Enter' && !evento.shiftKey) enviar(evento);
  }

  return (
    <section className="conversa" aria-labelledby="titulo-conversa">
      <header className="conversa-topo">
        <h2 id="titulo-conversa">
          {autorAtual === 'ouvidoria' ? 'Conversa com o denunciante' : 'Conversa com a ouvidoria'}
        </h2>
        <span className="conversa-tag">anônima</span>
      </header>

      <div className="conversa-lista" ref={lista} role="log" aria-live="polite">
        {mensagens.length === 0 && (
          <p className="conversa-vazia">
            {autorAtual === 'ouvidoria'
              ? 'Nenhuma mensagem ainda. Pergunte o que precisar, sem pedir dados que identifiquem a pessoa.'
              : 'Nenhuma mensagem ainda. A ouvidoria pode fazer perguntas por aqui, e você pode acrescentar informações.'}
          </p>
        )}
        {mensagens.map((m) => {
          const proprio = m.autor === autorAtual;
          return (
            <div key={m.id} className={`balao ${proprio ? 'proprio' : 'outro'}`}>
              <span className="balao-autor">
                {proprio ? NOMES[autorAtual].proprio : NOMES[autorAtual].outro} ·{' '}
                {formatarCurto(m.enviadaEm)}
              </span>
              <p>{m.texto}</p>
            </div>
          );
        })}
      </div>

      {bloqueada ? (
        <p className="conversa-bloqueada">{aviso}</p>
      ) : (
        <form className="conversa-form" onSubmit={enviar}>
          <label htmlFor="nova-mensagem" className="visualmente-oculto">
            Escreva uma mensagem
          </label>
          <textarea
            id="nova-mensagem"
            rows={2}
            maxLength={LIMITES.mensagem}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Escreva uma mensagem"
          />
          <button type="submit" className="botao botao-primario" disabled={enviando || !texto.trim()}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      )}
      {aviso && !bloqueada && <p className="conversa-dica">{aviso}</p>}
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
