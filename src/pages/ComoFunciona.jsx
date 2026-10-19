// src/pages/ComoFunciona.jsx
// Explica o canal, o ciclo de vida da denúncia e como o anonimato funciona.
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { PRAZO_DIAS } from '../constantes';
import { useTitulo } from '../hooks/useTitulo';

const NAO_GUARDA = [
  'Nome, e-mail ou telefone de quem denuncia',
  'Login ou conta do denunciante',
  'Endereço IP ou localização do aparelho dentro da denúncia',
  'O código secreto em lugar nenhum além da própria denúncia',
  'Rascunhos: o que você digita só sai do navegador quando você envia',
];

const PERGUNTAS = [
  {
    pergunta: 'A ouvidoria consegue descobrir quem eu sou?',
    resposta:
      'Pelo site, não: não existe cadastro de denunciantes, e a denúncia não guarda nenhum dado do aparelho. O que pode identificar alguém é o próprio texto. Por isso, evite escrever seu nome, sua matrícula ou detalhes que só você saberia.',
  },
  {
    pergunta: 'E se eu perder o código?',
    resposta:
      'Ele é a única forma de acompanhar a denúncia, e a ouvidoria não tem como recuperá-lo, justamente para proteger seu anonimato. Se perder, você pode fazer uma nova denúncia contando que é sobre o mesmo caso.',
  },
  {
    pergunta: 'Quanto tempo a ouvidoria tem para responder?',
    resposta: `Até ${PRAZO_DIAS} dias. Em casos complexos, o prazo pode ser prorrogado uma única vez, por mais ${PRAZO_DIAS} dias, sempre com uma justificativa que você vê ao acompanhar (referência: Lei nº 13.460/2017).`,
  },
  {
    pergunta: 'Estou num computador compartilhado. O que faço?',
    resposta:
      'Use uma janela anônima ou privada do navegador e feche-a ao terminar. Não salve o código no navegador. O botão "Sair rápido" (ou Esc duas vezes) troca a página na hora se alguém se aproximar.',
  },
  {
    pergunta: 'Posso anexar fotos ou prints?',
    resposta:
      'Ainda não. Fotos carregam metadados, como a localização de onde foram tiradas, que podem identificar você. Descreva o que viu; se a ouvidoria precisar de provas, ela orienta pela conversa anônima.',
  },
  {
    pergunta: 'O que aparece no painel público?',
    resposta:
      'Só números: quantas denúncias chegaram, por categoria e por mês, quantas foram respondidas no prazo e o que mudou na instituição. Categorias com poucos casos são somadas em "Outro" para que nenhum número aponte para uma pessoa.',
  },
];

export default function ComoFunciona() {
  useTitulo('Como funciona');

  return (
    <article className="largura pagina-texto">
      <p className="sobretitulo">Como funciona</p>
      <h1>Denunciar sem medo e acompanhar até o fim</h1>
      <p className="lead">
        A Escuta é a ouvidoria digital da instituição. Ela não investiga nem pune ninguém: garante
        que o relato chegue a quem deve agir, com prazo e sem expor quem denunciou.
      </p>

      <h2>O caminho de uma denúncia</h2>
      <ol className="ciclo">
        <li>
          <StatusBadge status="recebida" /> a ouvidoria lê e classifica
        </li>
        <li>
          <StatusBadge status="em_analise" /> pode fazer perguntas pela conversa anônima
        </li>
        <li>
          <StatusBadge status="encaminhada" /> vai ao setor que pode agir, sem revelar quem
          denunciou
        </li>
        <li>
          <StatusBadge status="concluida" /> você recebe a resposta final por escrito
        </li>
      </ol>
      <p>
        Sem informação suficiente ou fora do escopo, a denúncia é <StatusBadge status="arquivada" />{' '}
        sempre com o motivo escrito, que você vê.
      </p>

      <h2 id="privacidade">O anonimato vem do projeto, não de uma promessa</h2>
      <div className="duas-colunas">
        <div className="caixa">
          <h3>O que a Escuta não pede nem guarda</h3>
          <ul className="lista-x">
            {NAO_GUARDA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="caixa">
          <h3>Como o anonimato funciona</h3>
          <ol>
            <li>
              Seu navegador gera um código aleatório de 16 caracteres com criptografia segura
              (cerca de 79 bits: adivinhar é inviável).
            </li>
            <li>Esse código vira o identificador da denúncia no banco de dados.</li>
            <li>
              As regras do servidor deixam qualquer pessoa abrir <em>uma</em> denúncia pelo código,
              mas só a ouvidoria, com login, pode listar todas.
            </li>
            <li>Sem o código, ninguém de fora encontra a sua denúncia.</li>
          </ol>
        </div>
      </div>

      <h2>Perguntas frequentes</h2>
      <div className="perguntas">
        {PERGUNTAS.map((p) => (
          <details key={p.pergunta}>
            <summary>{p.pergunta}</summary>
            <p>{p.resposta}</p>
          </details>
        ))}
      </div>

      <h2>Base legal</h2>
      <ul>
        <li>Lei nº 13.185/2015: Programa de Combate à Intimidação Sistemática (Bullying).</li>
        <li>Lei nº 14.811/2024: tornou o bullying e o cyberbullying crimes (art. 146-A do Código Penal).</li>
        <li>Lei nº 13.460/2017: prazos e direitos do usuário de ouvidorias.</li>
        <li>Lei nº 13.709/2018 (LGPD): acesso restrito aos dados de terceiros citados nos relatos.</li>
        <li>Lei nº 12.527/2011 (Lei de Acesso à Informação): transparência ativa.</li>
      </ul>

      <div className="acoes">
        <Link to="/denunciar" className="botao botao-primario">
          Fazer uma denúncia
        </Link>
        <Link to="/transparencia" className="botao botao-secundario">
          Ver a transparência
        </Link>
      </div>
    </article>
  );
}
