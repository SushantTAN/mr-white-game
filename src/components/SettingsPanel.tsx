import React, { useMemo } from "react";
import ChipToggleGroup from "./ChipToggleGroup";

type Props = {
  undercoverCount: number;
  includeMrWhite: boolean;
  totalPlayers: number;
  minPlayersNeeded: number;
  onChangeUndercover: (n: number) => void;
  onToggleMrWhite: (v: boolean) => void;
};

export default function SettingsPanel({
  undercoverCount,
  includeMrWhite,
  totalPlayers,
  minPlayersNeeded,
  onChangeUndercover,
  onToggleMrWhite
}: Props) {
  // build chip options: 1..maxUndercover, always leaving at least 1 civilian
  const maxUndercover = Math.max(1, totalPlayers - (includeMrWhite ? 2 : 1));
  const options = useMemo(() => {
    const arr = Array.from({ length: maxUndercover }, (_, i) => i + 1);
    // mark a recommended option based on player count
    const recommended = recommendUndercover(totalPlayers);
    return arr.map((n) => ({ value: n, recommended: n === Math.min(recommended, maxUndercover) }));
  }, [totalPlayers, maxUndercover]);

  return (
    <section>
      <h2>Game Roles</h2>

      <div className="card">
        <div className="row space" style={{ marginBottom: 10 }}>
          <div className="hint">
            Players: <strong>{totalPlayers}</strong> (min needed: <strong>{minPlayersNeeded}</strong>)
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={includeMrWhite}
              onChange={(e) => onToggleMrWhite(e.target.checked)}
            />
            <span className="toggle-track" />
            <span className="toggle-label">Mr. White</span>
          </label>
        </div>

        <div style={{ marginBottom: 6, fontWeight: 600 }}>Undercover Count</div>
        <ChipToggleGroup
          value={Math.min(undercoverCount || 1, maxUndercover)}
          options={options}
          onChange={onChangeUndercover}
          ariaLabel="Select number of Undercover players"
        />
        <div className="hint" style={{ marginTop: 8 }}>
          Tip: ★ is our recommendation for {totalPlayers || 0} players.
        </div>
      </div>
    </section>
  );
}

// simple recommendation curve
function recommendUndercover(n: number): number {
  if (n <= 5) return 1;
  if (n <= 8) return 2;
  if (n <= 12) return 3;
  return Math.max(3, Math.floor(n / 4));
}
