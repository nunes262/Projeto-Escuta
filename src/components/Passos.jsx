// src/components/Passos.jsx
// Indicador "1 O que aconteceu · 2 Detalhes · 3 Revisar e enviar"
export default function Passos({ etapas, atual }) {
  return (
    <ol className="passos" aria-label={`Passo ${atual} de ${etapas.length}`}>
      {etapas.map((rotulo, i) => {
        const numero = i + 1;
        let classe = 'passo';
        if (numero < atual) classe += ' feito';
        if (numero === atual) classe += ' atual';
        return (
          <li key={rotulo} className={classe} aria-current={numero === atual ? 'step' : undefined}>
            <span>
              <span className="passo-numero">{String(numero).padStart(2, '0')}</span>
              {rotulo}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
