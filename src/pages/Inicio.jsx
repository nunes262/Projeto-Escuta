// src/pages/Inicio.jsx
// Tela 1: passar confiança em poucos segundos e levar ao formulário.
// Lê só estatisticas/publico. Nenhuma denúncia é lida aqui.
import { Link } from 'react-router-dom';
import { IconeSeta } from '../components/Icones';
import OndaSonora from '../components/OndaSonora';
import ResumoNumeros from '../components/ResumoNumeros';
import Ticket from '../components/Ticket';
import { INSTITUICAO } from '../config';
import { useEstatisticas } from '../hooks/useEstatisticas';
import { useTitulo } from '../hooks/useTitulo';
import { formatarData } from '../utils/datas';

const PASSOS = [
  {
    titulo: 'Você conta',
    texto: 'Sem login e sem nome. Escolhe a categoria e descreve o que aconteceu, onde e quando.',
  },
  {
    titulo: 'Recebe um código',
    texto: 'Um protocolo e um código secreto de 16 caracteres, gerado no seu próprio navegador.',
  },
  {
    titulo: 'A ouvidoria responde',
    texto: 'Em até 30 dias, com status visível e uma conversa anônima se precisar de detalhes.',
  },
  {
    titulo: 'Todos veem o resultado',
    texto: 'O painel público mostra quantas chegaram, quantas foram resolvidas e o que mudou.',
  },
];

// Quem enxerga cada parte de uma denúncia
const VISIBILIDADE = [
  { item: 'O que você escreveu', voce: true, ouvidoria: true, publico: false },
  { item: 'A conversa anônima', voce: true, ouvidoria: true, publico: false },
  { item: 'Status e prazo', voce: true, ouvidoria: true, publico: false },
  { item: 'Totais por mês e categoria', voce: true, ouvidoria: true, publico: true },
  { item: 'Seu nome, e-mail ou IP', voce: null, ouvidoria: null, publico: null },
];

function Celula({ valor }) {
  if (valor === null) return <td className="vis-nunca">não existe</td>;
  return (
    <td className={valor ? 'vis-sim' : 'vis-nao'}>
      <span aria-hidden="true">{valor ? '●' : '○'}</span>
      <span className="visualmente-oculto">{valor ? 'vê' : 'não vê'}</span>
    </td>
  );
}

export default function Inicio() {
  useTitulo(null);
  const { dados, carregando } = useEstatisticas();

  return (
    <>
      <section className="hero-faixa">
        <div className="largura hero">
          <div className="hero-texto">
            <p className="sobretitulo">Ouvidoria da {INSTITUICAO}</p>
            <h1>
              Viu ou sofreu algo errado? Conte com <em>segurança</em>.
            </h1>
            <p className="lead">
              Você não precisa se identificar. Recebe um código secreto para acompanhar a resposta,
              e a instituição presta contas, em público, do que fez com cada relato.
            </p>
            <div className="acoes">
              <Link to="/denunciar" className="botao botao-primario botao-grande">
                Fazer uma denúncia <IconeSeta />
              </Link>
              <Link to="/acompanhar" className="botao botao-secundario botao-grande">
                Já tenho um código
              </Link>
            </div>
            <ul className="selos" aria-label="Garantias">
              <li>sem login</li>
              <li>sem nome</li>
              <li>sem IP</li>
              <li>resposta em 30 dias</li>
            </ul>
          </div>

          <div className="hero-visual">
            <Ticket
              exemplo
              animar
              protocolo="ESC-2026-0213"
              codigo="7Q4MK2XD9PRAH3WT"
              recebidaEm={new Date(2026, 9, 11, 19, 12)}
              prazo={new Date(2026, 10, 10)}
              categoria="Bullying"
            />
            <OndaSonora className="hero-onda" />
          </div>
        </div>
      </section>

      <section className="largura secao" aria-labelledby="titulo-numeros">
        <div className="secao-cabeca">
          <div>
            <p className="sobretitulo">Prestação de contas</p>
            <h2 id="titulo-numeros">Os números deste ano</h2>
          </div>
          <p className="secao-meta">
            {dados?.atualizadoEm ? `Atualizado em ${formatarData(dados.atualizadoEm)}. ` : ''}
            <Link to="/transparencia" className="link-seta">
              Painel completo <IconeSeta width={14} height={14} />
            </Link>
          </p>
        </div>
        <ResumoNumeros dados={dados} carregando={carregando} />
      </section>

      <section className="largura secao" aria-labelledby="titulo-passos">
        <div className="secao-cabeca">
          <div>
            <p className="sobretitulo">Como funciona</p>
            <h2 id="titulo-passos">Do relato à resposta, em quatro passos</h2>
          </div>
        </div>
        <ol className="trilha">
          {PASSOS.map((p, i) => (
            <li key={p.titulo}>
              <span className="trilha-numero">{String(i + 1).padStart(2, '0')}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="faixa-tinta" aria-labelledby="titulo-quem-ve">
        <div className="largura quem-ve">
          <div className="quem-ve-texto">
            <p className="sobretitulo">Privacidade</p>
            <h2 id="titulo-quem-ve">
              Quem vê o quê. O anonimato vem do projeto, <em>não de uma promessa</em>.
            </h2>
            <p>
              As regras rodam no servidor e valem mesmo que alguém mexa no site. Sem o código,
              ninguém de fora encontra uma denúncia. Não existe cadastro de denunciantes para ser
              vazado.
            </p>
            <Link to="/como-funciona#privacidade" className="link-seta">
              Como isso é garantido <IconeSeta width={14} height={14} />
            </Link>
          </div>
          <div className="tabela-quem-ve-moldura">
            <table className="tabela-quem-ve">
              <caption className="visualmente-oculto">Quem vê cada parte de uma denúncia</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visualmente-oculto">Informação</span>
                  </th>
                  <th scope="col">
                    Você<small>com o código</small>
                  </th>
                  <th scope="col">
                    Ouvidoria<small>com login</small>
                  </th>
                  <th scope="col">
                    Público<small>qualquer pessoa</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {VISIBILIDADE.map((linha) => (
                  <tr key={linha.item}>
                    <th scope="row">{linha.item}</th>
                    {linha.voce === null ? (
                      <td colSpan={3} className="vis-nunca">
                        ninguém: a Escuta não pede nem guarda
                      </td>
                    ) : (
                      <>
                        <Celula valor={linha.voce} />
                        <Celula valor={linha.ouvidoria} />
                        <Celula valor={linha.publico} />
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="largura secao citacao">
        <blockquote>
          <p>Denúncia sem retorno não gera confiança.</p>
          <footer>Por isso cada relato tem prazo, resposta escrita e entra no painel público.</footer>
        </blockquote>
        <Link to="/denunciar" className="botao botao-primario botao-grande">
          Fazer uma denúncia <IconeSeta />
        </Link>
      </section>
    </>
  );
}
