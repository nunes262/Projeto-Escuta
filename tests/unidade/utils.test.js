// tests/unidade/utils.test.js
// Rodar: npm test
import { describe, expect, it } from 'vitest';
import { encontrarDadosPessoais } from '../../src/utils/dadosPessoais.js';
import { calcularEstatisticas } from '../../src/utils/estatisticas.js';
import { UM_DIA } from '../../src/utils/datas.js';
import {
  codigoValido,
  formatarCodigo,
  gerarCodigo,
  limparCodigo,
} from '../../src/utils/seguranca.js';

describe('código secreto', () => {
  it('tem 16 caracteres do alfabeto sem 0, O, 1, I e L', () => {
    for (let i = 0; i < 500; i += 1) {
      const codigo = gerarCodigo();
      expect(codigo).toHaveLength(16);
      expect(codigoValido(codigo)).toBe(true);
      expect(codigo).not.toMatch(/[01ILO]/);
    }
  });

  it('não se repete', () => {
    const codigos = new Set(Array.from({ length: 5000 }, () => gerarCodigo()));
    expect(codigos.size).toBe(5000);
  });

  it('usa todas as letras com frequência parecida (sem viés)', () => {
    const contagem = {};
    const texto = Array.from({ length: 4000 }, () => gerarCodigo()).join('');
    for (const letra of texto) contagem[letra] = (contagem[letra] ?? 0) + 1;
    const valores = Object.values(contagem);
    expect(valores).toHaveLength(31);
    const media = texto.length / 31;
    for (const v of valores) expect(Math.abs(v - media) / media).toBeLessThan(0.1);
  });

  it('formata e limpa o que a pessoa digitar', () => {
    expect(formatarCodigo('7Q4MK2XD9PRAH3WT')).toBe('7Q4M-K2XD-9PRA-H3WT');
    expect(limparCodigo(' 7q4m-k2xd 9pra-h3wt ')).toBe('7Q4MK2XD9PRAH3WT');
  });
});

describe('detector de dados pessoais', () => {
  it('encontra e-mail, telefone, CPF, matrícula e nome', () => {
    expect(encontrarDadosPessoais('me escreve em fulano@gmail.com')).toContain('um e-mail');
    expect(encontrarDadosPessoais('meu número é (31) 98765-4321')).toContain('um telefone');
    expect(encontrarDadosPessoais('CPF 123.456.789-00')).toContain('um CPF');
    expect(encontrarDadosPessoais('meu RA 2023001234')).toContain('um número de matrícula ou RA');
    expect(encontrarDadosPessoais('Oi, meu nome é Ana')).toContain('o seu nome');
  });

  it('não reclama de um relato comum', () => {
    const relato =
      'Um grupo de alunos inventa apelidos para um colega no Bloco B, 2º andar, há cerca de um mês.';
    expect(encontrarDadosPessoais(relato)).toEqual([]);
  });
});

describe('estatísticas públicas', () => {
  const ano = 2026;
  const base = new Date(2026, 8, 1).getTime();
  const denuncia = (categoria, status, diasAteFim) => ({
    categoria,
    status,
    criadoEm: new Date(base),
    prazo: new Date(base + 30 * UM_DIA),
    historico: [
      { status: 'recebida', em: new Date(base) },
      ...(diasAteFim != null ? [{ status, em: new Date(base + diasAteFim * UM_DIA) }] : []),
    ],
  });

  it('conta prazo, tempo médio e agrupa categorias pequenas', () => {
    const lista = [
      denuncia('Bullying ou cyberbullying', 'concluida', 10),
      denuncia('Bullying ou cyberbullying', 'concluida', 40), // fora do prazo
      denuncia('Bullying ou cyberbullying', 'em_analise'),
      denuncia('Assédio moral', 'arquivada', 4), // só 1 caso: vai para "Outro"
    ];
    const r = calcularEstatisticas(lista, ano);
    expect(r.total).toBe(4);
    expect(r.concluidas).toBe(2);
    expect(r.arquivadas).toBe(1);
    expect(r.respondidas).toBe(3);
    expect(r.noPrazo).toBe(2);
    expect(r.percentualNoPrazo).toBe(67);
    expect(r.tempoMedioDias).toBe(18);
    expect(r.porMes).toEqual({ '09': 4 });
    expect(r.porCategoria).toEqual({ 'Bullying ou cyberbullying': 3, Outro: 1 });
    expect(r.porCategoria['Assédio moral']).toBeUndefined();
  });

  it('ignora outros anos e não expõe texto', () => {
    const antiga = { ...denuncia('Outro', 'concluida', 2), criadoEm: new Date(2025, 0, 1) };
    const r = calcularEstatisticas([antiga], ano);
    expect(r.total).toBe(0);
    expect(JSON.stringify(r)).not.toMatch(/descricao|local/);
  });
});
