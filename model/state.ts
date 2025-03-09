import {
  damageEntity,
  type Entity,
  entityFromJson,
  entityHash,
} from "./entity.ts";

export interface State {
  player: Entity;
  monster: Entity;
}
export function stateFromJson(player: any, monster: any) {
  return {
    player: entityFromJson(player),
    monster: entityFromJson(monster),
  };
}
export function stateHash(state: State): string {
  return `${entityHash(state.player)}:${entityHash(state.monster)}`;
}

export function applyDamage(
  state: State,
  target: "player" | "monster",
  dmg: number,
): State {
  return target == "player"
    ? {
      ...state,
      player: damageEntity(state.player, dmg),
    }
    : {
      ...state,
      monster: damageEntity(state.monster, dmg),
    };
}

export function wasScarred(before: State, after: State): boolean {
  return before.player.hp > 0 &&
    after.player.hp == 0 &&
    before.player.str == after.player.str;
}

export function wasWounded(before: State, after: State): boolean {
  return before.player.str == before.player.MAX_STR &&
    after.player.str < after.player.MAX_STR;
}
