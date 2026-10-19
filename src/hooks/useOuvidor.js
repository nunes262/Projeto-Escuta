// src/hooks/useOuvidor.js
// Diz se quem está logado faz parte da ouvidoria.
// Os ouvidores são cadastrados à mão no console, na coleção "ouvidores".
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebaseAuth';

// Ao recarregar a página, o login é restaurado depois que o Firestore já
// começou: ele reinicia a conexão com o novo usuário e uma leitura feita
// nesse instante falha ("unavailable" ou "permission-denied"). Tenta de novo.
const ERROS_PASSAGEIROS = ['unavailable', 'permission-denied'];

async function buscarRegistro(uid) {
  for (let tentativa = 0; ; tentativa += 1) {
    try {
      return await getDoc(doc(db, 'ouvidores', uid));
    } catch (erro) {
      if (!ERROS_PASSAGEIROS.includes(erro.code) || tentativa >= 5) throw erro;
      await new Promise((r) => setTimeout(r, 300 * (tentativa + 1)));
    }
  }
}

export function useOuvidor() {
  const [estado, setEstado] = useState({
    carregando: true,
    usuario: null,
    ouvidor: null,
    erro: false,
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
          setEstado({ carregando: false, usuario: null, ouvidor: null, erro: false });
          return;
        }
        try {
          const registro = await buscarRegistro(usuario.uid);
          setEstado({
            carregando: false,
            usuario,
            ouvidor: registro.exists() ? { uid: usuario.uid, ...registro.data() } : null,
            erro: false,
          });
        } catch {
          // Falha de conexão não é o mesmo que "não é ouvidor"
          setEstado({ carregando: false, usuario, ouvidor: null, erro: true });
        }
      }),
    [],
  );

  return estado;
}
