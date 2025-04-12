import { ITERATIONS, MODE, PRECISION } from "./env.ts";
import { Result } from "./result.ts";

export function printReport(result: Result, title: string, i: string) {
  switch (MODE) {
    case "parallel":
      parallelReport(result, i);
      break;
    default:
      title && console.log(title);
      console.log(fullReport(result));
      break;
  }
}

function fullReport(result: Result): string {
  const total = result.total();
  const kills = result.kills();
  const routs = result.routs();
  const wins = result.wins();

  const scars = result.scars();
  const downed = result.downed();
  const injured = result.injured();

  const losses = result.losses();
  const dead = result.dead();
  const rounds = result.rounds();

  const out: string[] = [];
  out.push(`#####################`);
  out.push(` Wins:        ${asPercent(wins / total)}`);
  out.push(`   Kills:     ${asPercent(kills / total)}`);
  out.push(`   Routs:     ${asPercent(routs / total)}`);
  out.push(`   (Scars):   ${(scars / (wins || 1)).toFixed(2)}`);
  out.push(`   (Injured): ${(injured / (wins || 1)).toFixed(2)}`);
  if (downed > 0 || dead > 0) {
    out.push(`   (Downed):  ${(downed / (wins || 1)).toFixed(2)}`);
    out.push(`   (Deaths):  ${(dead / (wins || 1)).toFixed(2)}`);
  }
  out.push(` Losses:      ${asPercent(losses / total)}`);
  out.push(`#####################`);
  out.push(` Avg. Rounds: ${(rounds / total).toFixed(1)}`);

  return out.join("\n");
}

function asPercent(num: number, percentSign = true): string {
  return `${(num * 100).toFixed(PRECISION)}${percentSign ? "%" : ""}`;
}

function parallelReport(result: Result, f: string) {
  const wins = result.wins();
  toCell(asPercent(wins / result.total(), false), `./f${f}/wins.csv`);
  toCell((result.scars() / (wins || 1)).toFixed(2), `./f${f}/scarred.csv`);
  toCell(
    (result.injured() / (wins || 1)).toFixed(2),
    `./f${f}/injured.csv`,
  );
  toCell((result.downed() / (wins || 1)).toFixed(2), `./f${f}/downed.csv`);
  toCell((result.dead() / (wins || 1)).toFixed(2), `./f${f}/dead.csv`);
}

function toCell(value: string, file: string): void {
  Deno.writeTextFileSync(file, `${value},`, { append: true });
}
