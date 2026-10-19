// src/utils/seguranca.js
// Gera o código secreto de acompanhamento.
// Sem 0, O, 1, I e L para ninguém confundir letras e números ao digitar.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 símbolos
export const TAMANHO_CODIGO = 16; // 16 × log2(31) ≈ 79 bits

// Maior múltiplo de 31 que cabe num byte (248). Bytes acima disso são
// descartados para todas as letras terem a mesma chance (sem viés do %).
const LIMITE = Math.floor(256 / ALFABETO.length) * ALFABETO.length;

export function gerarCodigo(tamanho = TAMANHO_CODIGO) {
  let codigo = '';
  const bytes = new Uint8Array(tamanho * 2);
  while (codigo.length < tamanho) {
    // Aleatório seguro para criptografia (Math.random não é)
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < LIMITE && codigo.length < tamanho) {
        codigo += ALFABETO[byte % ALFABETO.length];
      }
    }
  }
  return codigo;
}

// "7Q4MK2XD9PRAH3WT" -> "7Q4M-K2XD-9PRA-H3WT"
export function formatarCodigo(codigo) {
  return (codigo.match(/.{1,4}/g) ?? []).join('-');
}

// Aceita o código com ou sem traços, espaços, maiúsculas ou minúsculas
export function limparCodigo(texto) {
  return texto.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

// Mesmo formato exigido em firestore.rules
export function codigoValido(codigo) {
  return /^[2-9A-HJKMNP-Z]{16}$/.test(codigo);
}
