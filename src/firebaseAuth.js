// src/firebaseAuth.js
// Login da equipe da ouvidoria. Quem denuncia nunca baixa este arquivo.
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth';
import { app, usandoEmuladores } from './firebase';

export const auth = getAuth(app);

if (usandoEmuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// A sessão acaba quando a aba ou o navegador fecha (computadores compartilhados)
export const persistenciaPronta = setPersistence(auth, browserSessionPersistence).catch(() => {});
