# Escuta · Ouvidoria digital anônima

Site em React para denúncias anônimas em escolas e faculdades. Quem viu ou sofreu bullying,
assédio, discriminação ou uma irregularidade relata sem se identificar e acompanha a resposta
com um código secreto. A instituição presta contas num painel público.

**ODS 16 · Paz, Justiça e Instituições Eficazes** (metas 16.1, 16.6 e 16.10)
Trabalho A3 · Usabilidade, Desenvolvimento Web, Mobile e Jogos

Site publicado: _(colar o link do Firebase Hosting aqui)_

## Equipe

| Nome | RA | Papel |
| ---- | -- | ----- |
|      |    | Coordenação e GitHub |
|      |    | Front-end React |
|      |    | Front-end React |
|      |    | Firebase e segurança |
|      |    | UX e protótipo |
|      |    | Pesquisa e documentação |
|      |    | Pitch e apresentação |

## Tecnologias

React 19 + Vite · React Router · Firebase (Authentication, Cloud Firestore + Security Rules,
App Check com reCAPTCHA v3, Hosting) · Vitest + Firebase Emulator para testes.

## Rodar localmente sem conta no Firebase (emuladores)

Precisa de Node.js 20+ e **Java 21+** (os emuladores do Firebase rodam em Java).

```bash
npm install
cp .env.example .env.local      # e troque para VITE_USE_EMULATORS=true
npm run emuladores              # terminal 1: Firestore + Auth locais (painel em http://localhost:4000)
npm run seed                    # terminal 2: ~100 denúncias de exemplo realistas
npm run dev                     # terminal 2: site em http://localhost:5173
```

O `seed` mostra no final um **código de exemplo** para testar a tela Acompanhar e o login da
ouvidoria: `ouvidoria@escuta.dev` / `escuta123`.

> Para a demonstração "duas abas" do pitch com emuladores, abra a ouvidoria numa **janela
> anônima** (ou outro navegador). Com os emuladores (HTTP/1.1 local), duas abas do mesmo perfil
> disputam o limite de conexões do Chrome e uma delas fica "offline". No site publicado isso
> não acontece. E a janela anônima para o denunciante ainda reforça a mensagem de privacidade.

## Publicar com um projeto real

1. Em [console.firebase.google.com](https://console.firebase.google.com) crie o projeto e adicione
   um app **Web**. Copie as chaves para `.env.local` (`VITE_USE_EMULATORS=false`).
2. **Authentication** → ative E-mail/senha → crie o usuário da ouvidoria e copie o UID.
3. **Firestore Database** → crie o banco (**não** use o "modo de teste") e crie à mão o documento
   `ouvidores/{UID}` com `nome: "Ouvidoria"`. O contador de protocolos é criado sozinho no
   primeiro envio.
4. Publique as regras e o site:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add      # escolha o projeto
   npm run deploy                    # build + hosting + regras do Firestore
   ```
5. (Feedback 2) **App Check**: registre o reCAPTCHA v3, cole a chave em
   `VITE_RECAPTCHA_SITE_KEY`, publique e, depois de testar, ative a aplicação obrigatória
   (enforcement) para o Firestore no console.

Dados de exemplo no projeto real (opcional, apaga denúncias existentes):
`GOOGLE_APPLICATION_CREDENTIALS=chave.json node scripts/seed.mjs --real <projectId>`.

## Testes

```bash
npm test                # lógica pura: código secreto, detector de dados pessoais, estatísticas
npm run test:regras     # regras de segurança + fluxo completo no emulador (precisa de Java)
```

`test:regras` é a versão automática do "teste de anonimato" do roteiro: sem login, listar
denúncias dá `permission-denied`; com o código, a denúncia abre. São 35 testes, entre eles:
ninguém forja protocolo, inventa campos (IP, nome), muda status sem ser ouvidor, se passa pela
ouvidoria na conversa, reescreve o histórico ou prorroga o prazo duas vezes.

## Como o anonimato é garantido

- O navegador gera o código com `crypto.getRandomValues` (16 caracteres, ~79 bits, sem viés de
  módulo) e ele vira o **ID do documento**. Regras: `get` público, `list` só para ouvidores.
- Não existe coleção de denunciantes. A denúncia guarda uma **lista fechada de campos** (as regras
  recusam qualquer campo extra, como IP ou e-mail).
- O código passa entre telas pelo `state` do React Router e é **apagado do histórico** assim que a
  tela abre: recarregar ou voltar não o mostra de novo. Nunca vai para a URL nem para o
  `localStorage`.
- O Firestore usa cache só em memória (nada da denúncia fica gravado no navegador).
- Quem denuncia **não baixa** o código de login: a área da ouvidoria é carregada à parte.
- Fontes servidas pelo próprio site (sem Google Fonts), `Referrer-Policy: no-referrer`, sem
  analytics.

## Melhorias além da proposta original

| Melhoria | Por quê |
| -------- | ------- |
| Botão **Sair rápido** (ou Esc duas vezes) | Troca a página na hora se alguém se aproximar, padrão em sites de apoio a vítimas |
| **Detector de dados pessoais** no relato | Avisa se o texto tem e-mail, telefone, CPF, RA ou "meu nome é" |
| Regras endurecidas | Protocolo amarrado ao contador, campos e categorias validados, histórico só cresce, motivo obrigatório para concluir/arquivar, setor válido ao encaminhar |
| Prorrogação conforme a Lei 13.460/2017 | Uma vez, +30 dias, justificativa que o denunciante vê (garantido nas regras) |
| Aviso de **mensagem nova** para a ouvidoria | O denunciante só consegue ligar esse aviso, nada mais |
| Acompanhamento em **tempo real** | Status e conversa atualizam sem recarregar |
| Código oculto ao digitar | Evita leitura por cima do ombro |
| Categorias pequenas viram "Outro" no painel | Um número pequeno não aponta para uma pessoa (LGPD) |
| Estatísticas só são regravadas quando mudam | Evita escritas a cada atualização da fila |
| Sessão da ouvidoria por aba + saída após 30 min parada | Computadores compartilhados |
| Página **Como funciona** com FAQ e base legal | Confiança e transparência |
| Seção **O que mudou**, gerenciada pela ouvidoria | Fecha o ciclo da prestação de contas |
| Acessibilidade | Pular para o conteúdo, foco gerenciado entre passos, `aria-live`, tabela alternativa no gráfico, contraste, alvos de 44px, `prefers-reduced-motion` |
| Emuladores + `seed` | A equipe desenvolve e apresenta sem depender do projeto real |

## Estrutura

```
src/
  constantes.js            categorias, status, setores, prazos (iguais às regras)
  firebase.js              Firestore + App Check (+ emuladores)
  firebaseAuth.js          login da ouvidoria (carregado só na área restrita)
  utils/                   seguranca.js, datas.js, estatisticas.js, dadosPessoais.js
  services/                denuncias.js, transparencia.js (todo acesso ao Firestore)
  hooks/                   useOuvidor, useEstatisticas, useTitulo
  components/              Cabecalho, FaixaEmergencia, SaidaRapida, LinhaDoTempo, Conversa…
  pages/                   Inicio, ComoFunciona, NovaDenuncia, DenunciaEnviada, Acompanhar,
                           Transparencia, ouvidoria/ (Login, Painel, Detalhe, Mudanças)
firestore.rules            regras de segurança (a parte mais importante)
scripts/seed.mjs           dados de exemplo
tests/                     unidade/ e regras/
```

| Rota | Página | Acesso |
| ---- | ------ | ------ |
| `/` | Início | Público |
| `/como-funciona` | Como funciona | Público |
| `/denunciar` | Nova denúncia | Público, anônimo |
| `/denuncia/enviada` | Comprovante | Quem acabou de enviar |
| `/acompanhar` | Acompanhar | Quem tem o código |
| `/transparencia` | Transparência | Público |
| `/ouvidoria/login` | Login | Equipe |
| `/ouvidoria` | Fila de denúncias | Só ouvidores |
| `/ouvidoria/denuncias/:protocolo` | Detalhe da denúncia | Só ouvidores |
| `/ouvidoria/mudancas` | O que mudou | Só ouvidores |

_Escuta e Faculdade Exemplo são nomes provisórios._
