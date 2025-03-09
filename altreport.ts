import { Ratio, ratio } from "./util/ratio.ts";

type Outcome = "kill" | "death" | "rout";
type Roll = [string, Ratio | Readonly<Ratio>, Report];
export type Report = Outcome | [Roll, ...Roll[]];

export function toString(report: Report): string {
  if (typeof report == "string") {
    return report;
  }
  const inner = report.map(([ctx, rat, rol]) =>
    `{${ctx}} ${rat.toString()} ${toString(rol)}`
  );
  return `(${inner.join(",")})`;
}

export function reportEquals(a: Report, b: Report): boolean {
  if (typeof a == "string" && typeof b == "string") {
    return a == b;
  }
  if (typeof a == "string" || typeof b == "string" || a.length !== b.length) {
    return false;
  }
  return a.every((roll, idx) => rollEquals(roll, b[idx]));
}

function rollEquals(a: Roll, b: Roll): boolean {
  return a[0] == b[0] && a[1].equals(b[1]) && reportEquals(a[2], b[2]);
}

// const rA: Report = [[ratio(1), 'kill']]
// const rB: Report = [[ratio(1), [[ratio(0), 'death']]]]
// if (!reportEquals(rA, rB)) {
//   throw new Error("BAD FUNCTION");
// } else {
//   console.log("Good");
// }
