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

  const subtitle =
    state.winner === 'UNDERCOVER'
      ? `Alive: Bad = ${state.aliveBad}, Civilians = ${state.aliveCiv}`
      : `All Undercover & Mr. White eliminated! Civilians = ${state.aliveCiv}`;

  return (
    <div className="gameover-wrap fancy">
      <div className="confetti" aria-hidden />
      <div className="gameover-panel">
        <h2 className="gameover-title">{title}</h2>
        <div className="gameover-sub">{subtitle}</div>
        <div className="row gap" style={{ marginTop: 14 }}>
          <button onClick={onBackToSetup}>Back to Setup</button>
          <button className="primary" onClick={onNewRound}>New Round</button>
        </div>
      </div>
    </div>
  );
}
