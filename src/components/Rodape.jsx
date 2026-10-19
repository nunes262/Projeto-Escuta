// src/components/Rodape.jsx
import { Link } from 'react-router-dom';
import { INSTITUICAO } from '../config';
import { usePreferencias } from '../hooks/usePreferencias';
import { IconeLua, IconeSol } from './Icones';
import Marca from './Marca';

const TEMAS = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro', icone: <IconeSol width={14} height={14} /> },
  { valor: 'escuro', rotulo: 'Escuro', icone: <IconeLua width={14} height={14} /> },
];

export default function Rodape() {
  const { tema, setTema, discreto, setDiscreto } = usePreferencias();

  return (
    <footer className="rodape">
      <div className="rodape-interno">
        <div className="rodape-marca">
          <Marca subtitulo={INSTITUICAO} />
          <p>
            Ouvidoria digital. Não usa cookies de rastreamento, não guarda dados de quem denuncia e
            publica só números.
          </p>
          <a
            className="selo-ods"
            href="https://brasil.un.org/pt-br/sdgs/16"
            target="_blank"
            rel="noreferrer"
          >
            <span className="selo-numero">16</span>
            <span>
              Paz, Justiça e
              <br />
              Instituições Eficazes
            </span>
          </a>
        </div>

        <nav className="rodape-coluna" aria-label="Rodapé">
          <h2>O canal</h2>
          <Link to="/denunciar">Fazer denúncia</Link>
          <Link to="/acompanhar">Acompanhar com o código</Link>
          <Link to="/transparencia">Transparência</Link>
          <Link to="/como-funciona#privacidade">Privacidade</Link>
          <Link to="/ouvidoria/login">Acesso da ouvidoria</Link>
        </nav>

        <div className="rodape-coluna">
          <h2>Neste aparelho</h2>
          <fieldset className="seletor-tema">
            <legend>Aparência</legend>
            {TEMAS.map((t) => (
              <label key={t.valor} className={tema === t.valor ? 'ativo' : undefined}>
                <input
                  type="radio"
                  name="tema"
                  value={t.valor}
                  checked={tema === t.valor}
                  onChange={() => setTema(t.valor)}
                />
                {t.icone}
                {t.rotulo}
              </label>
            ))}
          </fieldset>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={discreto}
              onChange={(e) => setDiscreto(e.target.checked)}
            />
            <span className="interruptor-trilho" aria-hidden="true" />
            <span>
              <strong>Modo discreto</strong>
              <small>A aba mostra “Anotações” e um ícone neutro.</small>
            </span>
          </label>
          <p className="rodape-nota">
            Estas escolhas somem quando você fecha o navegador.
          </p>
        </div>
      </div>
      <div className="rodape-base">
        <span>Escuta · Trabalho A3 · ODS 16</span>
        <span>Saída rápida: aperte Esc duas vezes</span>
      </div>
    </footer>
  );
}
