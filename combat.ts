import { log } from "./util/log.ts";
import { Report } from "./model/report.ts";
import {
  applyDamage,
  State,
  stateHash,
  wasScarred,
  wasWounded,
} from "./model/state.ts";
import { Action, Attack, attack, done, save, saveSequence } from "./action.ts";
import { heuristicOutcome } from "./alt/heuristic.ts";

export function combat(state: State): Report {
  const MAX_STR = Math.max(state.player.MAX_STR, state.monster.MAX_STR);
  // use the largest strength value to determine a heuristic cap on how many rounds we're willing to calculate
  const MAX_ATTACK_DEPTH = MAX_STR * 4; // gives plenty of room for a long stalemate

  const init = save(
    "DEX save",
    state.player.DEX,
    () => doAttack("player", state),
    () => doAttack("monster", state),
  );
  const executeStack: Action[] = [init];
  let actionDepth = 0;
  while (executeStack.length) {
    const action = executeStack[executeStack.length - 1];
    if (action instanceof Attack && actionDepth > MAX_ATTACK_DEPTH) {
      // resolve this action with a heuristic, pop it, and move on
      action.setReport(heuristicOutcome(action.state));
      executeStack.pop();
      continue;
    }

    const child = action.executor.next();
    if (child.done) {
      log("calculating " + action.kind);
      action.calculate();
      if (action.kind.includes("atk")) actionDepth -= 1;
      executeStack.pop();
    } else {
      log("executed " + action.kind);
      executeStack.push(child.value);
      if (child.value.kind.includes("atk")) actionDepth += 1;
    }
  }
  return init.getReport();
}

export const CACHE_HITS = {
  "cd_player": 0,
  "cd_monster": 0,
  "ws": 0,
  "cd_ws": 0,
  "atk_player": 0,
  "atk_monster": 0,
  "breaks": 0,
};

// function doAction(
//   cacheKey:
//     | "cd_player"
//     | "cd_monster"
//     | "ws"
//     | "cd_ws"
//     | "atk_player"
//     | "atk_monster",
//   state: State,
//   action: () => Action,
// ) {
//   const hash = `${stateHash(state)}`;
//   const key = `${cacheKey} ${hash}`;
//   if (!NO_CACHE && CACHE.has(key)) {
//     CACHE_HITS[cacheKey] += 1;
//     return CACHE.get(key)!;
//   }
//   const output = action();
//   CACHE.set(key, output);
//   return output;
// }

function doAttack(turn: "player" | "monster", state: State): Action {
  const turnFn = turn == "player" ? playerTurn : monsterTurn;
  return turnFn(state);
}

function doCriticalDamageSave(
  saver: "player" | "monster",
  state: State,
  pass: () => Action,
  fail: () => Action,
) {
  return save(
    `cd_${saver} ${stateHash(state)}`,
    saver == "player" ? state.player.str : state.monster.str,
    pass,
    fail,
  );
}

export function doMoraleSave(state: State) {
  return save(
    `ws ${stateHash(state)}`,
    state.monster.WIL,
    () => monsterTurn(state),
    () => done("rout"),
  );
}

export function doCombinedSave(state: State): Action {
  return saveSequence(
    `cd_ws ${stateHash(state)}`,
    state.monster.str,
    state.monster.WIL,
    () => monsterTurn(state),
    () => done("kill"),
    () => done("rout"),
  );
}

function playerTurn(state: State): Action {
  const attacks: (() => Action)[] = [];
  for (let dmg = state.player.ATK; dmg > 0; dmg--) {
    const actual = Math.max(0, dmg - state.monster.RMR);
    const criticalSave = actual > state.player.hp;
    const nextState = applyDamage(state, "monster", dmg);
    const moraleSave = state.monster.hp > 0 && nextState.monster.hp == 0;

    if (nextState.monster.str == 0) {
      attacks.push(() => done("kill"));
    } else if (criticalSave && moraleSave) {
      attacks.push(() => doCombinedSave(nextState));
    } else if (criticalSave) {
      attacks.push(() =>
        doCriticalDamageSave(
          "monster",
          nextState,
          () => doAttack("monster", nextState),
          () => done("kill"),
        )
      );
    } else if (moraleSave) {
      attacks.push(() => doMoraleSave(nextState));
    } else {
      attacks.push(() => doAttack("monster", nextState));
    }
  }
  return attack(`player_atk ${stateHash(state)}`, state, attacks);
}

function monsterTurn(state: State): Action {
  const attacks: (() => Action)[] = [];
  for (let dmg = state.monster.ATK; dmg > 0; dmg--) {
    const actual = Math.max(0, dmg - state.player.RMR);
    const criticalSave = actual > state.player.hp;
    const nextState = applyDamage(state, "player", dmg);

    if (wasScarred(state, nextState)) {
      // scarred = true
    } else if (wasWounded(state, nextState)) {
      // wounded = true
    }

    if (nextState.player.str == 0) {
      attacks.push(() => done("death"));
    } else if (criticalSave) {
      attacks.push(() =>
        doCriticalDamageSave(
          "player",
          nextState,
          () => doAttack("player", nextState),
          () => done("death"),
        )
      );
    } else {
      attacks.push(() =>
        doAttack(
          "player",
          nextState,
        )
      );
    }
  }
  return attack(`monster_atk ${stateHash(state)}`, state, attacks);
}
