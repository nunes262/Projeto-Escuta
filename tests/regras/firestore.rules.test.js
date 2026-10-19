// tests/regras/firestore.rules.test.js
// Testa as regras de segurança no emulador do Firestore (precisa de Java 11+).
// Rodar: npm run test:regras
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { UM_DIA } from '../../src/utils/datas.js';
import { gerarCodigo } from '../../src/utils/seguranca.js';

let ambiente;
const OUVIDOR = 'uid-ouvidor';

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-escuta',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(() => ambiente?.cleanup());

beforeEach(async () => {
  await ambiente.clearFirestore();
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    const db = contexto.firestore();
    await setDoc(doc(db, 'ouvidores', OUVIDOR), { nome: 'Ouvidoria' });
    await setDoc(doc(db, 'contadores', 'denuncias'), { valor: 0 });
  });
});

const anonimo = () => ambiente.unauthenticatedContext().firestore();
const ouvidoria = () => ambiente.authenticatedContext(OUVIDOR).firestore();
const intruso = () => ambiente.authenticatedContext('uid-qualquer').firestore();

// Mesmo fluxo de enviarDenuncia(), com pontos para "trapacear" nos testes
async function enviar(db, { codigo = gerarCodigo(), extra = {}, pularContador = false, numero } = {}) {
  const agora = new Date();
  await runTransaction(db, async (t) => {
    const contadorRef = doc(db, 'contadores', 'denuncias');
    const atual = (await t.get(contadorRef)).data()?.valor ?? 0;
    const n = numero ?? atual + 1;
    if (!pularContador) t.set(contadorRef, { valor: atual + 1 });
    t.set(doc(db, 'denuncias', codigo), {
      categoria: 'Bullying ou cyberbullying',
      local: 'Bloco B',
      quando: 'Ontem',
      descricao: 'Um grupo de alunos inventa apelidos para um colega.',
      riscoImediato: false,
      protocolo: `ESC-2026-${String(n).padStart(4, '0')}`,
      status: 'recebida',
      historico: [{ status: 'recebida', em: Timestamp.fromDate(agora), observacao: '' }],
      prazo: Timestamp.fromMillis(agora.getTime() + 30 * UM_DIA),
      prorrogado: false,
      setor: '',
      mensagemNova: false,
      criadoEm: serverTimestamp(),
      ...extra,
    });
  });
  return codigo;
}

async function lerComoAdmin(codigo) {
  let dados;
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    dados = (await getDoc(doc(contexto.firestore(), 'denuncias', codigo))).data();
  });
  return dados;
}

describe('anonimato', () => {
  it('qualquer pessoa denuncia sem login', async () => {
    await assertSucceeds(enviar(anonimo()));
  });

  it('sem login, listar as denúncias dá permission-denied', async () => {
    await enviar(anonimo());
    await assertFails(getDocs(collection(anonimo(), 'denuncias')));
  });

  it('logado mas fora da ouvidoria também não lista', async () => {
    await assertFails(getDocs(collection(intruso(), 'denuncias')));
  });

  it('com o código, abre a denúncia', async () => {
    const codigo = await enviar(anonimo());
    await assertSucceeds(getDoc(doc(anonimo(), 'denuncias', codigo)));
  });

  it('a ouvidoria lista todas', async () => {
    await enviar(anonimo());
    await assertSucceeds(getDocs(collection(ouvidoria(), 'denuncias')));
  });

  it('não aceita campos extras (ex.: IP ou nome)', async () => {
    await assertFails(enviar(anonimo(), { extra: { ip: '200.1.2.3' } }));
    await assertFails(enviar(anonimo(), { extra: { nome: 'Fulano' } }));
  });
});

describe('integridade da denúncia', () => {
  it('não nasce concluída nem com prazo inventado', async () => {
    await assertFails(enviar(anonimo(), { extra: { status: 'concluida' } }));
    await assertFails(
      enviar(anonimo(), { extra: { prazo: Timestamp.fromMillis(Date.now() + 90 * UM_DIA) } }),
    );
  });

  it('não aceita código fora do formato (ex.: escolhido a dedo)', async () => {
    await assertFails(enviar(anonimo(), { codigo: 'AAAAAAAAAAAAAAA0' }));
    await assertFails(enviar(anonimo(), { codigo: 'curto' }));
  });

  it('protocolo precisa usar o número do contador', async () => {
    await assertFails(enviar(anonimo(), { numero: 999 }));
    await assertFails(enviar(anonimo(), { pularContador: true }));
  });

  it('categoria precisa ser uma das previstas', async () => {
    await assertFails(enviar(anonimo(), { extra: { categoria: 'Spam' } }));
  });

  it('denunciante não muda o status nem apaga', async () => {
    const codigo = await enviar(anonimo());
    const ref = doc(anonimo(), 'denuncias', codigo);
    await assertFails(updateDoc(ref, { status: 'concluida' }));
    await assertFails(setDoc(ref, { status: 'arquivada' }, { merge: true }));
  });

  it('denunciante só liga o aviso de mensagem nova', async () => {
    const codigo = await enviar(anonimo());
    await assertSucceeds(updateDoc(doc(anonimo(), 'denuncias', codigo), { mensagemNova: true }));
    await assertFails(
      updateDoc(doc(anonimo(), 'denuncias', codigo), { mensagemNova: true, setor: 'Recursos humanos' }),
    );
  });
});

describe('ouvidoria', () => {
  async function mudar(db, codigo, status, observacao = '', setor) {
    const atual = await lerComoAdmin(codigo);
    return updateDoc(doc(db, 'denuncias', codigo), {
      status,
      setor: setor ?? atual.setor,
      historico: [...atual.historico, { status, em: Timestamp.now(), observacao }],
    });
  }

  it('muda o status acrescentando ao histórico', async () => {
    const codigo = await enviar(anonimo());
    await assertSucceeds(mudar(ouvidoria(), codigo, 'em_analise'));
  });

  it('não pode reescrever o histórico', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(
      updateDoc(doc(ouvidoria(), 'denuncias', codigo), {
        status: 'em_analise',
        historico: [{ status: 'em_analise', em: Timestamp.now(), observacao: '' }],
      }),
    );
  });

  it('arquivar ou concluir exige resposta escrita', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(mudar(ouvidoria(), codigo, 'arquivada', ''));
    await assertSucceeds(
      mudar(ouvidoria(), codigo, 'arquivada', 'Fato fora da instituição; orientamos o Disque 100.'),
    );
  });

  it('encaminhar exige um setor válido', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(mudar(ouvidoria(), codigo, 'encaminhada', '', ''));
    await assertFails(mudar(ouvidoria(), codigo, 'encaminhada', '', 'Setor inventado'));
    await assertSucceeds(mudar(ouvidoria(), codigo, 'encaminhada', '', 'Coordenação de curso'));
  });

  it('quem não é ouvidor não muda status', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(mudar(intruso(), codigo, 'em_analise'));
  });

  it('prorroga o prazo uma única vez, por 30 dias, com justificativa', async () => {
    const codigo = await enviar(anonimo());
    const atual = await lerComoAdmin(codigo);
    const prorrogar = (db, dias, justificativa) =>
      updateDoc(doc(db, 'denuncias', codigo), {
        prazo: Timestamp.fromMillis(atual.prazo.toMillis() + dias * UM_DIA),
        prorrogado: true,
        justificativaProrrogacao: justificativa,
        prorrogadoEm: serverTimestamp(),
      });
    await assertFails(prorrogar(ouvidoria(), 60, 'Precisamos ouvir outras pessoas.'));
    await assertFails(prorrogar(ouvidoria(), 30, 'curta'));
    await assertSucceeds(prorrogar(ouvidoria(), 30, 'Precisamos ouvir outras pessoas.'));
    await assertFails(
      updateDoc(doc(ouvidoria(), 'denuncias', codigo), {
        prazo: Timestamp.fromMillis(atual.prazo.toMillis() + 60 * UM_DIA),
        justificativaProrrogacao: 'Mais uma vez, por favor.',
        prorrogadoEm: serverTimestamp(),
      }),
    );
  });
});

describe('conversa anônima', () => {
  const mensagem = (autor, texto = 'Aconteceu de novo hoje.') => ({
    texto,
    autor,
    enviadaEm: serverTimestamp(),
  });

  it('denunciante escreve sem login e lê com o código', async () => {
    const codigo = await enviar(anonimo());
    const db = anonimo();
    const lote = writeBatch(db);
    lote.set(doc(collection(db, 'denuncias', codigo, 'mensagens')), mensagem('denunciante'));
    lote.update(doc(db, 'denuncias', codigo), { mensagemNova: true });
    await assertSucceeds(lote.commit());
    await assertSucceeds(getDocs(collection(db, 'denuncias', codigo, 'mensagens')));
  });

  it('ninguém se passa pela ouvidoria', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(addDoc(collection(anonimo(), 'denuncias', codigo, 'mensagens'), mensagem('ouvidoria')));
    await assertFails(addDoc(collection(intruso(), 'denuncias', codigo, 'mensagens'), mensagem('ouvidoria')));
    await assertSucceeds(addDoc(collection(ouvidoria(), 'denuncias', codigo, 'mensagens'), mensagem('ouvidoria')));
  });

  it('quem está logado não escreve como denunciante', async () => {
    const codigo = await enviar(anonimo());
    await assertFails(addDoc(collection(ouvidoria(), 'denuncias', codigo, 'mensagens'), mensagem('denunciante')));
  });

  it('não cria conversa em denúncia que não existe', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'denuncias', gerarCodigo(), 'mensagens'), mensagem('denunciante')),
    );
  });

  it('denúncia encerrada não recebe mensagens do denunciante', async () => {
    const codigo = await enviar(anonimo());
    await ambiente.withSecurityRulesDisabled(async (contexto) => {
      await updateDoc(doc(contexto.firestore(), 'denuncias', codigo), { status: 'concluida' });
    });
    await assertFails(addDoc(collection(anonimo(), 'denuncias', codigo, 'mensagens'), mensagem('denunciante')));
  });
});

describe('painel público', () => {
  it('todos leem as estatísticas, só a ouvidoria grava', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'estatisticas', 'publico')));
    const numeros = { ano: 2026, total: 1, atualizadoEm: serverTimestamp() };
    await assertFails(setDoc(doc(anonimo(), 'estatisticas', 'publico'), numeros));
    await assertFails(setDoc(doc(intruso(), 'estatisticas', 'publico'), numeros));
    await assertSucceeds(setDoc(doc(ouvidoria(), 'estatisticas', 'publico'), numeros));
  });

  it('estatísticas não aceitam texto livre', async () => {
    await assertFails(
      setDoc(doc(ouvidoria(), 'estatisticas', 'publico'), {
        ano: 2026,
        total: 1,
        ultimoRelato: 'texto vazado',
        atualizadoEm: serverTimestamp(),
      }),
    );
  });

  it('só a ouvidoria publica "o que mudou"', async () => {
    const mudanca = { mes: '2026-09', texto: 'Campanha contra cyberbullying.', criadoEm: serverTimestamp() };
    await assertFails(addDoc(collection(anonimo(), 'mudancas'), mudanca));
    await assertSucceeds(addDoc(collection(ouvidoria(), 'mudancas'), mudanca));
  });

  it('a lista de ouvidores não é pública', async () => {
    await assertFails(getDoc(doc(anonimo(), 'ouvidores', OUVIDOR)));
    await assertFails(getDocs(collection(intruso(), 'ouvidores')));
    await assertSucceeds(getDoc(doc(ouvidoria(), 'ouvidores', OUVIDOR)));
  });
});
