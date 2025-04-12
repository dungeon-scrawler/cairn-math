export function roll(dice: number[]) {
  return dice.map((d) => Math.ceil(Math.random() * d));
}

export function sum(dice: number[]) {
  return roll(dice).reduce((a, b) => a + b, 0);
}

export function largest(dice: number[]) {
  return Math.max(...roll(dice));
}
