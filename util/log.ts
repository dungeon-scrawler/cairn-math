let indent = '';
const CONTEXT: string[] = [];

const LOG = Deno.env.get('LOG') == '1';
const logger = LOG ? console.log : () => {};

export function log(msg?: string) {
  CONTEXT.length > 0 && logger(CONTEXT.join(' > '))
  msg && logger(msg.split('\n').map((s) => indent + s).join('\n'));
}

export function incontext(context: string) {
  CONTEXT.push(context);
}
export function outcontext() {
  CONTEXT.pop();
}

export function dent() {
  indent += '.';
  
}
export function dedent() {
  indent = indent.slice(1);
}