import type { Player } from "../types";


type Props = {
  current: Player | null;
  remainingCards: number;
};

export default function TurnBanner({ current, remainingCards }: Props) {
  return (
    <section>
      <div className="turn-banner">
        <div>
          <div className="turn-title">Current Turn</div>
          <div className="turn-name">{current ? current.name : '—'}</div>
        </div>
        <div className="turn-remaining">
          Cards left: <strong>{remainingCards}</strong>
        </div>
      </div>
    </section>
  );
}
