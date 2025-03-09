import { heuristicOutcome } from "./alt/heuristic.ts";
import { entityFromJson } from "./model/entity.ts";

if (import.meta.main) {
  const first = Deno.args[0] ?? "/home/cairn/data/test.json";
  const second = Deno.args[1] ?? first;
  console.log(first, second);
  const player = entityFromJson(JSON.parse(Deno.readTextFileSync(first)));
  const monster = entityFromJson(JSON.parse(Deno.readTextFileSync(second)));
  const state = { player, monster };
  heuristicOutcome(state);
}
