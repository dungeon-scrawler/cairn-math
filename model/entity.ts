export interface Entity {
  hp: number;
  str: number;
  NAME: string;
  MAX_STR: number;
  DEX: number;
  WIL: number;
  ATK: number; // attack die
  RMR: number; // armor
}
export function entityFromJson(json: any): Entity {
  return {
    hp: json["hp"],
    str: json["str"],

    NAME: json["name"],
    MAX_STR: json["str"],
    DEX: json["dex"],
    WIL: json["wil"],
    ATK: json["atk"],
    RMR: json["rmr"] ?? 0,
  };
}

export function entityToString(entity: Entity) {
  return `HP ${entity.hp} STR ${entity.str} A${entity.RMR} d${entity.ATK}`;
}
export function entityHash(entity: Entity): string {
  return `${entity.hp},${entity.str}`;
}

export function damageEntity(entity: Entity, dmg: number) {
  const reduced = Math.max(0, dmg - entity.RMR);
  if (reduced == 0) {
    return { ...entity };
  }
  const strReduction = reduced > entity.hp ? reduced - entity.hp : 0;
  return {
    ...entity,
    hp: Math.max(0, entity.hp - reduced),
    str: Math.max(0, entity.str - strReduction),
  };
}
