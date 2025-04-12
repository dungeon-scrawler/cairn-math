export const PRECISION = Deno.env.has("PRECISION")
  ? parseInt(Deno.env.get("PRECISION")!)
  : 0;
export const ITERATIONS = Deno.env.has("ITERATIONS")
  ? parseInt(Deno.env.get("ITERATIONS")!)
  : 1000000;

export const MODE = Deno.env.get("MODE") ?? "full";

export const LOG = Deno.env.get("LOG") == "1";
