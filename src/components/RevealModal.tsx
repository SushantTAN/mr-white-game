import type { RevealState, Role, WordSet } from "../types";

type Props = {
  reveal: RevealState;
  currentSet: WordSet | null;
  playerName: string;
  onClose: () => void;
};

const roleLabel = (r?: Role) =>
  r === 'CIVILIAN' ? 'Civilian' :
    r === 'UNDERCOVER' ? 'Undercover' :
      r === 'MR_WHITE' ? 'Mr. White' : '';

export default function RevealModal({ reveal, currentSet, playerName, onClose }: Props) {
  if (!reveal.open) return null;

  const shouldHideWord = !!reveal.hideWord;
  const shouldHideRole = !!reveal.hideRole;

  const word = (() => {
    if (shouldHideWord || !currentSet || !reveal.role) return '';
    if (reveal.role === 'CIVILIAN') return `Word: ${currentSet.civilianWord}`;
    if (reveal.role === 'UNDERCOVER') return `Word: ${currentSet.undercoverWord}`;
    return 'Mr. White: No word';
  })();

   if (!reveal.open) return null;

  return (
    <div
       style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 40, // 👈 ensure modal < game over overlay
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(520px, 96vw)',
          background: '#ffffff',
          padding: 20,
          borderRadius: 12
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>{playerName}</h2>

        {!shouldHideRole && (
          <div style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            <strong>Role: {roleLabel(reveal.role)}</strong>
          </div>
        )}

        {!shouldHideWord && (
          <div className="word" style={{ fontSize: '1.15rem' }}>
            {word}
          </div>
        )}

        {shouldHideRole && shouldHideWord && (
          <div className="word" style={{ fontSize: '1.05rem', color: '#334155' }}>
            (No word shown)
          </div>
        )}

        <div className="row gap" style={{ marginTop: 16 }}>
          <button className="primary" onClick={onClose}>
            Hide &amp; Pass
          </button>
        </div>
      </div>
    </div>
  );
}
