import { Report as AltReport } from "../altreport.ts";
import { ratio, ZERO } from "../util/ratio.ts";
import {
  applyRatio,
  DEATH_REPORT,
  KILL_REPORT,
  NULL_REPORT,
  type Report,
  ROUT_REPORT,
} from "./report.ts";

export abstract class Action {
  protected settledAlt?: AltReport;
  constructor(private settled?: Report) {
  }

  public report(): Report {
    if (!this.settled) {
      this.settled = this.calc();
    }
    return this.settled!;
  }

  public altReport(): AltReport {
    if (!this.settledAlt) {
      this.settledAlt = this.calcAlt();
    }
    return this.settledAlt;
  }

  protected abstract calc(): Report;
  protected abstract calcAlt(): AltReport;
}

/**
 * The end of a combat.
 * Either a the monster is killed, or routed, or the player dies.
 */
class Done extends Action {
  constructor(
    kind: "kill" | "rout" | "death",
  ) {
    super(
      kind == "kill"
        ? KILL_REPORT
        : kind == "rout"
        ? ROUT_REPORT
        : DEATH_REPORT,
    );
    this.settledAlt = kind;
  }

  protected override calc(): Report {
    throw Error("impossible");
  }
  protected override calcAlt(): AltReport {
    throw Error("Impossible");
  }
}
export function done(kind: "kill" | "rout" | "death") {
  return new Done(kind);
}

/**
 * An entity must make a save
 */
export class Save extends Action {
  constructor(
    private ctx: string,
    private stat: number,
    private pass: () => Action,
    private fail: () => Action,
  ) {
    super();
  }

  protected override calc(): Report {
    const pass = ratio(this.stat, 20);
    const fail = ratio(20 - this.stat, 20);
    const passed = !pass.equals(ZERO)
      ? applyRatio(pass, this.pass().report())
      : NULL_REPORT;
    const failed = !fail.equals(ZERO)
      ? applyRatio(fail, this.fail().report())
      : NULL_REPORT;
    return {
      deaths: passed.deaths.add(failed.deaths),
      routs: passed.routs.add(failed.routs),
      kills: passed.kills.add(failed.kills),
    };
  }

  protected override calcAlt(): AltReport {
    const pass = ratio(this.stat, 20);
    const fail = ratio(20 - this.stat, 20);
    const passed = this.pass();
    const failed = this.fail();
    return [[this.ctx + " pass", pass, passed.altReport()], [
      this.ctx + " fail",
      fail,
      failed.altReport(),
    ]];
  }
}
export function save(
  ctx: string,
  stat: number,
  pass: () => Action,
  fail: () => Action,
) {
  return new Save(ctx, stat, pass, fail);
}

/** */
class Attack extends Action {
  constructor(private ctx: string, private attacks: (() => Action)[]) {
    super();
  }

  protected override calc(): Report {
    const actions = this.attacks.map(
      (a) =>
        applyRatio(
          ratio(1, this.attacks.length),
          a().report(),
        ),
    );
    return actions.reduce((prev: Report, curr: Report) => ({
      deaths: prev.deaths.add(curr.deaths),
      routs: prev.routs.add(curr.routs),
      kills: prev.kills.add(curr.kills),
    }));
  }

  protected override calcAlt(): AltReport {
    return this.attacks.map((
      a,
    ) => [
      this.ctx,
      ratio(1, this.attacks.length),
      a().altReport(),
    ]) as AltReport;
  }
}

export function attack(ctx: string, attacks: (() => Action)[]): Attack {
  return new Attack(ctx, attacks);
}
