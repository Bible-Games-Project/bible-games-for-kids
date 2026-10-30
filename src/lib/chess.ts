// Christian chess: the full rules of chess (castling, en passant, promotion,
// check, checkmate and stalemate) with Bible characters as pieces. The New
// Testament plays from the bottom and moves first; the Old Testament plays
// from the top. Squares are 0-63, row by row from the top-left corner.

export type Side = "nt" | "ot";
export type Kind = "k" | "q" | "r" | "b" | "n" | "p";

export interface Piece {
  id: number; // stays the same as the piece moves, for animation
  side: Side;
  kind: Kind;
}

export interface Move {
  from: number;
  to: number;
  promote?: boolean; // a pawn reaching the far row becomes a queen
  castle?: "k" | "q";
  enPassant?: boolean;
}

export interface Position {
  board: (Piece | null)[];
  turn: Side;
  castling: { ntK: boolean; ntQ: boolean; otK: boolean; otQ: boolean };
  enPassant: number | null; // square a pawn may capture into this turn
}

const row = (sq: number) => sq >> 3;
const col = (sq: number) => sq & 7;
const at = (r: number, c: number) => r * 8 + c;
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const other = (s: Side): Side => (s === "nt" ? "ot" : "nt");

export function startPosition(): Position {
  const board: (Piece | null)[] = Array(64).fill(null);
  const back: Kind[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  let id = 0;
  back.forEach((kind, c) => {
    board[at(0, c)] = { id: id++, side: "ot", kind };
    board[at(7, c)] = { id: id++, side: "nt", kind };
  });
  for (let c = 0; c < 8; c++) {
    board[at(1, c)] = { id: id++, side: "ot", kind: "p" };
    board[at(6, c)] = { id: id++, side: "nt", kind: "p" };
  }
  return {
    board,
    turn: "nt",
    castling: { ntK: true, ntQ: true, otK: true, otQ: true },
    enPassant: null,
  };
}

// Pawns of the New Testament move up the board (towards row 0).
const forward = (s: Side) => (s === "nt" ? -1 : 1);

const KNIGHT = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];
const KING = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
const ROOK_DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const BISHOP_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

// Is `sq` attacked by any piece of side `by`?
export function attacked(board: (Piece | null)[], sq: number, by: Side): boolean {
  const r = row(sq);
  const c = col(sq);
  // pawns attack diagonally forward (so look backward from the square)
  const pr = r - forward(by);
  for (const dc of [-1, 1]) {
    if (inside(pr, c + dc)) {
      const p = board[at(pr, c + dc)];
      if (p && p.side === by && p.kind === "p") return true;
    }
  }
  for (const [dr, dc] of KNIGHT) {
    if (!inside(r + dr, c + dc)) continue;
    const p = board[at(r + dr, c + dc)];
    if (p && p.side === by && p.kind === "n") return true;
  }
  for (const [dr, dc] of KING) {
    if (!inside(r + dr, c + dc)) continue;
    const p = board[at(r + dr, c + dc)];
    if (p && p.side === by && p.kind === "k") return true;
  }
  const slide = (dirs: number[][], kinds: Kind[]) =>
    dirs.some(([dr, dc]) => {
      let rr = r + dr;
      let cc = c + dc;
      while (inside(rr, cc)) {
        const p = board[at(rr, cc)];
        if (p) return p.side === by && kinds.includes(p.kind);
        rr += dr;
        cc += dc;
      }
      return false;
    });
  return slide(ROOK_DIRS, ["r", "q"]) || slide(BISHOP_DIRS, ["b", "q"]);
}

const kingSquare = (board: (Piece | null)[], side: Side) =>
  board.findIndex((p) => p?.side === side && p.kind === "k");

export const inCheck = (pos: Position, side: Side = pos.turn) =>
  attacked(pos.board, kingSquare(pos.board, side), other(side));

// Moves that follow how each piece moves, before checking the king's safety.
function candidateMoves(pos: Position): Move[] {
  const { board, turn } = pos;
  const moves: Move[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || p.side !== turn) continue;
    const r = row(sq);
    const c = col(sq);
    const add = (to: number, extra: Partial<Move> = {}) => moves.push({ from: sq, to, ...extra });
    if (p.kind === "p") {
      const f = forward(turn);
      const last = turn === "nt" ? 0 : 7;
      const start = turn === "nt" ? 6 : 1;
      if (inside(r + f, c) && !board[at(r + f, c)]) {
        add(at(r + f, c), { promote: r + f === last });
        if (r === start && !board[at(r + 2 * f, c)]) add(at(r + 2 * f, c));
      }
      for (const dc of [-1, 1]) {
        if (!inside(r + f, c + dc)) continue;
        const to = at(r + f, c + dc);
        const target = board[to];
        if (target && target.side !== turn) add(to, { promote: r + f === last });
        else if (to === pos.enPassant) add(to, { enPassant: true });
      }
    } else if (p.kind === "n" || p.kind === "k") {
      for (const [dr, dc] of p.kind === "n" ? KNIGHT : KING) {
        if (!inside(r + dr, c + dc)) continue;
        const to = at(r + dr, c + dc);
        if (board[to]?.side !== turn) add(to);
      }
      if (p.kind === "k") {
        const home = turn === "nt" ? 7 : 0;
        const rights = pos.castling;
        const canK = turn === "nt" ? rights.ntK : rights.otK;
        const canQ = turn === "nt" ? rights.ntQ : rights.otQ;
        const enemy = other(turn);
        if (r === home && c === 4 && !attacked(board, sq, enemy)) {
          if (
            canK &&
            !board[at(home, 5)] &&
            !board[at(home, 6)] &&
            board[at(home, 7)]?.kind === "r" &&
            !attacked(board, at(home, 5), enemy)
          )
            add(at(home, 6), { castle: "k" });
          if (
            canQ &&
            !board[at(home, 3)] &&
            !board[at(home, 2)] &&
            !board[at(home, 1)] &&
            board[at(home, 0)]?.kind === "r" &&
            !attacked(board, at(home, 3), enemy)
          )
            add(at(home, 2), { castle: "q" });
        }
      }
    } else {
      const dirs =
        p.kind === "r" ? ROOK_DIRS : p.kind === "b" ? BISHOP_DIRS : [...ROOK_DIRS, ...BISHOP_DIRS];
      for (const [dr, dc] of dirs) {
        let rr = r + dr;
        let cc = c + dc;
        while (inside(rr, cc)) {
          const to = at(rr, cc);
          if (board[to]) {
            if (board[to]!.side !== turn) add(to);
            break;
          }
          add(to);
          rr += dr;
          cc += dc;
        }
      }
    }
  }
  return moves;
}

export function play(pos: Position, m: Move): Position {
  const board = pos.board.slice();
  const piece = board[m.from]!;
  const castling = { ...pos.castling };
  board[m.to] = m.promote ? { ...piece, kind: "q" } : piece;
  board[m.from] = null;
  if (m.enPassant) board[at(row(m.from), col(m.to))] = null;
  if (m.castle) {
    const home = row(m.from);
    const [rf, rt] = m.castle === "k" ? [7, 5] : [0, 3];
    board[at(home, rt)] = board[at(home, rf)];
    board[at(home, rf)] = null;
  }
  // Moving the king or a rook (or losing a rook) ends castling on that side.
  if (piece.kind === "k") {
    if (piece.side === "nt") castling.ntK = castling.ntQ = false;
    else castling.otK = castling.otQ = false;
  }
  for (const sq of [m.from, m.to]) {
    if (sq === 63) castling.ntK = false;
    if (sq === 56) castling.ntQ = false;
    if (sq === 7) castling.otK = false;
    if (sq === 0) castling.otQ = false;
  }
  const double = piece.kind === "p" && Math.abs(row(m.to) - row(m.from)) === 2;
  return {
    board,
    turn: other(pos.turn),
    castling,
    enPassant: double ? (m.from + m.to) / 2 : null,
  };
}

export function legalMoves(pos: Position): Move[] {
  return candidateMoves(pos).filter((m) => !inCheck(play(pos, m), pos.turn));
}

export type Outcome = "play" | "checkmate" | "stalemate" | "draw";

export function outcome(pos: Position): Outcome {
  const pieces = pos.board.filter(Boolean) as Piece[];
  if (pieces.every((p) => p.kind === "k")) return "draw";
  if (legalMoves(pos).length) return "play";
  return inCheck(pos) ? "checkmate" : "stalemate";
}

// ---------- The computer ----------
const VALUE: Record<Kind, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Small bonuses for pieces in the middle and pawns that have moved up.
function placeBonus(p: Piece, sq: number) {
  const r = row(sq);
  const c = col(sq);
  const centre = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5));
  if (p.kind === "p") return (p.side === "nt" ? 6 - r : r - 1) * 8 + centre * 2;
  if (p.kind === "n" || p.kind === "b") return centre * 10;
  if (p.kind === "q") return centre * 3;
  return 0;
}

// From the point of view of the side to move.
function evaluate(pos: Position): number {
  let score = 0;
  pos.board.forEach((p, sq) => {
    if (!p) return;
    const v = VALUE[p.kind] + placeBonus(p, sq);
    score += p.side === pos.turn ? v : -v;
  });
  return score;
}

function search(pos: Position, depth: number, alpha: number, beta: number): number {
  const moves = legalMoves(pos);
  if (!moves.length) return inCheck(pos) ? -100000 - depth : 0;
  if (depth === 0) return evaluate(pos);
  // captures first, so good moves are found early
  moves.sort(
    (a, b) =>
      (pos.board[b.to] ? VALUE[pos.board[b.to]!.kind] : 0) -
      (pos.board[a.to] ? VALUE[pos.board[a.to]!.kind] : 0),
  );
  let best = -Infinity;
  for (const m of moves) {
    const score = -search(play(pos, m), depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

// How far ahead the computer looks on each level (0 = moves at random).
export const DEPTH: Record<string, number> = {
  easy: 0,
  "easy-medium": 1,
  medium: 2,
  "medium-hard": 3,
  hard: 4,
};

export function computerMove(pos: Position, level: string): Move | null {
  const moves = legalMoves(pos);
  if (!moves.length) return null;
  const depth = DEPTH[level] ?? 2;
  if (depth === 0) {
    // On Easy it still takes a piece now and then.
    const captures = moves.filter((m) => pos.board[m.to]);
    const pool = captures.length && Math.random() < 0.4 ? captures : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Look one move further each round, but don't start a deeper round that
  // would keep a child waiting on a slow phone.
  const started = Date.now();
  let choice = moves[0];
  for (let d = 1; d <= depth; d++) {
    const roundStart = Date.now();
    let best: Move[] = [];
    let bestScore = -Infinity;
    for (const m of moves) {
      const score = -search(play(pos, m), d - 1, -Infinity, Infinity) + Math.random() * 8;
      if (score > bestScore + 0.5) {
        best = [m];
        bestScore = score;
      } else if (Math.abs(score - bestScore) <= 0.5) best.push(m);
    }
    choice = best[Math.floor(Math.random() * best.length)];
    const took = Date.now() - roundStart;
    if (Date.now() - started + took * 8 > 1500) break;
  }
  return choice;
}
