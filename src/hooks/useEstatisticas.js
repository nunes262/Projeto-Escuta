// src/hooks/useEstatisticas.js
import { useEffect, useState } from 'react';
import { ouvirEstatisticas } from '../services/transparencia';

// Lê só estatisticas/publico. Nenhuma denúncia é lida aqui.
export function useEstatisticas() {
  const [estado, setEstado] = useState({ carregando: true, dados: null, erro: false });

  useEffect(
    () =>
      ouvirEstatisticas(
        (dados) => setEstado({ carregando: false, dados, erro: false }),
        () => setEstado({ carregando: false, dados: null, erro: true }),
      ),
    [],
  );

  return estado;
}
