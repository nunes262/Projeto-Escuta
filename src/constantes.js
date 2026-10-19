// src/constantes.js
// Valores fixos do domínio. Este arquivo não depende do Vite nem do Firebase,
// então também é usado pelo script de dados de exemplo e pelos testes.
// ATENÇÃO: categorias, status e setores também aparecem em firestore.rules.
// Mudou aqui, mude lá.

// Lei 13.460/2017: 30 dias, prorrogáveis uma única vez por igual período.
export const PRAZO_DIAS = 30;
export const PRORROGACAO_DIAS = 30;

export const LIMITES = {
  descricaoMin: 20,
  descricao: 5000,
  local: 200,
  quando: 200,
  mensagem: 2000,
  observacaoMin: 10,
  observacao: 2000,
};

export const CATEGORIAS = [
  {
    valor: 'Bullying ou cyberbullying',
    ajuda: 'Apelidos, exclusão, ameaças, montagens ou ataques em grupos e redes sociais.',
  },
  {
    valor: 'Assédio moral',
    ajuda: 'Humilhação, perseguição ou pressão repetida, inclusive por professores ou chefias.',
  },
  {
    valor: 'Assédio sexual',
    ajuda: 'Comentários, toques, mensagens ou propostas de cunho sexual sem consentimento.',
  },
  {
    valor: 'Discriminação',
    ajuda: 'Tratamento diferente por raça, gênero, orientação, religião, deficiência ou origem.',
  },
  {
    valor: 'Violência física',
    ajuda: 'Agressões, brigas, ameaças com objetos ou danos ao corpo.',
  },
  {
    valor: 'Irregularidade administrativa',
    ajuda: 'Uso indevido de recursos, fraude, favorecimento ou descumprimento de regras.',
  },
  {
    valor: 'Outro',
    ajuda: 'Algo que não se encaixa acima, mas que a instituição precisa saber.',
  },
];

export const STATUS = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  encaminhada: 'Encaminhada',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
};

export const STATUS_FINAIS = ['concluida', 'arquivada'];

export const SETORES = [
  'Coordenação de curso',
  'Diretoria acadêmica',
  'Diretoria administrativa',
  'Núcleo de apoio psicopedagógico',
  'Recursos humanos',
  'Segurança do campus',
];

export const EMERGENCIA = [
  { numero: '190', nome: 'Polícia' },
  { numero: '180', nome: 'Violência contra a mulher' },
  { numero: '100', nome: 'Direitos humanos' },
  { numero: '188', nome: 'CVV, apoio emocional' },
];

// Painel público: categorias com menos casos que isto entram em "Outro",
// para um número pequeno não apontar para uma pessoa (LGPD).
export const MINIMO_POR_CATEGORIA = 3;
