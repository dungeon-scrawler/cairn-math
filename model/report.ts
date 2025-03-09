import { ZERO } from "../util/ratio.ts";
import { ONE, type Ratio, ratio } from "../util/ratio.ts";

export interface Report {
  deaths: Readonly<Ratio>;
  kills: Readonly<Ratio>;
  routs: Readonly<Ratio>;
  scarred?: Readonly<Ratio>;
  wounded?: Readonly<Ratio>;
}

export const NULL_REPORT: Report = {
  deaths: ratio(0),
  kills: ratio(0),
  routs: ratio(0),
};
export const DEATH_REPORT: Report = {
  deaths: ratio(1),
  kills: ratio(0),
  routs: ratio(0),
};
export const KILL_REPORT: Report = {
  deaths: ratio(0),
  kills: ratio(1),
  routs: ratio(0),
};
export const ROUT_REPORT: Report = {
  deaths: ratio(0),
  kills: ratio(0),
  routs: ratio(1),
};

export function applyRatio(ratio: Ratio, report: Report): Report {
  if (ratio.equals(ONE)) {
    return report;
  }
  if (ratio.equals(ZERO)) {
    return NULL_REPORT;
  }
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

export function reportEquals(a: Report, b: Report) {
  return a.deaths.equals(b.deaths) && a.routs.equals(b.routs) &&
    a.kills.equals(b.kills);
}
