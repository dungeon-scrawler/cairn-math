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
export function entityFromJson(key: string, DATA: any): Entity {
  const json = DATA[key];
  const base: Entity = "proto" in json
    ? entityFromJson(json["proto"], DATA)
    : {} as Entity;
  if ("hp" in json) {
    base.hp = json["hp"];
  }
  if ("str" in json) {
    base.str = json["str"];
    base.MAX_STR = base.str;
  }
  if ("dex" in json) {
    base.DEX = json["dex"];
  }
  if ("wil" in json) {
    base.WIL = json["wil"];
  }
  if ("atk" in json) {
    base.ATK = json["atk"];
  }
  if ("rmr" in json) {
    base.RMR = json["rmr"];
  }
  base.NAME = key;
  return base;
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
