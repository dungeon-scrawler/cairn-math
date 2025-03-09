import { combat } from "./combat.ts";
import { entityFromJson } from "./model/entity.ts";

function data(key: string) {
  return `/home/cairn/dat/${key}.json`;
}

if (import.meta.main) {
  const first = data(Deno.args[0] ?? "test");
  const second = Deno.args[1] ? data(Deno.args[1]) : first;
  console.log(first, second);
  const player = entityFromJson(JSON.parse(Deno.readTextFileSync(first)));
  const monster = entityFromJson(JSON.parse(Deno.readTextFileSync(second)));
  const state = { player, monster };
  const report = combat(state);
  // resolve the report
  console.log(
    `# REPORT (${state.player.NAME} v. ${state.monster.NAME}) ##############################`,
  );
  console.log(`  Losses    - ${report.deaths.percent()}`);
  console.log(`  Wins      - ${report.kills.add(report.routs).percent()}`);
  console.log(`    By Kill - ${report.kills.percent()}`);
  console.log(`    By Rout - ${report.routs.percent()}`);
  console.log(
    `###############################################################`,
  );
  // console.log('CACHE HITS:')
  // console.log(JSON.stringify(CACHE_HITS, null, 4));
  // BAD && console.log(JSON.stringify(BAD, null, 4))
}
