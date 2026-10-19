// src/hooks/usePreferencias.jsx
// Tema (claro/escuro) e "modo discreto" (aba com título e ícone neutros).
// Guardados no sessionStorage: somem quando o navegador fecha, para não
// deixar rastro de que a pessoa usou o site.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const Contexto = createContext({ tema: 'auto', discreto: false, setTema() {}, setDiscreto() {} });

const ICONE_NEUTRO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='3' width='22' height='26' rx='3' fill='%23e8e4da' stroke='%23888' stroke-width='2'/%3E%3Cpath d='M10 11h12M10 16h12M10 21h8' stroke='%23888' stroke-width='2'/%3E%3C/svg%3E";

function ler(chave, padrao) {
  try {
    return sessionStorage.getItem(chave) ?? padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    sessionStorage.setItem(chave, valor);
  } catch {
    // modo privado ou armazenamento bloqueado: segue só na memória
  }
}

export function ProvedorPreferencias({ children }) {
  const [tema, setTemaEstado] = useState(() => ler('escuta-tema', 'auto'));
  const [discreto, setDiscretoEstado] = useState(() => ler('escuta-discreto', '0') === '1');

  useEffect(() => {
    if (tema === 'auto') delete document.documentElement.dataset.tema;
    else document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    const icone = document.querySelector('link[rel="icon"]');
    if (!icone) return;
    if (!icone.dataset.original) icone.dataset.original = icone.href;
    icone.href = discreto ? ICONE_NEUTRO : icone.dataset.original;
  }, [discreto]);

  const valor = useMemo(
    () => ({
      tema,
      discreto,
      setTema(novo) {
        gravar('escuta-tema', novo);
        setTemaEstado(novo);
      },
      setDiscreto(novo) {
        gravar('escuta-discreto', novo ? '1' : '0');
        setDiscretoEstado(novo);
      },
    }),
    [tema, discreto],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  return useContext(Contexto);
}
