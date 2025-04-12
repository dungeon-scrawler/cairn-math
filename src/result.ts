export class Result {
  public static readonly Kills = 0; // monster killed
  public static readonly Losses = 1; // TPK
  public static readonly Routs = 2; // monster routed
  public static readonly Scars = 3; // players scarred
  public static readonly Downed = 4; // players failed CD save
  public static readonly Injured = 5; // players suffered STR loss
  public static readonly Dead = 6; // players killed outright
  public static readonly Rounds = 7; // number of rounds

  private readonly inner: Array<number>;

  constructor(
    kills = 0,
    losses = 0,
    routs = 0,
    scars = 0,
    downed = 0,
    injured = 0,
    dead = 0,
    rounds = 0,
  ) {
    this.inner = [kills, losses, routs, scars, downed, injured, dead, rounds];
  }

  public kills(): number {
    return this.inner[Result.Kills];
  }

  public losses(): number {
    return this.inner[Result.Losses];
  }

  public routs(): number {
    return this.inner[Result.Routs];
  }

  public scars(): number {
    return this.inner[Result.Scars];
  }

  public downed(): number {
    return this.inner[Result.Downed];
  }

  public injured(): number {
    return this.inner[Result.Injured];
  }

  public dead(): number {
    return this.inner[Result.Dead];
  }

  public rounds(): number {
    return this.inner[Result.Rounds];
  }

  public wins(): number {
    return this.kills() + this.routs();
  }

  public total(): number {
    return this.wins() + this.losses();
  }

  public add(other: Result): Result {
    this.inner[Result.Kills] += other.kills();
    this.inner[Result.Losses] += other.losses();
    this.inner[Result.Routs] += other.routs();
    this.inner[Result.Scars] += other.scars();
    this.inner[Result.Downed] += other.downed();
    this.inner[Result.Injured] += other.injured();
    this.inner[Result.Dead] += other.dead();
    this.inner[Result.Rounds] += other.rounds();
    return this;
  }

  public update(kind: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, count: number = 1) {
    this.inner[kind] += count;
  }
}

export const KILL = new Result(1);
export const LOSS = new Result(0, 1);
export const ROUT = new Result(0, 0, 1);
export const SCAR = new Result(0, 0, 0, 1);
