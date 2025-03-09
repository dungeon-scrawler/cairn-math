import { Report } from "../model/report.ts";
import { State } from "../model/state.ts";
import { ONE, ratio, ZERO } from "../util/ratio.ts";

function avgDamageAfterArmor(
  attackerDmgMax: number,
  defenderArmor: number,
): number {
  let total = 0;
  for (let i = 1; i <= attackerDmgMax; i++) {
    total += Math.max(0, i - defenderArmor);
  }
  return total / attackerDmgMax;
}

function roundsToHit(avgDmg: number, defenderHP: number) {
  const targetDamage = defenderHP + 1;
  return targetDamage / avgDmg;
}

export function maxDmgRoundsToHit(
  attackerDmgMax: number,
  defenderHP: number,
  defenderArmor: number,
): number {
  return roundsToHit(attackerDmgMax - defenderArmor, defenderHP);
}

export function avgDmgRoundsToHit(
  attackerDmgMax: number,
  defenderHP: number,
  defenderArmor: number,
): number {
  return roundsToHit(
    avgDamageAfterArmor(attackerDmgMax, defenderArmor),
    defenderHP,
  );
}
export function heuristicOutcome(state: State): Report {
  const playerMaxRounds = maxDmgRoundsToHit(
    state.player.ATK,
    state.monster.hp,
    state.monster.RMR,
  );
  const playerAvgRounds = avgDmgRoundsToHit(
    state.player.ATK,
    state.monster.hp,
    state.monster.RMR,
  );
  const monsterMaxRounds = maxDmgRoundsToHit(
    state.monster.ATK,
    state.player.hp,
    state.player.RMR,
  );
  const monsterAvgRounds = avgDmgRoundsToHit(
    state.monster.ATK,
    state.player.hp,
    state.player.RMR,
  );

  // console.log("PLAYER MAX: ", playerMaxRounds);
  // console.log("PLAYER AVG: ", playerAvgRounds);
  // console.log("MONSTER MAX: ", monsterMaxRounds);
  // console.log("MONSTER AVG: ", monsterAvgRounds);

  if (playerAvgRounds < monsterMaxRounds) {
    return PLAYER_WIN_REPORT;
  } else if (monsterAvgRounds < playerMaxRounds) {
    return MONSTER_WIN_REPORT;
  } else if (playerAvgRounds > monsterAvgRounds) {
    console.log("- Probable PLAYER WIN -");
    return PLAYER_PROBABLE_WIN_REPORT;
  } else if (monsterAvgRounds > playerAvgRounds) {
    console.log("- Probable MONSTER WIN -");
    return MONSTER_PROBABLE_WIN_REPORT;
  } else if (playerAvgRounds == monsterAvgRounds) {
    if (playerMaxRounds < monsterMaxRounds) {
      console.log("- Maybe PLAYER WIN -");
      return PLAYER_PROBABLE_WIN_REPORT;
    } else if (monsterMaxRounds < playerMaxRounds) {
      console.log("- Maybe MONSTER WIN -");
      return MONSTER_PROBABLE_WIN_REPORT;
    } else {
      // console.log("- DRAW -");
      return DRAW_REPORT;
    }
  }
  return DRAW_REPORT;
  // Deno.exit(0);
}

// TODO: revisit this and see if you can come up with a way of combining the Round
// numbers above to make a custom ratio
const PLAYER_WIN_REPORT = {
  kills: ONE,
  deaths: ZERO,
  routs: ZERO,
};
const MONSTER_WIN_REPORT = {
  kills: ZERO,
  deaths: ONE,
  routs: ZERO,
};
const PLAYER_PROBABLE_WIN_REPORT = {
  kills: ratio(2, 3),
  deaths: ratio(1, 3),
  routs: ZERO,
};
const MONSTER_PROBABLE_WIN_REPORT = {
  kills: ratio(1, 3),
  deaths: ratio(2, 3),
  routs: ZERO,
};
const DRAW_REPORT = {
  kills: ratio(1, 2),
  deaths: ratio(1, 2),
  routs: ZERO,
};
