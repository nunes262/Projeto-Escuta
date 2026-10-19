// src/hooks/useContagem.js
// Anima um número de 0 até o valor final (efeito "contador").
// Quem pede menos movimento no sistema vê o número direto.
import { useEffect, useState } from 'react';

const semMovimento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useContagem(alvo, duracao = 900) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (typeof alvo !== 'number' || !Number.isFinite(alvo)) return undefined;
    if (semMovimento()) {
      setAtual(alvo);
      return undefined;
    }
    let quadro;
    const inicio = performance.now();
    function passo(agora) {
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - (1 - t) ** 3; // desacelera no fim
      setAtual(Math.round(alvo * suave));
      if (t < 1) quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return typeof alvo === 'number' ? atual : alvo;
}
