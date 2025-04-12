import { LOG } from "./env.ts";

export function log(...msgs: any[]) {
  LOG && console.log(...msgs);
}
