// create 128 randomly generated player characters
// pit them against each other in 1 on 1's
// any time they survive and get a scar out of it, do the scar table logic
// heal all participants and do it again

import { Player } from "./src/combatant.ts";
import { roll, sum } from "./src/dice.ts";

const ARMOR = [
  -1,
  0, // None
  0,
  0,
  1, // Brigandine
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  2, // Chainmail
  2,
  2,
  2,
  2,
  3, // Plate
];
const SHIELDS = [
  "",
  "none", // None
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "helmet", // Helmet
  "helmet",
  "helmet",
  "shield", // Shield
  "shield",
  "shield",
  "both", // Helmet & Shield
];

const WEAPONS = [
  "",
  "basic",
  "basic",
  "basic",
  "basic",
  "basic",
  "better",
  "better",
  "better",
  "better",
  "better",
  "better",
  "better",
  "better",
  "better",
  "ranged4",
  "ranged6",
  "ranged6",
  "ranged6",
  "ranged8",
  "bulky",
];

let id = 0;
function randomPlayer(): Player {
  const str = sum([6, 6, 6]);
  let dex = sum([6, 6, 6]);
  const wil = sum([6, 6, 6]);
  const hp = roll([6])[0];
  const wornArmor = ARMOR[roll([20])[0]];
  let shieldRoll = SHIELDS[roll([20])[0]];
  const weaponRoll = WEAPONS[roll([20])[0]];
  let atk: number = 4;
  if (weaponRoll.startsWith("ranged")) {
    dex = 20; // guarantee going first
    atk = parseInt(weaponRoll.split("ranged")[1]);
  } else {
    switch (weaponRoll) {
      case "basic":
        atk = 6;
        break;
      case "better":
        atk = 8;
        break;
      case "bulky":
        atk = 10;
        break;
    }
  }
  if (["shield", "both"].includes(shieldRoll) && weaponRoll == "bulky") {
    shieldRoll = shieldRoll == "both" ? "helmet" : "none";
  }
  let rmr = wornArmor;
  switch (shieldRoll) {
    case "shield":
    case "helmet":
      rmr = Math.min(3, rmr + 1);
      break;

    case "both":
      rmr = Math.min(3, rmr + 2);
      break;
  }

  return new Player("Player " + (id++), { hp, str, dex, wil, rmr, atk });
}

function combat(player1: Player, player2: Player) {
  let [first, second] = dexComp(player1, player2);

  while (first.active() && second.active()) {
    turn(first, second);
    [first, second] = [second, first];
  }
}

function dexComp(player1: Player, player2: Player) {
  if (player1.DEX > player2.DEX) {
    return [player1, player2];
  }
  if (player1.DEX < player2.DEX) {
    return [player2, player1];
  }
  // coin toss
  return sum([2]) > 1 ? [player1, player2] : [player2, player1];
}

function turn(attacker: Player, defender: Player) {
  const attack = attacker.attack();
  defender.damage(attack);
}

function resolveScar(_player: Player) {
  const player: any = _player;
  switch (player._scarred) {
    case 1:
    case 2:
      player.HP = Math.max(player.HP, sum([6]));
      break;
    case 3:
      player.HP = Math.max(18, player.HP + sum([6]));
      break;
    case 4:
    case 5:
      player.HP = Math.max(player.HP, sum([6, 6]));
      break;
    case 6:
      switch (sum([6])) {
        case 1:
        case 2:
          player.STR = Math.max(player.STR, sum([6, 6, 6]));
          break;
        case 3:
        case 4:
          player.DEX = Math.max(player.DEX, sum([6, 6, 6]));
          break;
        case 5:
        case 6:
          player.WIL = Math.max(player.WIL, sum([6, 6, 6]));
      }
      break;
    case 7:
      player.DEX = Math.max(player.DEX, sum([6, 6, 6]));
      break;
    case 8:
      player.WIL = sum([20]) <= player.WIL
        ? Math.max(18, player.WIL + sum([4]))
        : player.WIL;
      break;
    case 9:
      player.WIL = Math.max(player.WIL, sum([6, 6, 6]));
      break;
    case 10:
      player.WIL = sum([20]) <= player.WIL
        ? Math.max(18, player.WIL + sum([6]))
        : player.WIL;
      break;
    // don't actually matter because no one has a d12 in this
    case 11:
    case 12:
  }
}

if (import.meta.main) {
  const players: Player[] = [];
  for (let i = 0; i < 128; i++) {
    players.push(randomPlayer());
  }

  let bracket = players;
  let round = 1;
  while (bracket.length > 1) {
    console.log("Round " + round);
    // run bracket
    for (let i = 0; i < bracket.length; i += 2) {
      const first = bracket[i];
      const second = bracket[i + 1];
      console.log(first.NAME + " v. " + second.NAME);
      combat(first, second);
      console.log(first.toString());
      console.log(second.toString());
    }
    // replace old bracket
    bracket = bracket.filter((p) => p.active());

    // handle scars and heal
    for (const player of bracket) {
      if (player.scarred()) {
        resolveScar(player);
      }
      player.heal();
    }
    round++;
  }

  console.log("Winner!");
  console.log(bracket[0].toString());
}
