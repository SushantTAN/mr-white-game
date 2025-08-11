export type Role = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE';

export type WordSet = { civilianWord: string; undercoverWord: string };

export type Player = {
  id: string;
  name: string;
  eliminated: boolean;
  picked: boolean;
};

export type Card = {
  id: string;
  role: Role;
  picked: boolean;
  holderId?: string; // player id
};

export type RevealState = {
  open: boolean;
  playerId?: string;
  role?: Role;
  /** If true, the modal must NOT show the word (used for elimination reveals). */
  hideWord?: boolean;
};

export type GameOverState = {
  open: boolean;
  winner: 'UNDERCOVER' | 'CIVILIANS';
  aliveBad: number;
  aliveCiv: number;
};
