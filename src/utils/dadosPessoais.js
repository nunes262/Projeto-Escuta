// src/utils/dadosPessoais.js
// Procura no texto coisas que podem identificar quem denuncia.
// Não bloqueia o envio: só avisa. Tudo roda no navegador, nada é enviado.
const PADROES = [
  { tipo: 'um e-mail', regex: /[\w.+-]+@[\w-]+\.[\w.-]+/ },
  { tipo: 'um CPF', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/ },
  { tipo: 'um telefone', regex: /(\(?\b\d{2}\)?\s?)?\b9?\d{4}[-\s]\d{4}\b|\b\d{2}9\d{8}\b/ },
  { tipo: 'um número de matrícula ou RA', regex: /\b(RA|R\.A\.|matr[ií]cula)\s*:?\s*n?º?\s*\d{4,}/i },
  { tipo: 'o seu nome', regex: /\b(meu nome [ée]|me chamo|pode me chamar de)\s/i },
  { tipo: 'um perfil de rede social', regex: /(^|\s)@[\w.]{3,}/ },
];

export function encontrarDadosPessoais(texto) {
  if (!texto) return [];
  return PADROES.filter((p) => p.regex.test(texto)).map((p) => p.tipo);
}
