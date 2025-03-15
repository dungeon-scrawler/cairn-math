import { combat } from "./combat.ts";
import { entityFromJson } from "./model/entity.ts";

if (import.meta.main) {
  const DATA = JSON.parse(Deno.readTextFileSync("./data.json"));
  const first = Deno.args[0] ?? "default";
  const second = Deno.args[1] ?? first;
  const player = entityFromJson(first, DATA);
  const monster = entityFromJson(second, DATA);
  const state = { player, monster };
  const report = combat(state);

  console.log(
    `# REPORT (${state.player.NAME} v. ${state.monster.NAME}) ##############################`,
  );
  console.log(`  Wins      - ${report.kills.add(report.routs).percent()}`);
  console.log(`    By Kill - ${report.kills.percent()}`);
  console.log(`    By Rout - ${report.routs.percent()}`);
  console.log(`  Losses    - ${report.deaths.percent()}`);
  // TODO: track scars and attribute loss
  console.log(
    `###############################################################`,
  );
}
