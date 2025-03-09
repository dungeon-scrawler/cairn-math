import { gcd } from "./math.ts";

export class Ratio {
  constructor(
    public readonly numerator: number,
    public readonly denominator: number = 1,
  ) {
    if (denominator == 0) {
      throw new Error("Illegal denominator: 0");
    }
  }

  public add(other: Ratio): Ratio {
    if (this.denominator == other.denominator) {
      return new Ratio(this.numerator + other.numerator, this.denominator);
    } else {
      // find gcd
      const numerator = this.numerator * other.denominator +
        other.numerator * this.denominator;
      if (
        this.numerator !== 0 && other.numerator !== 0 &&
        !(numerator > this.numerator && numerator > other.numerator)
      ) {
        console.log(numerator, this.numerator, other.numerator);
        throw new Error("Integer overflow!");
      }
      const denominator = other.denominator * this.denominator;
      const factor = gcd(numerator, denominator);
      return new Ratio(numerator / factor, denominator / factor);
    }
  }

  public multiply(other: Readonly<Ratio>): Ratio {
    const numerator = this.numerator * other.numerator;
    const denominator = this.denominator * other.denominator;
    if (
      this.numerator !== 0 && other.numerator !== 0 &&
      !(numerator >= this.numerator && numerator >= other.numerator)
    ) {
      console.log(numerator, this.numerator, other.numerator);
      throw new Error("Integer overflow!");
    }
    // do gcd
    const factor = gcd(numerator, denominator);
    return new Ratio(numerator / factor, denominator / factor);
  }

  public toFloat(): number {
    return Number(this.numerator / this.denominator);
  }

  public lessThan(other: Readonly<Ratio>): boolean {
    return this.toFloat() < other.toFloat();
  }

  public refactor(): void {
    //
  }

  public percent(): string {
    return `${Number(this.toFloat() * 100).toFixed(2)}%`;
  }

  public equals(other: Ratio): boolean {
    return this.numerator == other.numerator &&
      this.denominator == other.denominator;
  }

  public toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}

export const ONE = Object.freeze(new Ratio(1));
export const ZERO = Object.freeze(new Ratio(0));
export const MINISCULE = Object.freeze(new Ratio(1, 1000000));
export function ratio(
  numerator: number,
  denominator?: number,
): Readonly<Ratio> {
  if (numerator == 1 && denominator === null || denominator === 1) {
    return ONE;
  }

  if (numerator === 0 && denominator === null || denominator === 1) {
    return ZERO;
  }
  return new Ratio(numerator, denominator);
}
