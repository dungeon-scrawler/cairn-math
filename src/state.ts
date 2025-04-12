import { Monster, Player } from "./combatant.ts";

export interface State {
  players: Player[];
  monster: Monster;
}

export function toString(state: State): string {
  const { players, monster } = state;
  return [
    (players.length > 1 ? `(x ${players.length}) ` : "") +
    players[0].toString(),
    " vs.",
    monster.toString(),
  ].join("\n");
}
