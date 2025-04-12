import { combat } from "./combat.ts";
import {
  Monster,
  monster as _Monster,
  Player,
  players as _Players,
} from "./combatant.ts";
import { ITERATIONS } from "./env.ts";
import { printReport } from "./report.ts";
import { Result } from "./result.ts";
import { toString } from "./state.ts";

export function main() {
  // load combatants
  const first = Deno.args[0] ?? "default";
  const second = Deno.args[1] ?? first;
  const DATA = JSON.parse(Deno.readTextFileSync("data.json"));
  const players = _Players(first, DATA);
  const monster = _Monster(second, DATA);

  applyDetachmentRules(players, monster);

  const result: Result = new Result();
  for (let i = 0; i < ITERATIONS; i++) {
    result.add(combat(players, monster));
  }
  printReport(result, toString({ players, monster }), Deno.args[2]);
}

function applyDetachmentRules(players: Player[], enemy: Monster): void {
  if (players.length == 1) {
    // the current method makes calculating detachments on the player side
    // too obnoxious with multiple players, so for now it's only supported
    // in a 1v1
    const player = players[0];
    if (player.detachment != enemy.detachment) {
      if (player.detachment) {
        enemy.impair();
        player.enhance();
      } else {
        player.impair();
        enemy.enhance();
      }
    }
    return;
  }
  for (const player of players) {
    if (enemy.detachment) {
      player.impair();
      enemy.enhance();
    }
  }
}
