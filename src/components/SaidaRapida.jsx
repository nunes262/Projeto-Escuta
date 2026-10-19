// src/components/SaidaRapida.jsx
// Botão de saída rápida, comum em sites de apoio a vítimas: troca a página
// por outra neutra na hora. Atalho: apertar Esc duas vezes seguidas.
import { useEffect } from 'react';
import { IconeSair } from './Icones';

function sair() {
  // replace() troca a entrada atual do histórico: o "voltar" não traz a Escuta de volta
  window.location.replace('https://www.google.com/search?q=previs%C3%A3o+do+tempo');
}

export default function SaidaRapida() {
  useEffect(() => {
    let ultimoEsc = 0;
    function aoTeclar(evento) {
      if (evento.key !== 'Escape') return;
      const agora = Date.now();
      if (agora - ultimoEsc < 600) sair();
      ultimoEsc = agora;
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  return (
    <button
      type="button"
      className="saida-rapida"
      onClick={sair}
      title="Sai do site na hora. Atalho: Esc duas vezes."
    >
      <IconeSair /> Sair rápido
    </button>
  );
}
