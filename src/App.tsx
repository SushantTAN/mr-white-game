import { useEffect, useMemo, useState } from "react";
import { load, save } from "./utils/storage";

import SettingsPanel from "./components/SettingsPanel";
import WordEditor from "./components/WordEditor";
import PlayersPanel from "./components/PlayersPanel";
import TurnBanner from "./components/TurnBanner";
import Deck from "./components/Deck";
import RevealModal from "./components/RevealModal";
import RoundStatus from "./components/RoundStatus";
import GameOverBanner from "./components/GameOverBanner";
import type {
  Card,
  GameOverState,
  Player,
  RevealState,
  Role
} from "./types";
import DEFAULT_WORDS from "./data/defaultWords.json";

/** New raw words type that matches your JSON file */
type RawWordSet = { word1: string; word2: string };

/** The per-round resolved pair we pass to the UI/modals */
type RoundWordSet = { civilianWord: string; undercoverWord: string };

const STORAGE_KEYS = {
  words: "uc_words",
  players: "uc_players_v2",
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Small helper to speak a line out loud (on supported browsers). */
function speak(text: string) {
  try {
    const synth = (window as any).speechSynthesis as
      | SpeechSynthesis
      | undefined;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = navigator.language || "en-US";
    // Optional: pick first matching voice for the language if available
    const voices = synth.getVoices?.() || [];
    const match = voices.find((v) =>
      v.lang?.toLowerCase().startsWith((utter.lang || "en-US").toLowerCase())
    );
    if (match) utter.voice = match;
    // Clear any queued utterances so this announcement plays immediately
    try {
      synth.cancel();
    } catch {}
    synth.speak(utter);
  } catch {
    // fail silently if speech is blocked/unavailable
  }
}

function roleLabel(r?: Role) {
  return r === "MR_WHITE"
    ? "Mr White"
    : r === "UNDERCOVER"
    ? "Undercover"
    : "Civilian";
}

const clickAudio = new Audio("/sounds/click.mp3"); // Path to file in public/
const winnerAudio = new Audio("/sounds/won.mp3"); // Path to file in public/

function playSound(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0; // Reset to start
  audio.play().catch((err) => {
    console.error("Error playing sound:", err);
  });
}

function recommendUndercover(n: number): number {
  if (n <= 5) return 1;
  if (n <= 8) return 2;
  if (n <= 12) return 3;
  return Math.max(3, Math.floor(n / 4));
}

export default function App() {
  // words (RAW: {word1, word2})
  const [words, setWords] = useState<RawWordSet[]>(() =>
    load<RawWordSet[]>(STORAGE_KEYS.words, DEFAULT_WORDS as RawWordSet[])
  );
  const [wordsInput, setWordsInput] = useState(JSON.stringify(words, null, 2));
  const [wordsError, setWordsError] = useState("");

  // players (persisted)
  const [players, setPlayers] = useState<Player[]>(() =>
    load<Player[]>(STORAGE_KEYS.players, [])
  );

  // settings
  const [undercoverCount, setUndercoverCount] = useState<number>(1);
  const [includeMrWhite, setIncludeMrWhite] = useState<boolean>(false);

  // runtime
  const [tab, setTab] = useState<"setup" | "play">("setup");
  const [currentSet, setCurrentSet] = useState<RoundWordSet | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [reveal, setReveal] = useState<RevealState>({ open: false });
  const [gameOver, setGameOver] = useState<GameOverState>({
    open: false,
    winner: "UNDERCOVER",
    aliveBad: 0,
    aliveCiv: 0,
  });

  // persist words/players
  useEffect(() => {
    save(STORAGE_KEYS.words, words);
    setWordsInput(JSON.stringify(words, null, 2));
  }, [words]);
  useEffect(() => save(STORAGE_KEYS.players, players), [players]);

  useEffect(() => {
    // clamp undercoverCount to valid range when players or MrWhite changes
    const maxUndercover = Math.max(
      1,
      players.length - (includeMrWhite ? 2 : 1)
    );
    if (undercoverCount > maxUndercover) {
      setUndercoverCount(maxUndercover);
    }
    if (undercoverCount < 1 && maxUndercover >= 1) {
      setUndercoverCount(1);
    }
  }, [players.length, includeMrWhite]); // eslint-disable-line

  useEffect(() => {
    // auto-pick a recommended number if current is empty/invalid during setup
    const maxUndercover = Math.max(
      1,
      players.length - (includeMrWhite ? 2 : 1)
    );
    if (
      tab === "setup" &&
      (undercoverCount < 1 || undercoverCount > maxUndercover)
    ) {
      const rec = recommendUndercover(players.length);
      setUndercoverCount(Math.min(Math.max(1, rec), maxUndercover));
    }
  }, [players.length, includeMrWhite, tab]); // eslint-disable-line

  // computed
  const totalPlayers = players.length;
  const minPlayersNeeded = useMemo(
    () => Math.max(undercoverCount + (includeMrWhite ? 1 : 0) + 1, 2),
    [undercoverCount, includeMrWhite]
  );
  const setupValid = useMemo(() => {
    if (totalPlayers < minPlayersNeeded) return false;
    if (undercoverCount >= totalPlayers) return false;
    if (words.length === 0) return false;
    if (!players.every((p) => p.name.trim().length > 0)) return false;
    return true;
  }, [totalPlayers, minPlayersNeeded, undercoverCount, words.length, players]);

  const remainingCards = useMemo(
    () => deck.filter((c) => !c.picked).length,
    [deck]
  );

  const currentPlayer: Player | null =
    tab === "play" && players.length > 0 ? players[turnIndex] ?? null : null;

  // words actions (accepts new shape [{word1, word2}])
  const onSaveWords = () => {
    setWordsError("");
    try {
      const parsed = JSON.parse(wordsInput) as RawWordSet[];
      const ok =
        Array.isArray(parsed) &&
        parsed.every(
          (w) => typeof w?.word1 === "string" && typeof w?.word2 === "string"
        );
      if (!ok)
        throw new Error('Must be [{"word1":"...","word2":"..."}, ...].');
      setWords(parsed);
    } catch (e) {
      setWordsError((e as Error).message || "Invalid JSON");
    }
  };
  const onLoadDefaults = () => {
    setWords(DEFAULT_WORDS as RawWordSet[]);
    setWordsError("");
  };

  // players panel actions
  const addPlayer = () => {
    const n = players.length + 1;
    setPlayers([
      ...players,
      {
        id: crypto.randomUUID(),
        name: `Player ${n}`,
        eliminated: false,
        picked: false,
      },
    ]);
  };
  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));
  };
  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };
  const clearPlayers = () => setPlayers([]);

  // build deck & start
  const buildDeckAndStart = () => {
    if (!setupValid) return;

    // pick a raw set and randomly assign which word is civ/undercover
    const raw = words[(Math.random() * words.length) | 0];
    const flip = Math.random() < 0.5;
    const resolved: RoundWordSet = flip
      ? { civilianWord: raw.word1, undercoverWord: raw.word2 }
      : { civilianWord: raw.word2, undercoverWord: raw.word1 };
    setCurrentSet(resolved);

    randomizePlayers();
    const roles: Role[] = [
      ...Array(undercoverCount).fill("UNDERCOVER"),
      ...(includeMrWhite ? ["MR_WHITE"] : []),
    ];
    const civs = players.length - roles.length;
    if (civs < 1) {
      alert("Need at least 1 Civilian.");
      return;
    }
    roles.push(...Array(civs).fill("CIVILIAN"));

    const shuffledRoles = shuffle(roles);
    const newDeck: Card[] = shuffledRoles.map((r) => ({
      id: crypto.randomUUID(),
      role: r,
      picked: false,
    }));
    setDeck(newDeck);

    setPlayers((prev) =>
      prev.map((p) => ({ ...p, picked: false, eliminated: false }))
    );
    setTurnIndex(nextEligibleIndex(players, 0));
    setReveal({ open: false });
    setGameOver((g) => ({ ...g, open: false }));
    setTab("play");
  };

  // helper: find next player index who is not eliminated and not picked
  function nextEligibleIndex(arr: Player[], start: number): number {
    if (arr.length === 0) return 0;
    for (let step = 0; step < arr.length; step++) {
      const i = (start + step) % arr.length;
      const p = arr[i];
      if (!p.eliminated && !p.picked) return i;
    }
    return start;
  }

  // compute alive counts from deck + players
  function computeAliveCounts(deckNow: Card[], playersNow: Player[]) {
    let aliveBad = 0;
    let aliveCiv = 0;
    const isAlive = (holderId?: string) => {
      if (!holderId) return true; // unpicked card == still in the running
      const pl = playersNow.find((p) => p.id === holderId);
      return !!pl && !pl.eliminated;
    };

    for (const card of deckNow) {
      if (!isAlive(card.holderId)) continue;
      if (card.role === "UNDERCOVER" || card.role === "MR_WHITE") aliveBad++;
      else aliveCiv++;
    }
    return { aliveBad, aliveCiv };
  }

  // check end condition and open banner if triggered
  function maybeEndGame(deckNow: Card[], playersNow: Player[]) {
    const { aliveBad, aliveCiv } = computeAliveCounts(deckNow, playersNow);

    // Civilians win when all bad guys are gone
    if (aliveBad === 0) {
      // ensure modal isn't covering the banner
      setReveal({ open: false });
      setGameOver({ open: true, winner: 'CIVILIANS', aliveBad, aliveCiv });
      playSound(winnerAudio);
      speak('Civilians win');
      return true;
    }

    // Undercover side wins when bad >= civs
    if (aliveBad >= aliveCiv) {
      setReveal({ open: false });
      setGameOver({ open: true, winner: 'UNDERCOVER', aliveBad, aliveCiv });
      playSound(winnerAudio);
      speak('Undercover team wins');
      return true;
    }

    return false;
  }

  // card pick handler (by current player only)
  const onPickCard = (index: number) => {
    if (gameOver.open) return;
    if (!currentPlayer) return;
    if (currentPlayer.eliminated || currentPlayer.picked) return;

    const card = deck[index];
    if (!card || card.picked) return;

    playSound(clickAudio);

    const nextDeck = deck.slice();
    nextDeck[index] = { ...card, picked: true, holderId: currentPlayer.id };
    setDeck(nextDeck);

    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, picked: true } : p
    );
    setPlayers(updatedPlayers);

    // Show modal for everyone; hide role for Civ/Undercover, hide word for Mr. White
    if (card.role === "MR_WHITE") {
      setReveal({
        open: true,
        playerId: currentPlayer.id,
        role: card.role,
        hideWord: true,
        hideRole: false,
      });
    } else {
      setReveal({
        open: true,
        playerId: currentPlayer.id,
        role: card.role,
        hideWord: false,
        hideRole: true,
      });
    }
  };

  const randomizePlayers = () =>{
    const order = new Set<number>();
    const tempPlayers: Player[] = [];
    const max = totalPlayers - 1;
    const min = 0;

    for(let i = 0; i < totalPlayers; ++i){
      let ind = Math.floor(Math.random() * (max - min + 1) + min);
      while (order.has(ind)){
        ind = Math.floor(Math.random() * (max - min + 1) + min);
      }
      order.add(ind);
      tempPlayers.push(players[ind]);
    }
    setPlayers(tempPlayers);
  }

  // after hiding, move to next eligible player
  const onHideAndPass = () => {
    setReveal({ open: false });
    const nextIdx = nextEligibleIndex(
      players,
      (turnIndex + 1) % players.length
    );
    setTurnIndex(nextIdx);
  };

  // eliminate/restore (elimination reveals ROLE ONLY, speaks it, and checks win)
  const toggleElimination = (id: string) => {
    if (gameOver.open) return;

    const target = players.find((p) => p.id === id);
    if (!target) return;

    if (!target.eliminated) {
      let roleToReveal: Role | undefined;
      const deckNext = deck.slice();
      let playersNext = players.slice();

      if (!target.picked) {
        const avail = deckNext
          .map((c, i) => ({ c, i }))
          .filter((x) => !x.c.picked);
        if (avail.length === 0) return;
        const choice = avail[(Math.random() * avail.length) | 0];
        const card = choice.c;
        deckNext[choice.i] = { ...card, picked: true, holderId: target.id };
        roleToReveal = card.role;
        playersNext = playersNext.map((p) =>
          p.id === target.id ? { ...p, picked: true } : p
        );
      } else {
        const held = deckNext.find((c) => c.holderId === target.id);
        roleToReveal = held?.role;
      }

      playersNext = playersNext.map((p) =>
        p.id === id ? { ...p, eliminated: true } : p
      );
      setPlayers(playersNext);
      setDeck(deckNext);

      // Elimination reveal: role ONLY (no word) + SPEAK it
      if (roleToReveal) {
        const eliminatedName =
          playersNext.find((p) => p.id === id)?.name ?? "Player";
        const line = `${eliminatedName} is ${roleLabel(roleToReveal)}`;
        // show modal
        setReveal({
          open: true,
          playerId: id,
          role: roleToReveal,
          hideWord: true,
          hideRole: false,
        });
        // speak it
        speak(line);
      }

      // advance turn if we eliminated the current player
      const current = players.find((p) => p.id === id);
      if (current && current.id === (players[turnIndex]?.id ?? "")) {
        const nextIdx = nextEligibleIndex(
          playersNext,
          (turnIndex + 1) % playersNext.length
        );
        setTurnIndex(nextIdx);
      }

      // Check win AFTER elimination
      maybeEndGame(deckNext, playersNext);
    } else {
      // restore (house rule)
      const playersNext = players.map((p) =>
        p.id === id ? { ...p, eliminated: false } : p
      );
      setPlayers(playersNext);
    }
  };

  const resetToSetup = () => {
    setTab("setup");
    setCurrentSet(null);
    setDeck([]);
    setReveal({ open: false });
    setTurnIndex(0);
    setGameOver((g) => ({ ...g, open: false }));
  };

  const newRound = () => buildDeckAndStart();

  const revealPlayerName =
    reveal.open && reveal.playerId
      ? players.find((p) => p.id === reveal.playerId)?.name ?? ""
      : "";

  const canPick =
    !!currentPlayer &&
    !currentPlayer.eliminated &&
    !currentPlayer.picked &&
    !gameOver.open;

  return (
    <div className="app">
      <h1>Undercover (Offline PWA)</h1>

      {tab === "setup" && (
        <>
          <PlayersPanel
            players={players}
            onAdd={addPlayer}
            onUpdateName={updatePlayerName}
            onRemove={removePlayer}
            onClear={clearPlayers}
          />

          <SettingsPanel
            totalPlayers={players.length}
            undercoverCount={undercoverCount}
            includeMrWhite={includeMrWhite}
            minPlayersNeeded={minPlayersNeeded}
            onChangeUndercover={setUndercoverCount}
            onToggleMrWhite={setIncludeMrWhite}
          />

          <WordEditor
            wordsInput={wordsInput}
            wordsError={wordsError}
            onChangeInput={setWordsInput}
            onSave={onSaveWords}
            onLoadDefaults={onLoadDefaults}
          />

          <div className="divider" />
          <button
            className="primary"
            disabled={!setupValid}
            onClick={buildDeckAndStart}
          >
            Start Game (Build Deck)
          </button>
        </>
      )}

      {tab === "play" && (
        <>
          <TurnBanner current={currentPlayer} remainingCards={remainingCards} />

          <Deck deck={deck} canPick={canPick} onPick={onPickCard} />

          <RoundStatus
            players={players}
            currentPlayerId={currentPlayer?.id ?? null}
            onToggleElimination={toggleElimination}
          />

          <div className="row gap">
            <button onClick={resetToSetup}>Back to Setup</button>
            <button onClick={newRound} disabled={deck.length === 0}>
              New Round (new word set)
            </button>
          </div>

          <RevealModal
            reveal={reveal}
            currentSet={currentSet}
            playerName={revealPlayerName}
            onClose={onHideAndPass}
          />

          <GameOverBanner
            state={gameOver}
            onNewRound={newRound}
            onBackToSetup={resetToSetup}
          />
        </>
      )}
    </div>
  );
}
