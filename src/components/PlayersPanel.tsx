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
        <div key={p.id} className="row">
          <input
            value={p.name}
            onChange={(e) => onUpdateName(p.id, e.target.value)}
            placeholder="Name"
          />
          <button onClick={() => onRemove(p.id)}>❌</button>
        </div>
      ))}
      <div className="row gap">
        <button onClick={onAdd}>Add Player</button>
        {!!players.length && <button onClick={onClear}>Clear</button>}
      </div>
    </section>
  );
}
