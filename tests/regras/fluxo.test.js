// tests/regras/fluxo.test.js
// Fluxo completo usando o código de verdade do site (src/services) contra os
// emuladores: denúncia anônima → conversa → ouvidoria responde → painel público.
// Rodar: npm run test:regras
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/firebase.js';
import { auth } from '../../src/firebaseAuth.js';
import {
  enviarDenuncia,
  enviarMensagem,
  mudarStatus,
  ouvirDenuncia,
  ouvirMensagens,
  ouvirTodas,
  prorrogarPrazo,
} from '../../src/services/denuncias.js';
import { publicarEstatisticas, publicarMudanca } from '../../src/services/transparencia.js';

let ambiente;

// Transforma um onSnapshot em Promise com o primeiro valor que passar no teste
function primeiro(ouvir, condicao = () => true) {
  return new Promise((resolve, reject) => {
    const parar = ouvir((valor) => {
      if (condicao(valor)) {
        setTimeout(() => parar());
        resolve(valor);
      }
    }, reject);
  });
}

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-escuta',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
  await ambiente.clearFirestore();
});

afterAll(async () => {
  await signOut(auth).catch(() => {});
  await ambiente?.cleanup();
});

describe('fluxo completo', () => {
  let comprovante;

  it('denunciante envia sem login e recebe protocolo e código', async () => {
    comprovante = await enviarDenuncia({
      categoria: 'Assédio moral',
      local: '  Sala 204 ',
      quando: 'Semana passada',
      descricao: 'O professor humilha alunos que erram perguntas em voz alta.',
      riscoImediato: true,
      // campo a mais que um formulário adulterado poderia mandar
      email: 'nao-deve-ser-gravado@exemplo.com',
    });
    expect(comprovante.protocolo).toMatch(/^ESC-\d{4}-0001$/);
    expect(comprovante.codigo).toMatch(/^[2-9A-HJKMNP-Z]{16}$/);
  });

  it('a denúncia não guarda nada além do relato', async () => {
    const denuncia = await primeiro((ok, erro) => ouvirDenuncia(comprovante.codigo, ok, erro));
    expect(denuncia.local).toBe('Sala 204');
    expect(denuncia.email).toBeUndefined();
    expect(Object.keys(denuncia).sort()).toEqual(
      ['categoria', 'criadoEm', 'descricao', 'historico', 'id', 'local', 'mensagemNova',
        'prazo', 'protocolo', 'prorrogado', 'quando', 'riscoImediato', 'setor', 'status'].sort(),
    );
  });

  it('segundo envio recebe o protocolo seguinte', async () => {
    const outro = await enviarDenuncia({
      categoria: 'Outro',
      local: '',
      quando: '',
      descricao: 'Câmeras do corredor parecem apontar para dentro dos banheiros.',
      riscoImediato: false,
    });
    expect(outro.protocolo).toMatch(/-0002$/);
  });

  it('sem login não dá para listar', async () => {
    await expect(getDocs(collection(db, 'denuncias'))).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('denunciante manda mensagem e avisa a ouvidoria', async () => {
    await enviarMensagem(comprovante.codigo, 'Aconteceu de novo hoje.', 'denunciante');
    const denuncia = await primeiro(
      (ok, erro) => ouvirDenuncia(comprovante.codigo, ok, erro),
      (d) => d.mensagemNova,
    );
    expect(denuncia.mensagemNova).toBe(true);
  });

  it('ouvidoria entra, lista, responde, encaminha e prorroga', async () => {
    // E-mail novo a cada execução: o emulador de Auth pode já ter o anterior
    const email = `teste-${Date.now()}@escuta.dev`;
    const { user } = await createUserWithEmailAndPassword(auth, email, 'senha-forte-1');
    await ambiente.withSecurityRulesDisabled((contexto) =>
      setDoc(doc(contexto.firestore(), 'ouvidores', user.uid), { nome: 'Teste' }),
    );

    const lista = await primeiro((ok, erro) => ouvirTodas(ok, erro), (l) => l.length === 2);
    const denuncia = lista.find((d) => d.protocolo === comprovante.protocolo);

    await enviarMensagem(denuncia.id, 'Em qual turma? Não precisa dizer nomes.', 'ouvidoria');
    await mudarStatus(denuncia, 'em_analise');

    const emAnalise = await primeiro(
      (ok, erro) => ouvirDenuncia(denuncia.id, ok, erro),
      (d) => d.status === 'em_analise',
    );
    expect(emAnalise.mensagemNova).toBe(false);
    await mudarStatus(emAnalise, 'encaminhada', '', 'Coordenação de curso');

    const encaminhada = await primeiro(
      (ok, erro) => ouvirDenuncia(denuncia.id, ok, erro),
      (d) => d.status === 'encaminhada',
    );
    await prorrogarPrazo(encaminhada, 'O setor precisa ouvir outras turmas antes de concluir.');
    await expect(prorrogarPrazo(encaminhada, 'Tentando prorrogar de novo.')).rejects.toThrow();

    const final = await primeiro(
      (ok, erro) => ouvirDenuncia(denuncia.id, ok, erro),
      (d) => d.prorrogado,
    );
    await mudarStatus(final, 'concluida', 'A coordenação conversou com o professor e acompanhará as aulas.');
  });

  it('painel público recebe só números', async () => {
    const lista = await primeiro(
      (ok, erro) => ouvirTodas(ok, erro),
      (l) => l.some((d) => d.status === 'concluida'),
    );
    await publicarEstatisticas(lista, null);
    await publicarMudanca('2026-09', 'Campanha contra cyberbullying nas turmas.');
    await signOut(auth);

    const publico = (await getDoc(doc(db, 'estatisticas', 'publico'))).data();
    expect(publico.total).toBe(2);
    expect(publico.concluidas).toBe(1);
    expect(publico.percentualNoPrazo).toBe(100);
    // Categorias com 1 caso viram "Outro"
    expect(publico.porCategoria).toEqual({ Outro: 2 });
    expect(JSON.stringify(publico)).not.toMatch(/professor|Sala 204/);
  });

  it('denunciante vê a resposta e não escreve mais na denúncia encerrada', async () => {
    const denuncia = await primeiro((ok, erro) => ouvirDenuncia(comprovante.codigo, ok, erro));
    expect(denuncia.status).toBe('concluida');
    expect(denuncia.historico.at(-1).observacao).toMatch(/coordenação/);
    const mensagens = await primeiro((ok, erro) => ouvirMensagens(comprovante.codigo, ok, erro));
    expect(mensagens.map((m) => m.autor)).toEqual(['denunciante', 'ouvidoria']);
    await expect(
      enviarMensagem(comprovante.codigo, 'Mais uma coisa', 'denunciante'),
    ).rejects.toThrow();
  });
});
