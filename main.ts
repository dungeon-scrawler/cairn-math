const PRECISION = Deno.env.has('PRECISION') ? parseInt(Deno.env.get('PRECISION')!) : 2;
const ITERATIONS = Deno.env.has('ITERATIONS') ? parseInt(Deno.env.get('ITERATIONS')!) : 1000000;
const LOG = Deno.env.get('LOG') == '1';

function log(...msgs: any[]) {
    LOG && console.log(...msgs);
}

interface Combatant {
    hp: number;
    ATK: number;
    str: number;
    WIL: number;
    DEX: number;
    RMR: number;
    NAME: string;
    scarred?: true;
    wounded?: true;
}
function combatant(key: string, data: any): Combatant {
    const json = data[key];
    const out = 'proto' in json ? combatant(json.proto, data) : {} as Combatant;
    if ('hp' in json) {
        out.hp = json.hp;
    }
    if ('atk' in json) {
        out.ATK = json.atk;
    }
    if ('str' in json) {
        out.str = json.str;
    }
    if ('wil' in json) {    
        out.WIL = json.wil;
    }
    if ('dex' in json) {
        out.DEX = json.dex;
    }
    if ('rmr' in json) {
        out.RMR = json.rmr;
    }
    out.NAME = key;
    return out;
}

function copy(combatant: Combatant): Combatant {
    return {
        hp: combatant.hp,
        ATK: combatant.ATK,
        str: combatant.str,
        WIL: combatant.WIL,
        DEX: combatant.DEX,
        RMR: combatant.RMR,
        NAME: combatant.NAME,
    }
}

interface State {
    player: Combatant;
    enemy: Combatant;
}
function str(state: State): string {
    return `HP:${state.player.hp}/${state.player.str} | HP:${state.enemy.hp}/${state.enemy.str}`;
}

type Kills = number;

type Deaths = number;
type Routs = number;
type Scars = number;
type Wounds = number;
type Rounds = number;
type Result = readonly [Kills, Deaths, Routs, Scars, Wounds, Rounds];
const KILL: Result = [1,0,0,0,0,0];
const DEATH: Result = [0,1,0,0,0,0];
const ROUT: Result = [0,0,1,0,0,0];
const SCAR: Result = [0,0,0,1,0,0];
const WOUND: Result = [0,0,0,0,1,0];
const BLANK: Result = [0,0,0,0,0,0];
function kills(result: Result): Kills {
    return result[0];
}
function deaths(result: Result): Deaths {
    return result[1];
}
function routs(result: Result): Routs {
    return result[2];
}
function scars(result: Result): Scars {
    return result[3];
}
function wounds(result: Result): Wounds {
    return result[4];
}
function rounds(result: Result): Rounds {
    return result[5];
}
function total(r: Result): number {
    return kills(r)+ deaths(r) + routs(r);
}
function add(a: Result, b: Result): Result {
    return [
        kills(a) + kills(b),
        deaths(a) + deaths(b),
        routs(a) + routs(b),
        scars(a) + scars(b),
        wounds(a) + wounds(b),
        rounds(a) + rounds(b),
    ];
}

type Outcome = (() => Outcome) | Result;
function done(outcome: Outcome): outcome is Result {
    return !(outcome instanceof Function);
}
function save(stat: number, success: Outcome, failure: Outcome): Outcome {
    const roll = Math.ceil(Math.random() * 20);
    const passed = roll <= stat;  
    log(`save ${roll}|${stat}`, stat, passed ? 'pass' : 'fail');
    return passed ? success : failure;
}

function playerTurn(state: State): Outcome {
    ROUNDS++;
    log('player turn', str(state))
    const {player, enemy} = state;
    // generate roll
    const roll = Math.ceil(Math.random() * player.ATK);
    const attack = Math.max(0, roll - enemy.RMR);
    const critical = attack > enemy.hp; // if attack is 0 and enemy hp is 0, it wont matter
    const morale = enemy.hp > 0 && attack >= enemy.hp;
    log('attack', attack);
    const strDamage = attack - enemy.hp;
    
    // apply damage
    enemy.hp = Math.max(0, enemy.hp - attack);
    if (strDamage > 0) {
        enemy.str = Math.max(0, enemy.str - strDamage)
    }
    
    // check outcomes
    if (enemy.str == 0) {
        log('kill');
        return KILL;
    } else if (critical && morale) {
        log('cd+morale')
        return () => save(enemy.str, 
            () => save(enemy.WIL, 
                () => monsterTurn(state), 
                () => log('rout') ?? ROUT
            ), () => log('kill') ?? KILL);
    } else if (critical) {
        log('monster cd');
        return () => save(enemy.str, 
            () => monsterTurn(state), 
            () => log('kill') ?? KILL);
    } else if (morale) {
        log('monster morale');
        return () => save(enemy.WIL, 
            () => monsterTurn(state), 
            () => log('rout') ?? ROUT);
    } else {
        return () => monsterTurn(state);
    }
}

function monsterTurn(state: State): Outcome {
    ROUNDS++;
    log('monster turn', str(state));
    const {player, enemy} = state;
    // generate roll
    const roll = Math.ceil(Math.random() * enemy.ATK)
    const attack = Math.max(0, roll - player.RMR);
    const critical = attack > player.hp;
    log('attack', attack);
    if (attack == player.hp) {
        log('scar!');
        player.scarred = true;
    }
    
    // apply damage
    const strDamage = Math.max(0, attack - player.hp);
    player.hp = Math.max(0, player.hp - attack);
    if (strDamage > 0) {
        player.str = player.str - strDamage;
        !player.wounded && log('wound!');
        player.wounded = true;
    }

    // check outcomes
    if (player.str == 0) {
        log('death');
        return DEATH;
    } else if (critical) {
        log('player cd');
        return () => save(player.str, () => playerTurn(state), () => log('death') ?? DEATH);
    } else {
        return () => playerTurn(state);
    }
}


let ROUNDS = 0;
function simulate(_player: Combatant, _enemy: Combatant): Result {
    ROUNDS = 0;
    const player = copy(_player);
    const enemy = copy(_enemy);
    const state = {player, enemy};
    let outcome: Outcome = () => save(state.player.DEX, () => playerTurn(state), () => monsterTurn(state));
    while (!done(outcome)) {
        outcome = outcome();
    }
    if (deaths(outcome) == 0) {
        if (state.player.scarred) {
            outcome = add(outcome, SCAR);
        }
        if (state.player.wounded) {
            outcome = add(outcome, WOUND);
        }
    }
    return add(outcome, [0,0,0,0,0,ROUNDS]);
}
function asPercent(num: number) {
    return `${(num * 100).toFixed(PRECISION)}%`;
}
function report(result: Result): string {
    const TOTAL = total(result);
    const KILLS = kills(result);
    const ROUTS = routs(result);
    const WINS = KILLS + ROUTS;
    const SCARS = scars(result);
    const WOUNDS = wounds(result);
    const DEATHS = deaths(result);
    const ROUNDS = rounds(result);
    const out: string[] = [];
    out.push(`#####################`);
    out.push(` Wins:      ${asPercent(WINS / TOTAL)}`);
    out.push(`   By Kill: ${asPercent(KILLS / TOTAL)}`);
    out.push(`   By Rout: ${asPercent(ROUTS / TOTAL)}`);
    out.push(` Losses:    ${asPercent(DEATHS / TOTAL)}`);
    out.push(` (Scarred): ${asPercent(SCARS / TOTAL)}`);
    out.push(` (Wounded): ${asPercent(WOUNDS / TOTAL)}`);
    out.push(`#####################`);
    out.push(` Avg. Rounds: ${(ROUNDS / ITERATIONS).toFixed(PRECISION)}`);
    return out.join('\n');
}


if (import.meta.main) {
    // load combatants
    const first = Deno.args[0] ?? 'default';
    const second = Deno.args[1] ?? first;
    const DATA = JSON.parse(Deno.readTextFileSync('data.json'));
    const player = combatant(first, DATA);
    const enemy = combatant(second, DATA);

    // simulate 10 to 100 thousand combats
    let result: Result = BLANK;
    for (let i = 0; i < ITERATIONS; i++) {
        log('run', i+1);
        result = add(result, simulate(player, enemy));
    }
    // render as percents
    console.log(`${player.NAME} (HP: ${player.hp} A${player.RMR} STR: ${player.str} WIL: ${player.WIL} DEX: ${player.DEX} d${player.ATK})`);
    console.log(`${enemy.NAME} (HP: ${enemy.hp} A${enemy.RMR} STR: ${enemy.str} WIL: ${enemy.WIL} DEX: ${enemy.DEX} d${enemy.ATK})`);
    console.log(report(result));
}