import type { RevealState, Role } from "../types";

/** The shape App sets each round after coin-flip */
type RoundWordSet =
  | { civilianWord: string; undercoverWord: string }
  | null;

type Props = {
  reveal: RevealState;
  currentSet: RoundWordSet;
  playerName: string;
  onClose: () => void;
};

function roleLabel(r?: Role) {
  return r === "MR_WHITE"
    ? "Mr White"
    : r === "UNDERCOVER"
    ? "Undercover"
    : "Civilian";
}

export default function RevealModal({
  reveal,
  currentSet,
  playerName,
  onClose,
}: Props) {
  if (!reveal.open) return null;

  // Decide what to show
  const isMrWhite = reveal.role === "MR_WHITE";
  const hideRole = !!reveal.hideRole;
  const hideWord = !!reveal.hideWord;

  // Compute the word safely
  let wordText: string | null = null;
  if (!hideWord && currentSet) {
    if (reveal.role === "UNDERCOVER") {
      wordText = currentSet.undercoverWord;
    } else {
      // CIVILIAN (or unknown fallback)
      wordText = currentSet.civilianWord;
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 40, // lower than the Game Over overlay
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        style={{
          width: "min(520px, 96vw)",
          padding: 20,
          borderRadius: 14,
          textAlign: "center",
        }}
      >
        <h3 style={{ margin: "0 0 8px" }}>
          {playerName ? `${playerName}, your card` : "Your card"}
        </h3>

        {/* ROLE (hidden for Civ/Undercover, shown for Mr White) */}
        {!hideRole && reveal.role && (
          <div
            style={{
              marginTop: 6,
              marginBottom: 10,
              fontWeight: 700,
              letterSpacing: ".2px",
            }}
          >
            You are <span className="badge">{roleLabel(reveal.role)}</span>
          </div>
        )}

        {/* WORD (hidden for Mr White) */}
        {!hideWord && (
          <div style={{ marginTop: 8 }}>
            <div className="hint" style={{ marginBottom: 6 }}>
              Your secret word:
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                letterSpacing: ".3px",
              }}
            >
              {wordText ?? "—"}
            </div>
          </div>
        )}

        {/* Mr White message (no word) */}
        {isMrWhite && (
          <div className="hint" style={{ marginTop: 8 }}>
            No word is shown to Mr White. Bluff smart 😉
          </div>
        )}

        <div className="row gap" style={{ marginTop: 16, justifyContent: "center" }}>
          <button className="primary" onClick={onClose}>
            Hide &amp; Pass
          </button>
        </div>
      </div>
    </div>
  );
}
