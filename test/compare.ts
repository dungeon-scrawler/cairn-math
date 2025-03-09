import { avgDmgRoundsToHit, maxDmgRoundsToHit } from "../alt/heuristic.ts";
import { Entity, entityFromJson, entityToString } from "../model/entity.ts";

const HP = [3, 6, 9, 12, 15];
const STR = [3, 6, 10, 14, 18];
const RMR = [0, 1, 2, 3];
const ATK = [4, 6, 8, 10, 12];

const possibleEntities: Entity[] = [];
for (const hp of HP) {
  for (const str of STR) {
    for (const rmr of RMR) {
      for (const atk of ATK) {
        possibleEntities.push(
          entityFromJson({
            hp,
            str,
            rmr,
            atk,
            wil: 10,
            dex: 10,
          }),
        );
      }
    }
  }
}

console.log("Possible entities -", possibleEntities.length);

const matchups = [];
for (let i = 0; i < possibleEntities.length; i++) {
  for (let j = i; j < possibleEntities.length; j++) {
    matchups.push([possibleEntities[i], possibleEntities[j]]);
  }
}

console.log("Possible matchups -", matchups.length);

Deno.writeTextFileSync(
  "./matchups.csv",
  "Player,Monster,PlayerAvgRoundsToHit,PlayerMaxRoundsToHit,MonsterAvgRoundsToHit,MonsterMaxRoundsToHit,ProjectedWinner\n",
);
for (const [player, monster] of matchups) {
  const data: string[] = [];
  data.push(entityToString(player), entityToString(monster));

  const playerAvgRounds = avgDmgRoundsToHit(
    player.ATK,
    monster.hp,
    monster.RMR,
  );
  data.push(`${playerAvgRounds}`);

  const playerMaxRounds = maxDmgRoundsToHit(
    player.ATK,
    monster.hp,
    monster.RMR,
  );
  data.push(`${playerMaxRounds}`);

  const monsterAvgRounds = avgDmgRoundsToHit(
    monster.ATK,
    player.hp,
    player.RMR,
  );
  data.push(`${monsterAvgRounds}`);

  const monsterMaxRounds = maxDmgRoundsToHit(
    monster.ATK,
    player.hp,
    player.RMR,
  );
  data.push(`${monsterMaxRounds}`);

  data.push(
    heuristicOutcome(
      playerAvgRounds,
      playerMaxRounds,
      monsterAvgRounds,
      monsterMaxRounds,
    ),
  );

  Deno.writeTextFileSync("./matchups.csv", data.join(",") + "\n", {
    append: true,
  });
}

function heuristicOutcome(
  playerAvgRounds: number,
  playerMaxRounds: number,
  monsterAvgRounds: number,
  monsterMaxRounds: number,
): string {
  if (playerAvgRounds < monsterMaxRounds) {
    return "- PLAYER WIN -";
  } else if (monsterAvgRounds < playerMaxRounds) {
    return "- MONSTER WIN -";
  } else if (playerAvgRounds > monsterAvgRounds) {
    return "- Probable PLAYER WIN -";
  } else if (monsterAvgRounds > playerAvgRounds) {
    return "- Probable MONSTER WIN -";
  } else if (playerAvgRounds == monsterAvgRounds) {
    if (playerMaxRounds < monsterMaxRounds) {
      return "- Maybe PLAYER WIN -";
    } else if (monsterMaxRounds < playerMaxRounds) {
      return "- Maybe MONSTER WIN -";
    } else {
      return "- DRAW -";
    }
  }
  return "unknown";
}
