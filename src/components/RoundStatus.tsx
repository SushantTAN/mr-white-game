import type { Player } from "../types";

type Props = {
  players: Player[];
  currentPlayerId: string | null;
  onToggleElimination: (id: string) => void;
};

export default function RoundStatus({ players, currentPlayerId, onToggleElimination }: Props) {
  return (
    <section>
      <h2>Round Status</h2>
      <div className="status-list">
        {players.map((p) => (
          <div key={p.id} className="status-item">
            <div className="status-left">
              <div className="status-name">
                {p.name} {currentPlayerId === p.id && <span className="badge">Turn</span>}
              </div>
              <div className="status-sub">
                {p.eliminated ? 'Eliminated' : p.picked ? 'Picked' : 'Waiting'}
              </div>
            </div>
            <div className="status-actions">
              <button onClick={() => onToggleElimination(p.id)}>
                {p.eliminated ? 'Restore' : 'Eliminate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
