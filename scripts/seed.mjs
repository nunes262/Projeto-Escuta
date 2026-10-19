// scripts/seed.mjs
// Popula o banco com dados de teste realistas (entrega final).
//
// Emuladores (padrão):  npm run emuladores   e, em outro terminal,  npm run seed
// Projeto real:         GOOGLE_APPLICATION_CREDENTIALS=chave.json node scripts/seed.mjs --real <projectId>
//
// Usa o Admin SDK, que ignora as regras: só roda no seu computador, nunca no site.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { PRAZO_DIAS, PRORROGACAO_DIAS } from '../src/constantes.js';
import { UM_DIA } from '../src/utils/datas.js';
import { calcularEstatisticas } from '../src/utils/estatisticas.js';
import { gerarCodigo } from '../src/utils/seguranca.js';

const real = process.argv.includes('--real');
const projectId = real ? process.argv[process.argv.indexOf('--real') + 1] : 'demo-escuta';
if (real && !projectId) {
  console.error('Use: node scripts/seed.mjs --real <projectId>');
  process.exit(1);
}
if (!real) {
  // Não procura credenciais do Google Cloud: os emuladores não precisam
  process.env.METADATA_SERVER_DETECTION ??= 'none';
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}

initializeApp({ projectId });
const db = getFirestore();

// Gerador pseudoaleatório com semente: os mesmos dados a cada execução
let semente = 2026;
function aleatorio() {
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
}
const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];

const RELATOS = {
  'Bullying ou cyberbullying': [
    ['Bloco B, 2º andar, e no grupo da turma', 'Há cerca de um mês, quase todo dia', 'Um grupo de alunos inventa apelidos para um colega e compartilha montagens com a foto dele no grupo da turma. Ele parou de vir a algumas aulas. Já vi acontecer no corredor do Bloco B também.'],
    ['Grupo de WhatsApp do 1º período', 'Desde o início do semestre', 'Criaram um perfil falso para zombar de uma aluna, com fotos tiradas sem ela saber. Os prints circulam entre várias turmas.'],
    ['Cantina e pátio', 'Toda sexta, no intervalo', 'Alguns alunos derrubam a bandeja de um colega e filmam a reação para postar. Ninguém da equipe estava por perto nas vezes que vi.'],
    ['Laboratório 3', 'Semana passada', 'Durante as aulas práticas, um grupo esconde o material de um colega e ri quando ele pede ajuda ao professor.'],
  ],
  'Assédio moral': [
    ['Sala dos professores', 'Nos últimos dois meses', 'Uma chefia grita com funcionários na frente de outras pessoas e ameaça com demissão quando alguém questiona as escalas.'],
    ['Aulas de uma disciplina do 5º período', 'Desde agosto', 'O professor humilha alunos que erram perguntas, chamando de burros em voz alta e dizendo que não vão se formar.'],
    ['Secretaria acadêmica', 'Há duas semanas', 'Uma estagiária é colocada para fazer tarefas pessoais de um supervisor e é excluída das reuniões quando reclama.'],
  ],
  'Assédio sexual': [
    ['Estacionamento do Bloco C', 'Por volta das 22h, mais de uma vez', 'Um homem que parece ser funcionário terceirizado faz comentários sobre o corpo de alunas que saem da aula da noite e às vezes as segue até o carro.'],
    ['Mensagens privadas no Instagram', 'Desde o mês passado', 'Um monitor manda mensagens insistentes com convites e elogios de cunho sexual para calouras, mesmo depois de elas pedirem para parar.'],
  ],
  Discriminação: [
    ['Sala 204', 'Na última avaliação', 'Um professor fez piadas sobre o sotaque de alunos do Norte e disse que eles deveriam voltar para a terra deles.'],
    ['Processo seletivo de estágio interno', 'Setembro', 'Uma candidata cadeirante foi informada de que a vaga não seria para ela porque o setor fica no 2º andar e não haveria como adaptar.'],
    ['Vestiário do ginásio', 'Há algumas semanas', 'Um grupo impede um aluno trans de usar o vestiário e faz comentários ofensivos sempre que ele passa.'],
  ],
  'Violência física': [
    ['Portão principal', 'Ontem à noite', 'Dois alunos brigaram na saída e um deles ficou machucado. Houve ameaças de continuar a briga nesta semana.'],
    ['Quadra de esportes', 'No intervalo de hoje', 'Um aluno empurrou outro contra a grade durante um jogo e disse que vai pegá-lo de novo na saída.'],
  ],
  'Irregularidade administrativa': [
    ['Biblioteca', 'Desde o início do ano', 'Livros comprados com verba de projeto não aparecem no acervo, mas constam como recebidos na prestação de contas.'],
    ['Lanchonete terceirizada', 'Este semestre', 'A lanchonete cobra preços diferentes dos que constam no contrato afixado e não emite nota.'],
    ['Seleção de bolsas de monitoria', 'Agosto', 'O resultado saiu antes das entrevistas, e os aprovados são todos do mesmo grupo de pesquisa do coordenador.'],
  ],
  Outro: [
    ['Banheiros do Bloco A', 'Há meses', 'As câmeras instaladas no corredor parecem apontar para dentro dos banheiros. Ninguém explicou para que servem.'],
    ['Ônibus fretado', 'Semana passada', 'O motorista do ônibus fretado dirige em alta velocidade e usa o celular ao volante com os alunos dentro.'],
  ],
};

// Peso de cada categoria (parecido com o protótipo do PDF)
const PESOS = [
  ['Bullying ou cyberbullying', 34],
  ['Assédio moral', 18],
  ['Discriminação', 16],
  ['Assédio sexual', 11],
  ['Violência física', 8],
  ['Irregularidade administrativa', 7],
  ['Outro', 6],
];
function categoriaAleatoria() {
  let sorteio = aleatorio() * 100;
  for (const [categoria, peso] of PESOS) {
    sorteio -= peso;
    if (sorteio <= 0) return categoria;
  }
  return 'Outro';
}

const RESPOSTAS = [
  'A coordenação do curso conversou com a turma, os envolvidos foram advertidos e a situação será acompanhada pelo núcleo de apoio.',
  'O caso foi apurado pelo setor responsável e foram aplicadas as medidas previstas no regimento. Obrigado por avisar.',
  'Foram instaladas melhorias no local e a segurança passou a fazer ronda no horário indicado.',
  'O contrato foi revisto e a empresa foi notificada. Os preços corretos voltaram a ser cobrados.',
];
const ARQUIVAMENTOS = [
  'Não foi possível identificar o local nem a turma, e a conversa anônima ficou sem resposta por mais de 20 dias.',
  'O relato trata de um fato fora da instituição. Orientamos procurar a Delegacia ou o Disque 100.',
];
const PERGUNTAS = [
  'Olá. Recebemos sua denúncia e ela está em análise. Você sabe em qual turma os envolvidos estudam? Não precisa dizer nomes.',
  'Obrigado pelo relato. Isso aconteceu mais de uma vez? Em que horário costuma acontecer?',
];
const RESPOSTAS_DENUNCIANTE = [
  'São do 3º período de Sistemas de Informação, turma da noite.',
  'Sim, quase toda semana, sempre depois das 21h.',
];

const ts = (ms) => Timestamp.fromMillis(Math.round(ms));
const hoje = Date.now();
const anoAtual = new Date().getFullYear();
const inicio = new Date(anoAtual, 4, 1).getTime(); // maio

// Mais denúncias depois de campanhas; julho tem férias
const FATOR_MES = { 4: 0.7, 5: 0.85, 6: 0.35, 7: 1.2, 8: 1.5, 9: 1.3, 10: 1.1, 11: 0.9 };

async function apagarColecao(caminho) {
  const docs = await db.collection(caminho).listDocuments();
  for (const d of docs) await db.recursiveDelete(d);
}

async function main() {
  console.log(`Projeto: ${projectId}${real ? ' (REAL)' : ' (emuladores)'}`);
  await Promise.all(['denuncias', 'mudancas', 'estatisticas', 'contadores'].map(apagarColecao));

  const denuncias = [];
  let numero = 0;
  for (let dia = inicio; dia < hoje - UM_DIA / 2; dia += UM_DIA) {
    const mes = new Date(dia).getMonth();
    const semana = new Date(dia).getDay();
    const chance = (semana === 0 || semana === 6 ? 0.15 : 0.95) * (FATOR_MES[mes] ?? 1);
    if (aleatorio() > chance) continue;

    numero += 1;
    const criado = dia + (8 + aleatorio() * 14) * 60 * 60 * 1000;
    const idade = (hoje - criado) / UM_DIA;
    const categoria = categoriaAleatoria();
    const [local, quando, descricao] = escolher(RELATOS[categoria]);
    const urgente = categoria === 'Violência física' || (categoria === 'Assédio sexual' && aleatorio() < 0.3);

    const historico = [{ status: 'recebida', em: ts(criado), observacao: '' }];
    let prazo = criado + PRAZO_DIAS * UM_DIA;
    let status = 'recebida';
    let setor = '';
    const extra = {};
    const mensagens = [];

    const analise = criado + (0.3 + aleatorio() * 2) * UM_DIA;
    if (idade > 1.5 || aleatorio() < 0.3) {
      status = 'em_analise';
      historico.push({ status, em: ts(analise), observacao: '' });
      if (aleatorio() < 0.6) {
        const i = Math.floor(aleatorio() * PERGUNTAS.length);
        mensagens.push({ autor: 'ouvidoria', texto: PERGUNTAS[i], em: analise + 3600e3 });
        if (aleatorio() < 0.8) {
          mensagens.push({ autor: 'denunciante', texto: RESPOSTAS_DENUNCIANTE[i], em: analise + 5 * 3600e3 });
        }
      }
    }

    const encaminhamento = analise + (1 + aleatorio() * 4) * UM_DIA;
    if (status === 'em_analise' && idade > 6 && aleatorio() < 0.85) {
      status = 'encaminhada';
      setor = escolher(
        categoria === 'Irregularidade administrativa'
          ? ['Diretoria administrativa']
          : ['Coordenação de curso', 'Núcleo de apoio psicopedagógico', 'Diretoria acadêmica', 'Segurança do campus'],
      );
      historico.push({ status, em: ts(encaminhamento), observacao: 'Encaminhada sem identificar quem denunciou.' });
    }

    // Algumas antigas e complexas são prorrogadas (Lei 13.460/2017)
    if (status === 'encaminhada' && idade > 24 && aleatorio() < 0.25) {
      extra.prorrogado = true;
      extra.justificativaProrrogacao = 'O setor responsável precisa ouvir outras pessoas antes de concluir a apuração.';
      extra.prorrogadoEm = ts(criado + 27 * UM_DIA);
      prazo += PRORROGACAO_DIAS * UM_DIA;
    }

    // Tempo até a resposta final: ~9 dias em média, alguns passam do prazo
    const duracao = 3 + aleatorio() * 12 + (aleatorio() < 0.08 ? 25 : 0);
    // Recentes ficam mais vezes em aberto, para a fila da ouvidoria ter movimento
    const chanceFechar = idade > 30 ? 0.97 : 0.45;
    if (status !== 'recebida' && idade > duracao && aleatorio() < chanceFechar) {
      const fim = criado + duracao * UM_DIA;
      const arquivar = aleatorio() < 0.12;
      status = arquivar ? 'arquivada' : 'concluida';
      historico.push({
        status,
        em: ts(Math.max(fim, paraUltimo(historico) + 3600e3)),
        observacao: arquivar ? escolher(ARQUIVAMENTOS) : escolher(RESPOSTAS),
      });
    }

    const pendente = mensagens.at(-1)?.autor === 'denunciante' && !['concluida', 'arquivada'].includes(status);
    denuncias.push({
      codigo: gerarCodigo(),
      dados: {
        categoria,
        local,
        quando,
        descricao,
        riscoImediato: urgente,
        protocolo: `ESC-${anoAtual}-${String(numero).padStart(4, '0')}`,
        status,
        historico,
        prazo: ts(prazo),
        prorrogado: false,
        setor,
        mensagemNova: pendente,
        criadoEm: ts(criado),
        ...extra,
      },
      mensagens,
    });
  }

  for (const { codigo, dados, mensagens } of denuncias) {
    const ref = db.collection('denuncias').doc(codigo);
    await ref.set(dados);
    for (const m of mensagens) {
      await ref.collection('mensagens').add({ autor: m.autor, texto: m.texto, enviadaEm: ts(m.em) });
    }
  }
  await db.doc('contadores/denuncias').set({ valor: numero });

  const numeros = calcularEstatisticas(denuncias.map((d) => d.dados), anoAtual);
  await db.doc('estatisticas/publico').set({ ...numeros, atualizadoEm: Timestamp.now() });

  const mudancas = [
    [9, 'Campanha contra cyberbullying nas turmas de 1º período.'],
    [8, 'Iluminação e câmeras no estacionamento do Bloco C.'],
    [7, 'Novo protocolo de acolhimento para casos de assédio.'],
    [6, 'Lanchonete passou a afixar a tabela de preços do contrato.'],
  ];
  for (const [mes, texto] of mudancas) {
    if (new Date(anoAtual, mes - 1, 1).getTime() > hoje) continue;
    await db.collection('mudancas').add({
      mes: `${anoAtual}-${String(mes).padStart(2, '0')}`,
      texto,
      criadoEm: Timestamp.now(),
    });
  }

  if (!real) {
    const auth = getAuth();
    const email = 'ouvidoria@escuta.dev';
    let usuario;
    try {
      usuario = await auth.getUserByEmail(email);
    } catch {
      usuario = await auth.createUser({ email, password: 'escuta123', displayName: 'Ouvidoria' });
    }
    await db.doc(`ouvidores/${usuario.uid}`).set({ nome: 'Ouvidoria', setor: 'Ouvidoria geral' });
    console.log(`Login da ouvidoria: ${email} / escuta123`);
  }

  // Uma denúncia aberta para testar a tela de acompanhamento
  const exemplo = denuncias.findLast((d) => d.dados.status === 'em_analise') ?? denuncias.at(-1);
  console.log(`${denuncias.length} denúncias criadas. Estatísticas:`, numeros);
  console.log(`Código de exemplo (${exemplo.dados.protocolo}): ${exemplo.codigo.match(/.{4}/g).join('-')}`);
}

function paraUltimo(historico) {
  return historico.at(-1).em.toMillis();
}

main().then(
  () => process.exit(0),
  (erro) => {
    console.error(erro);
    process.exit(1);
  },
);
