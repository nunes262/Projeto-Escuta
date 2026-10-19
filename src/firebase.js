// src/firebase.js
// Conecta o site ao projeto criado no console do Firebase.
// As chaves ficam no arquivo .env.local (fora do GitHub).
//
// O Authentication NÃO é carregado aqui: só a área da ouvidoria usa login,
// então ele fica em firebaseAuth.js e só é baixado por quem entra nela.
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

export const usandoEmuladores = import.meta.env.VITE_USE_EMULATORS === 'true';

const firebaseConfig =
  usandoEmuladores && !import.meta.env.VITE_FIREBASE_PROJECT_ID
    ? // Projetos "demo-" funcionam só com os emuladores, sem conta no Google
      { apiKey: 'demo', projectId: 'demo-escuta', authDomain: 'demo-escuta.firebaseapp.com' }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

export const firebaseConfigurado = Boolean(
  firebaseConfig.projectId && firebaseConfig.projectId !== 'cole-aqui',
);

// Sem configuração o site ainda abre e mostra um aviso (ver App.jsx),
// em vez de quebrar com tela branca.
export const app = initializeApp(
  firebaseConfigurado ? firebaseConfig : { ...firebaseConfig, projectId: 'nao-configurado' },
);

// Feedback 2: App Check com reCAPTCHA v3 barra envio em massa por robôs.
// Depois de testar, ative a "aplicação obrigatória" no console do Firebase.
const chaveRecaptcha = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (chaveRecaptcha && !usandoEmuladores) {
  if (import.meta.env.DEV) {
    // Em localhost o console mostra um token de depuração para cadastrar
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(chaveRecaptcha),
    isTokenAutoRefreshEnabled: true,
  });
}

// Cache só em memória (padrão): nada das denúncias fica gravado no
// navegador, o que importa em computadores compartilhados.
export const db = getFirestore(app);

if (usandoEmuladores) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
