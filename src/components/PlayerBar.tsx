import React from 'react';

type Props = {
  playerName: string;
  setPlayerName: (v: string) => void;
  knownNames: string[];
  remainingCards: number;
};

export default function PlayerBar({
  playerName,
  setPlayerName,
  knownNames,
  remainingCards
}: Props) {
  const chips = knownNames.slice(-8).reverse();

  return (
    <section>
      <h2>Pick a Card</h2>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter your name before you tap a card"
      />

      {chips.length > 0 && (
        <div className="row gap" style={{ flexWrap: 'wrap', marginTop: 6 }}>
          {chips.map((n) => (
            <button key={n} onClick={() => setPlayerName(n)} title="Use saved name">
              {n}
            </button>
          ))}
        </div>
      )}

      <div className="hint" style={{ marginTop: 8 }}>
        Remaining cards: <strong>{remainingCards}</strong>
      </div>
    </section>
  );
}
