// src/pages/NovaDenuncia.jsx
// Tela 2: registrar o relato em três passos, sem expor quem denuncia.
// Nada é gravado até o passo 3. O rascunho fica só na memória da página.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaixaEmergencia from '../components/FaixaEmergencia';
import { IconeAlerta, IconeCategoria, IconeCheck, IconeSeta } from '../components/Icones';
import Passos from '../components/Passos';
import { CATEGORIAS, LIMITES } from '../constantes';
import { useTitulo } from '../hooks/useTitulo';
import { enviarDenuncia } from '../services/denuncias';
import { encontrarDadosPessoais } from '../utils/dadosPessoais';

const ETAPAS = ['O que aconteceu', 'Detalhes', 'Revisar e enviar'];

// Coluna lateral: o que está (e o que não está) acontecendo com os dados agora
function PainelPrivacidade({ dadosPessoais, passo, tamanho }) {
  const itens = [
    { ok: true, texto: 'Você não fez login e ninguém sabe quem é você' },
    { ok: true, texto: 'Nada do que você digita fica salvo neste aparelho' },
    {
      ok: dadosPessoais.length === 0,
      texto:
        dadosPessoais.length === 0
          ? 'Nenhum dado pessoal encontrado no texto'
          : `Encontramos ${dadosPessoais.join(', ')} no texto`,
    },
    {
      ok: passo < 3 || null,
      texto: passo < 3 ? 'Nada foi enviado ainda' : 'Só será enviado quando você confirmar',
    },
  ];

  return (
    <aside className="painel-privacidade" aria-label="Sua privacidade agora">
      <p className="sobretitulo">Sua privacidade agora</p>
      <ul>
        {itens.map((item) => (
          <li key={item.texto} className={item.ok === false ? 'atencao' : undefined}>
            <span className="painel-marca" aria-hidden="true">
              {item.ok === false ? <IconeAlerta width={14} height={14} /> : <IconeCheck width={14} height={14} />}
            </span>
            {item.texto}
          </li>
        ))}
      </ul>
      {tamanho > 0 && (
        <div className="medidor" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (tamanho / LIMITES.descricao) * 100)}%` }} />
        </div>
      )}
      <p className="painel-dica">
        Dica: descreva fatos (o que, onde, quando), não opiniões sobre pessoas. Isso ajuda a ouvidoria
        a agir e protege você.
      </p>
    </aside>
  );
}

export default function NovaDenuncia() {
  useTitulo('Nova denúncia');
  const navigate = useNavigate();
  const titulo = useRef(null);
  const [passo, setPasso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    categoria: '',
    local: '',
    quando: '',
    descricao: '',
    riscoImediato: false,
  });

  const temConteudo = Boolean(form.categoria || form.descricao || form.local);

  // Leva o foco ao título a cada passo (leitores de tela anunciam a mudança)
  useEffect(() => {
    titulo.current?.focus();
  }, [passo]);

  // Avisa antes de fechar a aba com um relato não enviado
  useEffect(() => {
    if (!temConteudo || enviando) return undefined;
    function aoSair(evento) {
      evento.preventDefault();
    }
    window.addEventListener('beforeunload', aoSair);
    return () => window.removeEventListener('beforeunload', aoSair);
  }, [temConteudo, enviando]);

  function atualizar(evento) {
    const { name, value, type, checked } = evento.target;
    setForm((atual) => ({ ...atual, [name]: type === 'checkbox' ? checked : value }));
  }

  async function enviar() {
    setEnviando(true);
    setErro('');
    try {
      const comprovante = await enviarDenuncia(form);
      // O código vai pelo state da navegação, não pela URL,
      // para não ficar salvo no histórico do navegador
      navigate('/denuncia/enviada', { state: comprovante, replace: true });
    } catch {
      setErro('Não foi possível enviar. Verifique a conexão e tente de novo.');
      setEnviando(false);
    }
  }

  const textoCompleto = `${form.local} ${form.quando} ${form.descricao}`;
  const dadosPessoais = encontrarDadosPessoais(textoCompleto);
  const tamanhoDescricao = form.descricao.trim().length;
  const descricaoCurta = tamanhoDescricao < LIMITES.descricaoMin;

  return (
    <div className="largura formulario-grade">
    <div className="formulario-denuncia">
      <Passos etapas={ETAPAS} atual={passo} />

      {passo === 1 && (
        <section>
          <h1 ref={titulo} tabIndex={-1}>
            O que aconteceu?
          </h1>
          <p className="subtitulo">Escolha a categoria que mais se aproxima. Você pode mudar depois.</p>
          <fieldset className="opcoes">
            <legend className="visualmente-oculto">Categoria</legend>
            {CATEGORIAS.map((c) => (
              <label
                key={c.valor}
                className={form.categoria === c.valor ? 'opcao ativa' : 'opcao'}
              >
                <input
                  type="radio"
                  name="categoria"
                  value={c.valor}
                  checked={form.categoria === c.valor}
                  onChange={atualizar}
                />
                <span className="opcao-icone">
                  <IconeCategoria categoria={c.valor} />
                </span>
                <strong>{c.valor}</strong>
                <span>{c.ajuda}</span>
              </label>
            ))}
          </fieldset>
          <div className="rodape-form">
            <button
              type="button"
              className="botao botao-primario"
              disabled={!form.categoria}
              onClick={() => setPasso(2)}
            >
              Continuar <IconeSeta width={16} height={16} />
            </button>
          </div>
        </section>
      )}

      {passo === 2 && (
        <section>
          <h1 ref={titulo} tabIndex={-1}>
            Conte os detalhes
          </h1>
          <p className="subtitulo">Escreva só o que você se sentir à vontade para contar.</p>

          <p className="categoria-escolhida">
            Categoria: <span className="pilula">{form.categoria}</span>
            <button type="button" className="link" onClick={() => setPasso(1)}>
              alterar
            </button>
          </p>

          <div className="campos-lado">
            <label className="campo">
              Onde aconteceu?
              <input
                name="local"
                value={form.local}
                onChange={atualizar}
                maxLength={LIMITES.local}
                placeholder="Ex.: Bloco B, 2º andar, ou no grupo da turma"
              />
            </label>
            <label className="campo">
              Quando? (pode ser aproximado)
              <input
                name="quando"
                value={form.quando}
                onChange={atualizar}
                maxLength={LIMITES.quando}
                placeholder="Ex.: há cerca de um mês, quase toda semana"
              />
            </label>
          </div>

          <label className="campo">
            O que aconteceu?
            <textarea
              name="descricao"
              rows={7}
              maxLength={LIMITES.descricao}
              value={form.descricao}
              onChange={atualizar}
              aria-describedby="dica-descricao"
            />
          </label>
          <p id="dica-descricao" className="dica-campo">
            <span>
              Seja específico sobre fatos, não sobre pessoas.
              {descricaoCurta && ` Mínimo de ${LIMITES.descricaoMin} caracteres.`}
            </span>
            <span>
              {form.descricao.length} / {LIMITES.descricao}
            </span>
          </p>

          <p className="aviso">
            <IconeAlerta /> Para continuar anônimo, não escreva seu nome nem detalhes que só você
            saberia.
          </p>

          {dadosPessoais.length > 0 && (
            <p className="aviso aviso-forte" role="status">
              <IconeAlerta />
              <span>
                Parece que o texto tem {dadosPessoais.join(', ')}. Se for seu, apague antes de
                enviar: isso pode identificar você.
              </span>
            </p>
          )}

          <label className="check">
            <input
              type="checkbox"
              name="riscoImediato"
              checked={form.riscoImediato}
              onChange={atualizar}
            />
            Alguém corre risco agora
          </label>
          {form.riscoImediato && (
            <div role="alert">
              <FaixaEmergencia destaque />
              <p className="nota">
                Ligue agora se alguém corre perigo. Você também pode continuar a denúncia: ela vai
                para o topo da fila da ouvidoria.
              </p>
            </div>
          )}

          <div className="rodape-form">
            <button type="button" className="botao botao-secundario" onClick={() => setPasso(1)}>
              Voltar
            </button>
            <button
              type="button"
              className="botao botao-primario"
              disabled={descricaoCurta}
              onClick={() => setPasso(3)}
            >
              Revisar
            </button>
          </div>
        </section>
      )}

      {passo === 3 && (
        <section>
          <h1 ref={titulo} tabIndex={-1}>
            Revise antes de enviar
          </h1>
          <p className="subtitulo">Depois de enviada, a denúncia não pode ser editada.</p>
          <dl className="revisao">
            <dt>Categoria</dt>
            <dd>{form.categoria}</dd>
            <dt>Onde</dt>
            <dd>{form.local.trim() || 'Não informado'}</dd>
            <dt>Quando</dt>
            <dd>{form.quando.trim() || 'Não informado'}</dd>
            <dt>Relato</dt>
            <dd className="relato">{form.descricao.trim()}</dd>
            <dt>Risco imediato</dt>
            <dd>{form.riscoImediato ? 'Sim' : 'Não'}</dd>
          </dl>

          {dadosPessoais.length > 0 && (
            <p className="aviso aviso-forte">
              <IconeAlerta />
              <span>
                O texto ainda parece ter {dadosPessoais.join(', ')}. Confira antes de enviar.
              </span>
            </p>
          )}

          <p className="nota">
            Ao enviar, você recebe um protocolo e um código secreto. Não guardamos nenhum dado seu.
          </p>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}
          <div className="rodape-form">
            <button
              type="button"
              className="botao botao-secundario"
              onClick={() => setPasso(2)}
              disabled={enviando}
            >
              Corrigir
            </button>
            <button
              type="button"
              className="botao botao-primario"
              disabled={enviando}
              onClick={enviar}
            >
              {enviando ? 'Enviando…' : 'Enviar denúncia'}
            </button>
          </div>
        </section>
      )}
    </div>
    <PainelPrivacidade
      dadosPessoais={dadosPessoais}
      passo={passo}
      tamanho={form.descricao.length}
    />
    </div>
  );
}
