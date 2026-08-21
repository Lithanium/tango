export const SIZE = 6;
export const HALF = SIZE / 2;

export const SUN = 'S';
export const MOON = 'M';
export const EMPTY = null;

export const MARKER_EQUAL = '=';
export const MARKER_OPPOSITE = 'x';

export const SOLVED = 'SOLVED';
export const STUCK = 'STUCK';
export const INVALID = 'INVALID';

export function opposite(val) {
  return val === SUN ? MOON : SUN;
}
