import type { Card } from "../types";

type Props = {
  deck: Card[];
  canPick: boolean;
  onPick: (index: number) => void;
};

export default function Deck({ deck, canPick, onPick }: Props) {
  return (
    <section>
      <h2>Deck</h2>
      <div className="deck">
        {deck.map((card, idx) => (
          <button
            key={card.id}
            className={`card-face ${card.picked ? 'picked' : ''}`}
            onClick={() => !card.picked && canPick && onPick(idx)}
            disabled={card.picked || !canPick}
            aria-label={card.picked ? 'Taken' : canPick ? 'Pick this card' : 'Wait your turn'}
            title={!canPick ? 'Wait your turn' : undefined}
          >
            {card.picked ? 'Taken' : 'Tap'}
          </button>
        ))}
      </div>
    </section>
  );
}
