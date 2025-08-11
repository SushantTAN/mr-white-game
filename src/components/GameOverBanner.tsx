import type { GameOverState } from "../types";


type Props = {
  state: GameOverState;
  onNewRound: () => void;
  onBackToSetup: () => void;
};

export default function GameOverBanner({ state, onNewRound, onBackToSetup }: Props) {
  if (!state.open) return null;

  const title =
    state.winner === 'UNDERCOVER'
      ? 'Game Over — Undercover Team Wins'
      : 'Game Over — Civilians Win';

  return (
    <div className="gameover-wrap">
      <div className="gameover-banner">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div style={{ marginBottom: 12 }}>
          Alive: Bad = <strong>{state.aliveBad}</strong>, Civilians = <strong>{state.aliveCiv}</strong>
        </div>
        <div className="row gap">
          <button onClick={onBackToSetup}>Back to Setup</button>
          <button className="primary" onClick={onNewRound}>New Round</button>
        </div>
      </div>
    </div>
  );
}
