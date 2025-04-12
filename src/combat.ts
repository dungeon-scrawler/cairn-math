import { Monster, Player } from "./combatant.ts";
import { log } from "./log.ts";
import { KILL, LOSS, Result, ROUT } from "./result.ts";
import { State } from "./state.ts";

type Outcome = (() => Outcome) | Result;
let ROUNDS = 0;
export function combat(players: Player[], monster: Monster): Result {
  ROUNDS = 0;

  let outcome: Outcome = () => dexSaves({ players, monster });
  while (!done(outcome)) {
    outcome = outcome();
  }

  const result: Result = new Result().add(outcome);

  if (result.losses() == 0) {
    // only account for scars and injuries when there are survivors
    result.update(
      Result.Scars,
      players.filter((p) => !p.dead() && p.scarred()).length,
    );
    result.update(Result.Downed, players.filter((p) => p.downed()).length);
    result.update(Result.Injured, players.filter((p) => p.injured()).length);
    result.update(Result.Dead, players.filter((p) => p.dead()).length);
  }

  result.update(Result.Rounds, ROUNDS);

  // reset combatant stats
  players.forEach((p) => p.heal());
  monster.heal();

  return result;
}

function done(outcome: Outcome): outcome is Result {
  return outcome instanceof Result;
}

function dexSaves(state: State): Outcome {
  const passed: Player[] = [];
  const failed: Player[] = [];
  for (const player of state.players) {
    if (player.save("dex")) {
      passed.push(player);
    } else {
      failed.push(player);
    }
  }
  if (passed.length > 0) {
    // the players who pass their DEX save get to go before the monsters,
    // everyone else goes after
    return () => playerTurn({ players: passed, monster: state.monster }, state);
  } else {
    // the monsters go first
    return () => monsterTurn(state);
  }
}

function playerTurn(state: State, nextState?: State): Outcome {
  if (state.players.every((p) => p.dead() || p.downed())) {
    return LOSS;
  }

  ROUNDS += 0.5;

  const { players, monster } = state;
  state = nextState ?? state;

  const attack = rollFromPlayers(players);
  log(`players -> ${attack}`);
  monster.damage(attack);
  log(`M ${monster.toString()}`);
  if (monster.dead()) {
    return KILL;
  }
  if (monster.routed()) {
    return ROUT;
  }

  return () => monsterTurn(state);
}

function monsterTurn(state: State): Outcome {
  ROUNDS += 0.5;
  const { players, monster } = state;

  const active = (p: Player) => !p.dead() && !p.downed();
  const targets = monster.detachment
    ? players.filter(active)
    : [players.find(active)!];

  for (const target of targets) {
    const attack = monster.attack();
    log(`monster -> ${attack}`);
    target.damage(attack);
  }
  players.forEach((p) => log(`P ${p.toString()}`));
  return () => playerTurn(state);
}

function rollFromPlayers(players: Player[]): number {
  return Math.max(...players.filter((p) => p.active()).map((p) => p.attack()));
}
