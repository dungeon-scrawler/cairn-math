
export function gcd(a: number, b: number): number {
  while (b != 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}