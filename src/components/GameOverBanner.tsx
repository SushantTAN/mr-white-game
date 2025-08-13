import React from "react";
import type { GameOverState } from "../types";

type Props = {
  state: GameOverState;
  onNewRound: () => void;
  onBackToSetup: () => void;
};

export default function GameOverBanner({ state, onNewRound, onBackToSetup }: Props) {
  if (!state.open) return null;

  const title =
    state.winner === "UNDERCOVER"
      ? "Game Over — Undercover Team Wins"
      : "Game Over — Civilians Win";

  const subtitle =
    state.winner === "UNDERCOVER"
      ? `Alive: Bad = ${state.aliveBad}, Civilians = ${state.aliveCiv}`
      : `All Undercover & Mr. White eliminated! Civilians = ${state.aliveCiv}`;

  return (
    <div
      // FULLSCREEN OVERLAY (inline styles trump CSS collisions)
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        // gradient + dim
        background:
          "radial-gradient(1000px 600px at 10% 10%, rgba(124,58,237,.25), transparent 40%)," +
          "radial-gradient(900px 520px at 90% 90%, rgba(6,182,212,.25), transparent 45%)," +
          "rgba(2,6,23,.78)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* optional shimmer layer */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.5,
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,.10) 0 20%, transparent 21%)," +
            "radial-gradient(circle at 80% 70%, rgba(255,255,255,.10) 0 18%, transparent 19%)," +
            "radial-gradient(circle at 60% 20%, rgba(255,255,255,.12) 0 12%, transparent 13%)," +
            "radial-gradient(circle at 35% 75%, rgba(255,255,255,.10) 0 16%, transparent 17%)",
            animation: "floaty 8s linear infinite",
        } as React.CSSProperties}
      />

      <div
        style={{
          position: "relative",
          width: "min(620px, 96vw)",
          borderRadius: 18,
          padding: "26px 22px",
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.94), rgba(248,250,252,.92))",
          border: "1px solid rgba(148,163,184,0.25)",
          boxShadow: "0 28px 80px rgba(2,12,27,.45)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "1.6rem", letterSpacing: ".2px" }}>
          {title}
        </h2>
        <div style={{ color: "#64748b", fontSize: "1rem" }}>{subtitle}</div>

        <div className="row gap" style={{ marginTop: 14, justifyContent: "center" }}>
          <button onClick={onBackToSetup}>Back to Setup</button>
          <button className="primary" onClick={onNewRound}>New Round</button>
        </div>
      </div>
    </div>
  );
}
