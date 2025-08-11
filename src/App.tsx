import { useEffect, useMemo, useState } from 'react';
import { load, save } from './utils/storage';

import SettingsPanel from './components/SettingsPanel';
import WordEditor from './components/WordEditor';
import PlayersPanel from './components/PlayersPanel';
import TurnBanner from './components/TurnBanner';
import Deck from './components/Deck';
import RevealModal from './components/RevealModal';
import RoundStatus from './components/RoundStatus';
import GameOverBanner from './components/GameOverBanner';
import type { Card, GameOverState, Player, RevealState, Role, WordSet } from './types';

// If you moved defaults to JSON, import it instead:
// import DEFAULT_WORDS from './data/defaultWords.json';
const DEFAULT_WORDS: WordSet[] = [
  { civilianWord: 'apple', undercoverWord: 'orange' },
  { civilianWord: 'cat', undercoverWord: 'dog' },
  { civilianWord: 'sun', undercoverWord: 'moon' },
  { civilianWord: 'river', undercoverWord: 'ocean' },
  { civilianWord: 'pizza', undercoverWord: 'burger' }
];

const STORAGE_KEYS = {
  words: 'uc_words',
  players: 'uc_players_v2'
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  // words
  const [words, setWords] = useState<WordSet[]>(
    () => load<WordSet[]>(STORAGE_KEYS.words, DEFAULT_WORDS)
  );
  const [wordsInput, setWordsInput] = useState(JSON.stringify(words, null, 2));
  const [wordsError, setWordsError] = useState('');

  // players (persisted)
  const [players, setPlayers] = useState<Player[]>(
    () => load<Player[]>(STORAGE_KEYS.players, [])
  );

  // settings
  const [undercoverCount, setUndercoverCount] = useState<number>(1);
  const [includeMrWhite, setIncludeMrWhite] = useState<boolean>(false);

  // runtime
  const [tab, setTab] = useState<'setup' | 'play'>('setup');
  const [currentSet, setCurrentSet] = useState<WordSet | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [reveal, setReveal] = useState<RevealState>({ open: false });
  const [gameOver, setGameOver] = useState<GameOverState>({
    open: false,
    winner: 'UNDERCOVER',
    aliveBad: 0,
    aliveCiv: 0
  });

  // persist words/players
  useEffect(() => {
    save(STORAGE_KEYS.words, words);
    setWordsInput(JSON.stringify(words, null, 2));
  }, [words]);
  useEffect(() => save(STORAGE_KEYS.players, players), [players]);

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
    tab === 'play' && players.length > 0 ? players[turnIndex] ?? null : null;

  // words actions
  const onSaveWords = () => {
    setWordsError('');
    try {
      const parsed = JSON.parse(wordsInput) as WordSet[];
      const ok =
        Array.isArray(parsed) &&
        parsed.every(
          (w) =>
            typeof w?.civilianWord === 'string' &&
            typeof w?.undercoverWord === 'string'
        );
      if (!ok) throw new Error('Must be [{"civilianWord","undercoverWord"}, ...].');
      setWords(parsed);
    } catch (e) {
      setWordsError((e as Error).message || 'Invalid JSON');
    }
  };
  const onLoadDefaults = () => {
    setWords(DEFAULT_WORDS);
    setWordsError('');
  };

  // players panel actions
  const addPlayer = () => {
    const n = players.length + 1;
    setPlayers([
      ...players,
      { id: crypto.randomUUID(), name: `Player ${n}`, eliminated: false, picked: false }
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

    const set = words[(Math.random() * words.length) | 0];
    setCurrentSet(set);

    const roles: Role[] = [
      ...Array(undercoverCount).fill('UNDERCOVER'),
      ...(includeMrWhite ? ['MR_WHITE'] : [])
    ];
    const civs = players.length - roles.length;
    if (civs < 1) {
      alert('Need at least 1 Civilian.');
      return;
    }
    roles.push(...Array(civs).fill('CIVILIAN'));

    const shuffledRoles = shuffle(roles);
    const newDeck: Card[] = shuffledRoles.map((r) => ({
      id: crypto.randomUUID(),
      role: r,
      picked: false
    }));
    setDeck(newDeck);

    setPlayers((prev) => prev.map((p) => ({ ...p, picked: false, eliminated: false })));
    setTurnIndex(nextEligibleIndex(players, 0));
    setReveal({ open: false });
    setGameOver((g) => ({ ...g, open: false }));
    setTab('play');
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
      if (card.role === 'UNDERCOVER' || card.role === 'MR_WHITE') aliveBad++;
      else aliveCiv++;
    }
    return { aliveBad, aliveCiv };
  }

  // check end condition and open banner if triggered
  function maybeEndGame(deckNow: Card[], playersNow: Player[]) {
    const { aliveBad, aliveCiv } = computeAliveCounts(deckNow, playersNow);
    if (aliveBad >= aliveCiv) {
      setGameOver({ open: true, winner: 'UNDERCOVER', aliveBad, aliveCiv });
      return true;
    }
    // If you want civilians to auto-win when no bad guys remain, uncomment:
    // if (aliveBad === 0) { setGameOver({ open: true, winner: 'CIVILIANS', aliveBad, aliveCiv }); return true; }
    return false;
  }

  // card pick handler (by current player only)
  const onPickCard = (index: number) => {
    if (gameOver.open) return;
    if (!currentPlayer) return;
    if (currentPlayer.eliminated || currentPlayer.picked) return;

    const card = deck[index];
    if (!card || card.picked) return;

    const nextDeck = deck.slice();
    nextDeck[index] = { ...card, picked: true, holderId: currentPlayer.id };
    setDeck(nextDeck);

    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, picked: true } : p
    );
    setPlayers(updatedPlayers);

    // IMPORTANT CHANGE: Do NOT check end condition on pick
    // (prevents early auto-win during the draw phase)
    // maybeEndGame(nextDeck, updatedPlayers);  <-- removed

    // NORMAL reveal (show word): hideWord = false
    setReveal({ open: true, playerId: currentPlayer.id, role: card.role, hideWord: false });
  };

  // after hiding, move to next eligible player
  const onHideAndPass = () => {
    setReveal({ open: false });
    const nextIdx = nextEligibleIndex(players, (turnIndex + 1) % players.length);
    setTurnIndex(nextIdx);

    // OPTIONAL: If you want to auto-check once everyone has picked:
    // if (players.every(p => p.picked || p.eliminated)) {
    //   maybeEndGame(deck, players);
    // }
  };

  // eliminate/restore (elimination reveals ROLE ONLY and checks win)
  const toggleElimination = (id: string) => {
    if (gameOver.open) return;

    const target = players.find((p) => p.id === id);
    if (!target) return;

    if (!target.eliminated) {
      let roleToReveal: Role | undefined;
      const deckNext = deck.slice();
      let playersNext = players.slice();

      if (!target.picked) {
        const avail = deckNext.map((c, i) => ({ c, i })).filter((x) => !x.c.picked);
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

      // Elimination reveal: role ONLY
      if (roleToReveal) {
        setReveal({ open: true, playerId: id, role: roleToReveal, hideWord: true });
      }

      // advance turn if we eliminated the current player
      const current = players.find((p) => p.id === id);
      if (current && current.id === (players[turnIndex]?.id ?? '')) {
        const nextIdx = nextEligibleIndex(playersNext, (turnIndex + 1) % playersNext.length);
        setTurnIndex(nextIdx);
      }

      // IMPORTANT: Check win condition AFTER elimination
      maybeEndGame(deckNext, playersNext);
    } else {
      // restore
      const playersNext = players.map((p) =>
        p.id === id ? { ...p, eliminated: false } : p
      );
      setPlayers(playersNext);
      // You can re-check if you allow restores
      // maybeEndGame(deck, playersNext);
    }
  };

  const resetToSetup = () => {
    setTab('setup');
    setCurrentSet(null);
    setDeck([]);
    setReveal({ open: false });
    setTurnIndex(0);
    setGameOver((g) => ({ ...g, open: false }));
  };

  const newRound = () => buildDeckAndStart();

  const revealPlayerName =
    reveal.open && reveal.playerId
      ? players.find((p) => p.id === reveal.playerId)?.name ?? ''
      : '';

  const canPick = !!currentPlayer && !currentPlayer.eliminated && !currentPlayer.picked && !gameOver.open;

  return (
    <div className="app">
      <h1>Undercover (Offline PWA)</h1>

      {tab === 'setup' && (
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
            onChange={(patch) => {
              if (patch.undercoverCount !== undefined) setUndercoverCount(patch.undercoverCount);
              if (patch.includeMrWhite !== undefined) setIncludeMrWhite(patch.includeMrWhite);
            }}
          />

          <WordEditor
            wordsInput={wordsInput}
            wordsError={wordsError}
            onChangeInput={setWordsInput}
            onSave={onSaveWords}
            onLoadDefaults={onLoadDefaults}
          />

          <div className="divider" />
          <button className="primary" disabled={!setupValid} onClick={buildDeckAndStart}>
            Start Game (Build Deck)
          </button>
        </>
      )}

      {tab === 'play' && (
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
