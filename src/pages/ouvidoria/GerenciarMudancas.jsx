// src/pages/ouvidoria/GerenciarMudancas.jsx
// A ouvidoria publica o que mudou na instituição a partir das denúncias.
// Aparece na seção "O que mudou" do painel de transparência.
import { useEffect, useState } from 'react';
import { useTitulo } from '../../hooks/useTitulo';
import { ouvirMudancas, publicarMudanca, removerMudanca } from '../../services/transparencia';

function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export default function GerenciarMudancas() {
  useTitulo('O que mudou');
  const [mudancas, setMudancas] = useState([]);
  const [mes, setMes] = useState(mesAtual());
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => ouvirMudancas(setMudancas, () => setErro('Não foi possível carregar.')), []);

  async function publicar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await publicarMudanca(mes, texto);
      setTexto('');
    } catch {
      setErro('Não foi possível publicar. Confira o texto (10 a 280 caracteres).');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id) {
    if (!window.confirm('Remover esta mudança do painel público?')) return;
    try {
      await removerMudanca(id);
    } catch {
      setErro('Não foi possível remover.');
    }
  }

  const tamanho = texto.trim().length;

  return (
    <section>
      <h1>O que mudou a partir das denúncias</h1>
      <p className="subtitulo">
        Ações concretas que a instituição tomou. Aparece no painel público: não cite pessoas,
        turmas pequenas nem detalhes de casos.
      </p>

      <form className="caixa form-mudanca" onSubmit={publicar}>
        <label className="campo">
          Mês
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} required />
        </label>
        <label className="campo campo-largo">
          O que mudou
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={280}
            placeholder="Ex.: Iluminação e câmeras no estacionamento do Bloco C."
            required
          />
        </label>
        <button
          type="submit"
          className="botao botao-primario"
          disabled={salvando || tamanho < 10 || !mes}
        >
          Publicar
        </button>
      </form>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <div className="caixa">
        {mudancas.length === 0 ? (
          <p className="nota">Nenhuma mudança publicada ainda.</p>
        ) : (
          <ul className="mudancas">
            {mudancas.map((m) => (
              <li key={m.id}>
                <time>{m.mes}</time>
                <span>{m.texto}</span>
                <button type="button" className="link link-perigo" onClick={() => remover(m.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
