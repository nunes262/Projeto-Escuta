// src/components/CampoCodigo.jsx
// Código de 16 caracteres digitado em 4 blocos de 4, como num cartão.
// Avança sozinho, volta com Backspace e aceita colar o código inteiro.
import { useRef } from 'react';
import { limparCodigo } from '../utils/seguranca';

const BLOCOS = 4;
const TAMANHO = 4;
const TOTAL = BLOCOS * TAMANHO;

export default function CampoCodigo({ valor, aoMudar, oculto, invalido, idDescricao }) {
  const campos = useRef([]);
  const partes = Array.from({ length: BLOCOS }, (_, i) =>
    valor.slice(i * TAMANHO, (i + 1) * TAMANHO),
  );

  function focar(indice, fim = true) {
    const campo = campos.current[indice];
    if (!campo) return;
    campo.focus();
    const pos = fim ? campo.value.length : 0;
    requestAnimationFrame(() => campo.setSelectionRange(pos, pos));
  }

  function digitar(indice, texto) {
    const limpo = limparCodigo(texto);
    const antes = partes.slice(0, indice).join('');
    const colou = limpo.length > TAMANHO;
    // Colou o código inteiro (ou um pedaço grande): espalha pelos blocos
    const novo = colou
      ? (antes + limpo).slice(0, TOTAL)
      : (antes + limpo + partes.slice(indice + 1).join('')).slice(0, TOTAL);
    aoMudar(novo);

    let alvo = indice;
    if (colou) alvo = Math.min(Math.floor(novo.length / TAMANHO), BLOCOS - 1);
    else if (limpo.length === TAMANHO && indice < BLOCOS - 1) alvo = indice + 1;
    if (alvo !== indice) focar(alvo);
  }

  // Não deixa pular blocos vazios: o foco vai para o primeiro incompleto
  function aoFocar(indice, evento) {
    const primeiroIncompleto = Math.min(Math.floor(valor.length / TAMANHO), BLOCOS - 1);
    if (indice > primeiroIncompleto) focar(primeiroIncompleto);
    else evento.target.select();
  }

  function teclar(indice, evento) {
    const campo = evento.currentTarget;
    if (evento.key === 'Backspace' && campo.selectionStart === 0 && campo.selectionEnd === 0 && indice > 0) {
      evento.preventDefault();
      focar(indice - 1);
    }
    if (evento.key === 'ArrowLeft' && campo.selectionStart === 0 && indice > 0) focar(indice - 1);
    if (evento.key === 'ArrowRight' && campo.selectionStart === campo.value.length && indice < BLOCOS - 1) {
      focar(indice + 1, false);
    }
  }

  return (
    <div className={invalido ? 'campo-codigo invalido' : 'campo-codigo'} role="group" aria-labelledby="rotulo-codigo">
      {partes.map((parte, i) => (
        <span key={i} className="bloco-codigo">
          <input
            ref={(el) => {
              campos.current[i] = el;
            }}
            id={i === 0 ? 'codigo' : undefined}
            type={oculto ? 'password' : 'text'}
            inputMode="text"
            value={parte}
            onChange={(e) => digitar(i, e.target.value)}
            onKeyDown={(e) => teclar(i, e)}
            onFocus={(e) => aoFocar(i, e)}
            aria-label={`Bloco ${i + 1} de ${BLOCOS}`}
            aria-invalid={invalido || undefined}
            aria-describedby={idDescricao}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={TOTAL + 3}
          />
          {i < BLOCOS - 1 && <span className="bloco-traco" aria-hidden="true">–</span>}
        </span>
      ))}
    </div>
  );
}
