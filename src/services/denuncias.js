// src/services/denuncias.js
// Todas as leituras e gravações de denúncias passam por aqui.
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { PRAZO_DIAS, PRORROGACAO_DIAS } from '../constantes';
import { paraMillis, somarDias, UM_DIA } from '../utils/datas';
import { gerarCodigo } from '../utils/seguranca';

// Envia a denúncia e devolve o protocolo, o código secreto e as datas.
// Não grava nome, e-mail nem IP: só o que a pessoa escreveu.
export async function enviarDenuncia(form) {
  // Lista fechada de campos: nada além disto sai do navegador
  const dados = {
    categoria: form.categoria,
    local: form.local.trim(),
    quando: form.quando.trim(),
    descricao: form.descricao.trim(),
    riscoImediato: Boolean(form.riscoImediato),
  };

  const contadorRef = doc(db, 'contadores', 'denuncias');
  const agora = new Date();
  const prazo = somarDias(agora, PRAZO_DIAS);

  // Na chance (astronômica) de o código já existir, gera outro
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const codigo = gerarCodigo();
    const denunciaRef = doc(db, 'denuncias', codigo);

    // Transação: dois envios ao mesmo tempo nunca recebem o mesmo protocolo
    const protocolo = await runTransaction(db, async (transacao) => {
      const existente = await transacao.get(denunciaRef);
      if (existente.exists()) return null;

      const contador = await transacao.get(contadorRef);
      const numero = (contador.data()?.valor ?? 0) + 1;
      const novoProtocolo = `ESC-${agora.getFullYear()}-${String(numero).padStart(4, '0')}`;

      transacao.set(contadorRef, { valor: numero });
      transacao.set(denunciaRef, {
        ...dados,
        protocolo: novoProtocolo,
        status: 'recebida',
        // serverTimestamp() não funciona dentro de listas, por isso a data local
        historico: [{ status: 'recebida', em: Timestamp.fromDate(agora), observacao: '' }],
        prazo: Timestamp.fromDate(prazo),
        prorrogado: false,
        setor: '',
        mensagemNova: false,
        criadoEm: serverTimestamp(),
      });
      return novoProtocolo;
    });

    if (protocolo) return { protocolo, codigo, recebidaEm: agora, prazo };
  }
  throw new Error('Não foi possível gerar um código. Tente de novo.');
}

// Quem tem o código abre a denúncia (o código é o ID do documento).
// Em tempo real: o status muda na tela assim que a ouvidoria atualiza.
export function ouvirDenuncia(codigo, aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, 'denuncias', codigo),
    (snapshot) => aoMudar(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    aoFalhar,
  );
}

// Conversa anônima entre denunciante e ouvidoria, em tempo real
export function ouvirMensagens(codigo, aoMudar, aoFalhar) {
  const q = query(collection(db, 'denuncias', codigo, 'mensagens'), orderBy('enviadaEm', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => aoMudar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    aoFalhar,
  );
}

// Grava a mensagem e, no mesmo lote, avisa (ou desavisa) a ouvidoria
export function enviarMensagem(codigo, texto, autor) {
  const lote = writeBatch(db);
  lote.set(doc(collection(db, 'denuncias', codigo, 'mensagens')), {
    texto,
    autor, // 'denunciante' ou 'ouvidoria'
    enviadaEm: serverTimestamp(),
  });
  lote.update(doc(db, 'denuncias', codigo), { mensagemNova: autor === 'denunciante' });
  return lote.commit();
}

// Lista todas as denúncias. As regras só permitem isso para a ouvidoria.
export function ouvirTodas(aoMudar, aoFalhar) {
  const q = query(collection(db, 'denuncias'), orderBy('criadoEm', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => aoMudar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    aoFalhar,
  );
}

export function mudarStatus(denuncia, novoStatus, observacao = '', setor = denuncia.setor) {
  return updateDoc(doc(db, 'denuncias', denuncia.id), {
    status: novoStatus,
    setor: novoStatus === 'encaminhada' ? setor : denuncia.setor,
    historico: [
      ...denuncia.historico,
      { status: novoStatus, em: Timestamp.now(), observacao: observacao.trim() },
    ],
  });
}

export function marcarComoLida(denuncia) {
  return updateDoc(doc(db, 'denuncias', denuncia.id), { mensagemNova: false });
}

// Lei 13.460/2017, art. 16: prorrogação única, por igual período, justificada
export function prorrogarPrazo(denuncia, justificativa) {
  return updateDoc(doc(db, 'denuncias', denuncia.id), {
    prazo: Timestamp.fromMillis(paraMillis(denuncia.prazo) + PRORROGACAO_DIAS * UM_DIA),
    prorrogado: true,
    justificativaProrrogacao: justificativa.trim(),
    prorrogadoEm: serverTimestamp(),
  });
}
