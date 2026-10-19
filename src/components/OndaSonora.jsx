// src/components/OndaSonora.jsx
// Faixa decorativa de "ondas sonoras", o símbolo da escuta.
// Alturas fixas (não aleatórias) para o desenho ser sempre o mesmo.
const ALTURAS = [
  3, 5, 8, 6, 11, 16, 12, 20, 26, 18, 30, 22, 14, 24, 34, 28, 19, 12, 22, 30, 36, 26, 17, 10, 15,
  23, 31, 25, 16, 9, 13, 20, 27, 21, 12, 7, 11, 17, 13, 8, 5, 9, 6, 4, 3,
];

export default function OndaSonora({ className = '' }) {
  const largura = ALTURAS.length * 6;
  return (
    <svg
      className={`onda ${className}`}
      viewBox={`0 0 ${largura} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {ALTURAS.map((altura, i) => (
        <rect
          key={i}
          x={i * 6 + 1.5}
          y={20 - altura / 2}
          width="3"
          height={altura}
          rx="1.5"
          style={{ animationDelay: `${(i % 9) * 0.11}s` }}
        />
      ))}
    </svg>
  );
}
