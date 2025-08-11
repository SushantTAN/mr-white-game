type Props = {
  undercoverCount: number;
  includeMrWhite: boolean;
  minPlayersNeeded: number;
  totalPlayers: number;
  onChange: (patch: Partial<Pick<Props, 'undercoverCount' | 'includeMrWhite'>>) => void;
};

export default function SettingsPanel({
  undercoverCount,
  includeMrWhite,
  minPlayersNeeded,
  totalPlayers,
  onChange
}: Props) {
  return (
    <section>
      <h2>Game Roles</h2>
      <div className="hint" style={{ marginBottom: 8 }}>
        Players added: <strong>{totalPlayers}</strong> (min needed: <strong>{minPlayersNeeded}</strong>)
      </div>
      <label className="row">
        <span>Undercover Count</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, totalPlayers - 1)}
          value={undercoverCount}
          onChange={(e) => onChange({ undercoverCount: Number(e.target.value) })}
        />
      </label>
      <label className="row">
        <span>Include Mr. White</span>
        <input
          type="checkbox"
          checked={includeMrWhite}
          onChange={(e) => onChange({ includeMrWhite: e.target.checked })}
        />
      </label>
    </section>
  );
}
