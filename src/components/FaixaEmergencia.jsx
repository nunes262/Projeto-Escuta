// src/components/FaixaEmergencia.jsx
// Sempre visível: este canal não substitui os serviços de emergência.
// "topo": faixa fina no alto de todas as páginas. "destaque": caixa de alerta.
import { EMERGENCIA } from '../constantes';
import { IconeTelefone } from './Icones';

export default function FaixaEmergencia({ destaque = false }) {
  if (destaque) {
    return (
      <aside className="alerta-emergencia" aria-label="Telefones de emergência">
        <p>
          <strong>Se alguém corre perigo agora, ligue.</strong> A Escuta não é um canal de
          emergência e ninguém lê as denúncias em tempo real.
        </p>
        <ul>
          {EMERGENCIA.map((e) => (
            <li key={e.numero}>
              <a href={`tel:${e.numero}`}>
                <span className="alerta-numero">{e.numero}</span>
                <span>{e.nome}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  return (
    <aside className="faixa-emergencia" aria-label="Telefones de emergência">
      <div className="faixa-interna">
        <span className="faixa-titulo">
          <IconeTelefone width={14} height={14} /> Em perigo agora? Este canal não é de emergência.
        </span>
        <ul>
          {EMERGENCIA.map((e) => (
            <li key={e.numero}>
              <a href={`tel:${e.numero}`}>{e.numero}</a> {e.nome}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
