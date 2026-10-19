// src/services/transparencia.js
// Painel público: só números e as mudanças que a ouvidoria publica.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { calcularEstatisticas } from '../utils/estatisticas';

export function ouvirEstatisticas(aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, 'estatisticas', 'publico'),
    (snapshot) => aoMudar(snapshot.exists() ? snapshot.data() : null),
    aoFalhar,
  );
}

// Recalcula os números do painel público. Só números, nunca o conteúdo.
// Devolve a "assinatura" do cálculo para não regravar quando nada mudou.
export async function publicarEstatisticas(denuncias, assinaturaAnterior) {
  const numeros = calcularEstatisticas(denuncias);
  const assinatura = JSON.stringify(numeros);
  if (assinatura === assinaturaAnterior) return assinatura;
  await setDoc(doc(db, 'estatisticas', 'publico'), {
    ...numeros,
    atualizadoEm: serverTimestamp(),
  });
  return assinatura;
}

export function ouvirMudancas(aoMudar, aoFalhar) {
  const q = query(collection(db, 'mudancas'), orderBy('mes', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => aoMudar(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    aoFalhar,
  );
}

export function publicarMudanca(mes, texto) {
  return addDoc(collection(db, 'mudancas'), {
    mes,
    texto: texto.trim(),
    criadoEm: serverTimestamp(),
  });
}

export function removerMudanca(id) {
  return deleteDoc(doc(db, 'mudancas', id));
}
