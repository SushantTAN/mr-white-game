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
  /** If true, do not display the word in the modal (used for Mr. White and eliminations). */
  hideWord?: boolean;
  /** If true, do not display the role in the modal (used for normal civilian/undercover picks). */
  hideRole?: boolean;
};

export type GameOverState = {
  open: boolean;
  winner: 'UNDERCOVER' | 'CIVILIANS';
  aliveBad: number;
  aliveCiv: number;
};
