// src/pages/ouvidoria/LoginOuvidoria.jsx
// Login só para a equipe da ouvidoria. Denunciantes nunca fazem login.
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { IconeCadeado } from '../../components/Icones';
import Marca from '../../components/Marca';
import { usandoEmuladores } from '../../firebase';
import { auth, persistenciaPronta } from '../../firebaseAuth';
import { useOuvidor } from '../../hooks/useOuvidor';
import { useTitulo } from '../../hooks/useTitulo';

const ERROS = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com o servidor.',
};

export default function LoginOuvidoria() {
  useTitulo('Acesso da ouvidoria');
  const { carregando, usuario, ouvidor, erro: erroConexao } = useOuvidor();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');

  if (carregando) return <p className="carregando">Carregando…</p>;
  if (ouvidor) return <Navigate to="/ouvidoria" replace />;

  async function entrar(evento) {
    evento.preventDefault();
    setEntrando(true);
    setErro('');
    setInfo('');
    try {
      await persistenciaPronta;
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (e) {
      setErro(ERROS[e.code] ?? 'Não foi possível entrar. Tente de novo.');
    } finally {
      setEntrando(false);
    }
  }

  async function recuperarSenha() {
    setErro('');
    if (!email.trim()) {
      setErro('Digite seu e-mail para receber o link de nova senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Mesma resposta exista ou não a conta, para não revelar quem é da equipe
    }
    setInfo('Se o e-mail estiver cadastrado, você vai receber um link para criar nova senha.');
  }

  return (
    <div className="tela-login">
      <main id="conteudo" className="cartao-login">
        <Marca subtitulo="Ouvidoria" />
        <h1>
          <IconeCadeado /> Acesso da ouvidoria
        </h1>
        <p className="subtitulo">
          Área restrita à equipe designada pela instituição. Para denunciar não é preciso login.
        </p>

        {usuario && !ouvidor ? (
          <>
            <p className="erro" role="alert">
              {erroConexao ? (
                'Não foi possível confirmar seu acesso agora. Verifique a conexão e recarregue a página.'
              ) : (
                <>
                  A conta {usuario.email} não está cadastrada como ouvidoria. Peça ao responsável
                  para incluir o seu UID na coleção <code>ouvidores</code>.
                </>
              )}
            </p>
            <button type="button" className="botao botao-secundario" onClick={() => signOut(auth)}>
              Sair desta conta
            </button>
          </>
        ) : (
          <form onSubmit={entrar} className="form-login">
            <label className="campo">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="campo">
              Senha
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}
            {info && (
              <p className="sucesso" role="status">
                {info}
              </p>
            )}
            <button type="submit" className="botao botao-primario" disabled={entrando}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
            <button type="button" className="link" onClick={recuperarSenha}>
              Esqueci a senha
            </button>
          </form>
        )}

        {usandoEmuladores && (
          <p className="nota">
            Emuladores: depois de <code>npm run seed</code>, entre com{' '}
            <code>ouvidoria@escuta.dev</code> e a senha <code>escuta123</code>.
          </p>
        )}
      </main>
    </div>
  );
}
