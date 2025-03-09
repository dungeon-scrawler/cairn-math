import { ONE, Ratio, ratio, ZERO } from "./util/ratio.ts";
import {
  DEATH_REPORT,
  KILL_REPORT,
  NULL_REPORT,
  Report,
  ROUT_REPORT,
} from "./model/report.ts";
import { State } from "./model/state.ts";

const NO_CACHE = Deno.env.get("NOCACHE") == "1";

let id = 0;
export abstract class Action {
  public static CACHE = new Map<string, Action>();
  public readonly id = id++;
  public abstract kind: string;
  protected children: Action[] = [];
  protected report?: Report = undefined;

  public readonly executor = this.execute();

  private *execute() {
    for (const child of this._execute()) {
      if (!NO_CACHE && Action.CACHE.has(child.kind)) {
        this.children.push(Action.CACHE.get(child.kind)!);
      } else {
        this.children.push(child);
        yield child;
      }
    }
  }
  public abstract _execute(): Generator<Action, void, unknown>;

  public calculate(): void {
    if (!this.report) {
      this.report = this._calculate();
      Action.CACHE.set(this.kind, this);
    }
  }
  public abstract _calculate(): Report;

  public getReport(): Report {
    if (!this.report) {
      throw new Error("Bad move.");
    }
    return this.report;
  }
}

const STUB_ACTION = {} as Action;

export function done(kind: "kill" | "death" | "rout"): Done {
  return new Done(kind);
}
/**
 * Represents a resolution to the combat
 */
class Done extends Action {
  constructor(public readonly kind: "kill" | "death" | "rout") {
    super();
  }

  public override *_execute(): Generator<Action, void, unknown> {}

  public override _calculate(): Report {
    return this.kind == "kill"
      ? KILL_REPORT
      : this.kind == "death"
      ? DEATH_REPORT
      : ROUT_REPORT;
  }
}

export function save(
  ctx: string,
  stat: number,
  pass: () => Action,
  fail: () => Action,
): Save {
  return new Save(ctx, stat, pass, fail);
}
/** */
export class Save extends Action {
  private passRate: Ratio;
  private failRate: Ratio;

  constructor(
    public readonly kind: string,
    stat: number,
    private readonly pass: () => Action,
    private readonly fail: () => Action,
  ) {
    super();
    this.passRate = ratio(stat, 20);
    this.failRate = ratio(20 - stat, 20);
  }

  public override *_execute(): Generator<Action, void, unknown> {
    if (this.passRate !== ZERO) {
      yield this.pass();
    } else {
      this.children.push(STUB_ACTION);
    }
    if (this.failRate !== ZERO) {
      yield this.fail();
    } else {
      this.children.push(STUB_ACTION);
    }
  }

  public override _calculate(): Report {
    const [pass, fail] = this.children;
    const passed = applyRatio(this.passRate, pass);
    const failed = applyRatio(this.failRate, fail);
    return {
      kills: passed.kills.add(failed.kills),
      deaths: passed.deaths.add(failed.deaths),
      routs: passed.routs.add(failed.routs),
    };
  }
}

export function saveSequence(
  ctx: string,
  stat1: number,
  stat2: number,
  pass: () => Action,
  fail1: () => Action,
  fail2: () => Action,
) {
  return new SaveSequence(ctx, stat1, stat2, pass, fail1, fail2);
}
class SaveSequence extends Action {
  private passRate: Ratio;
  private fail1Rate: Ratio;
  private fail2Rate: Ratio;

  constructor(
    public readonly kind: string,
    stat1: number,
    stat2: number,
    private readonly pass: () => Action,
    private readonly fail1: () => Action,
    private readonly fail2: () => Action,
  ) {
    super();
    this.passRate = ratio(stat1, 20).multiply(ratio(stat2, 20));
    this.fail1Rate = ratio(20 - stat1, 20);
    this.fail2Rate = ratio(stat1, 20).multiply(ratio(20 - stat2, 20));
  }

  public override *_execute(): Generator<Action, void, unknown> {
    if (this.passRate.equals(ZERO)) {
      this.children.push(STUB_ACTION);
    } else {
      yield this.pass();
    }
    if (this.fail1Rate.equals(ZERO)) {
      this.children.push(STUB_ACTION);
    } else {
      yield this.fail1();
    }
    if (this.fail2Rate.equals(ZERO)) {
      this.children.push(STUB_ACTION);
    } else {
      yield this.fail2();
    }
  }
  public override _calculate(): Report {
    const [pass, fail1, fail2] = this.children;
    const passed = applyRatio(this.passRate, pass);
    const failed1 = applyRatio(this.fail1Rate, fail1);
    const failed2 = applyRatio(this.fail2Rate, fail2);
    return [passed, failed1, failed2].reduce((prev: Report, curr: Report) => ({
      kills: prev.kills.add(curr.kills),
      deaths: prev.deaths.add(curr.deaths),
      routs: prev.routs.add(curr.routs),
    }));
  }
}

export function attack(
  ctx: string,
  state: State,
  attacks: (() => Action)[],
): Attack {
  return new Attack(ctx, state, attacks);
}
/** */
export class Attack extends Action {
  constructor(
    public readonly kind: string,
    public readonly state: State,
    private readonly attacks: (() => Action)[],
  ) {
    super();
  }

  public override *_execute(): Generator<Action, void, unknown> {
    for (const attack of this.attacks) {
      yield attack();
    }
  }

  public override _calculate(): Report {
    const reports = this.children.map((c) =>
      applyRatio(ratio(1, this.attacks.length), c)
    );
    return reports.reduce((prev: Report, curr: Report) => ({
      deaths: prev.deaths.add(curr.deaths),
      routs: prev.routs.add(curr.routs),
      kills: prev.kills.add(curr.kills),
    }));
  }

  public setReport(report: Report): void {
    this.report = report;
  }
}

export function applyRatio(ratio: Ratio, action: Action): Report {
  if (ratio.equals(ONE)) {
    return action.getReport();
  }
  if (ratio.equals(ZERO)) {
    return NULL_REPORT;
  }
  const report = action.getReport();
  const out: Report = {
    deaths: report.deaths.multiply(ratio),
    kills: report.kills.multiply(ratio),
    routs: report.routs.multiply(ratio),
  };
  if (report.scarred) {
    out.scarred = report.scarred.multiply(ratio);
  }
  if (report.wounded) {
    out.wounded = report.wounded.multiply(ratio);
  }
  return out;
}
