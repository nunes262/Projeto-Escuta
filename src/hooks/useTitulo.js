// src/hooks/useTitulo.js
import { useEffect } from 'react';
import { usePreferencias } from './usePreferencias';

// Título da aba: ajuda leitores de tela a saber em que página estão.
// No modo discreto, a aba mostra só "Anotações".
export function useTitulo(titulo) {
  const { discreto } = usePreferencias();
  useEffect(() => {
    if (discreto) document.title = 'Anotações';
    else document.title = titulo ? `${titulo} · Escuta` : 'Escuta · Ouvidoria';
  }, [titulo, discreto]);
}
