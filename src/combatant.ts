export interface RawCombatant {
  readonly hp: number;
  readonly atk: number; // can be impaired or enhanced; but at this point only before the combat
  readonly str: number;
  readonly wil: number;
  readonly dex: number;
  readonly rmr: number;
  readonly detachment?: true;
}

export abstract class Combatant {
  public readonly NAME: string;
  public readonly HP: number;
  protected currHp: number;
  public readonly ATK: number;
  private currAtk: number;
  public readonly STR: number;
  protected currStr: number;
  public readonly DEX: number;
  public readonly WIL: number;
  public readonly RMR: number;
  public readonly detachment?: true;
  protected _down: boolean = false;

  constructor(name: string, c: RawCombatant) {
    this.NAME = name;
    this.HP = c.hp ?? 6;
    this.currHp = c.hp ?? 6;
    this.ATK = c.atk ?? 6;
    this.currAtk = c.atk ?? 6;
    this.STR = c.str ?? 10;
    this.currStr = c.str ?? 10;
    this.DEX = c.dex ?? 10;
    this.WIL = c.wil ?? 10;
    this.RMR = c.rmr ?? 0;
  }

  public toString(): string {
    return `${this.NAME} (${this.currHp} HP, ${
      this.RMR > 0 ? this.RMR + " Armor," : ""
    } ${this.currStr} STR, ${this.DEX} DEX, ${this.WIL} WIL, d${this.ATK})`;
  }

  public heal(): void {
    this.currHp = this.HP;
    this.currStr = this.STR;
    this._down = false;
  }

  public impair(): void {
    this.currAtk = 4;
  }

  public restoreAtk(): void {
    this.currAtk = this.ATK;
  }

  public enhance(): void {
    this.currAtk = 12;
  }

  public attack(): number {
    return Math.ceil(Math.random() * this.currAtk);
  }

  public damage(atk: number): void {
    const realDamage = Math.max(0, atk - this.RMR);

    const hpDamage = Math.min(realDamage, this.currHp);
    const strDamage = realDamage > this.currHp
      ? Math.min(realDamage - this.currHp, this.currStr)
      : 0;

    const hpBefore = this.currHp;
    const strBefore = this.currStr;
    this.currHp = this.currHp - hpDamage;
    this.currStr = this.currStr - strDamage;

    if (this.currStr > 0) {
      this.feelDamage(hpBefore, strBefore);
    }
  }

  protected abstract feelDamage(
    hpBefore: number,
    strBefore: number,
  ): void;

  public dead(): boolean {
    return this.currStr == 0;
  }

  public downed(): boolean {
    return this._down;
  }

  public active(): boolean {
    return !this.dead() && !this.downed();
  }

  public save(stat: "str" | "dex" | "wil"): boolean {
    const roll = Math.ceil(Math.random() * 20);
    switch (stat) {
      case "str":
        return roll <= this.currStr;
      case "dex":
        return roll <= this.DEX;
      case "wil":
        return roll <= this.WIL;
    }
  }
}

export class Player extends Combatant {
  private _scarred: false | number = false;

  protected override feelDamage(
    hpBefore: number,
    strBefore: number,
  ): void {
    if (this.currHp == 0 && hpBefore > 0 && this.currStr == strBefore) {
      this._scarred = hpBefore;
    }
    if (this.currStr < strBefore && !this.save("str")) {
      this._down = true;
    }
  }

  public scarred(): boolean {
    return this._scarred !== false;
  }

  public injured(): boolean {
    return !this.dead() && this.currStr < this.STR;
  }

  public override heal(): void {
    super.heal();
    this._scarred = false;
  }
}

export class Monster extends Combatant {
  private _routed: boolean = false;

  protected override feelDamage(
    hpBefore: number,
    strBefore: number,
  ): void {
    if (hpBefore > 0 && this.currHp == 0 && !this.save("wil")) {
      this._routed = true;
    } else if (strBefore > this.currStr && !this.save("str")) {
      this._down = true;
    }
  }

  public routed(): boolean {
    return this._routed;
  }

  public override dead(): boolean {
    return this.currStr == 0 || this.downed();
  }

  public override heal(): void {
    super.heal();
    this._routed = false;
  }
}

export function _combatant(key: string, data: any): RawCombatant {
  if (!(key in data)) {
    throw Error(`Key ${key} not found.`);
  }
  const json = data[key];
  return "proto" in json
    ? { ..._combatant(json["proto"], data), ...json }
    : json;
}

export function monster(key: string, data: any): Monster {
  const raw = _combatant(key, data);
  return new Monster(key, raw);
}

export function players(key: string, data: any): Player[] {
  const [name, countStr] = key.split(":");
  const count = countStr ? parseInt(countStr) : 1;
  const out: Player[] = [];
  const template = _combatant(name, data);
  for (let i = 0; i < count; i++) {
    out.push(new Player(name, template));
  }
  return out;
}
