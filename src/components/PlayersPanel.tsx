import type { Player } from "../types";

type Props = {
  players: Player[];
  onAdd: () => void;
  onUpdateName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export default function PlayersPanel({
  players,
  onAdd,
  onUpdateName,
  onRemove,
  onClear
}: Props) {
  return (
    <section>
      <h2>Players</h2>
      {players.map((p) => (
        <div key={p.id} className="row" style={{ marginBottom: "12px" }}>
          <input
            className="input"
            value={p.name}
            onChange={(e) => onUpdateName(p.id, e.target.value)}
            placeholder="Name"
            aria-label={`Player name ${p.name}`}
          />
          <button
            className="icon-btn danger"
            onClick={() => onRemove(p.id)}
            aria-label={`Remove ${p.name}`}
            title="Remove player"
            style={{ color: "white" }}
          >
            ✕
          </button>
        </div>
      ))}

      <div className="row gap" style={{ marginTop: 8 }}>
        <button className="primary" onClick={onAdd}>Add Player</button>
        {!!players.length && (
          <button className="ghost" onClick={onClear}>Clear All</button>
        )}
      </div>
    </section>
  );
}
