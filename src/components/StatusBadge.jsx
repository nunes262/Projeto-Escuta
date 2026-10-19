// src/components/StatusBadge.jsx
import { STATUS } from '../constantes';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS[status] ?? status}</span>;
}
