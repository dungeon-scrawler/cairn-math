const PRECISION = Deno.env.has("PRECISION")
    ? parseInt(Deno.env.get("PRECISION")!)
    : 0;
const ITERATIONS = Deno.env.has("ITERATIONS")
    ? parseInt(Deno.env.get("ITERATIONS")!)
    : 1000000;
const LOG = Deno.env.get("LOG") == "1";

function log(...msgs: any[]) {
    LOG && console.log(...msgs);
}

interface Combatant {
    hp: number;
    ATK: number; // can be impaired or enhanced; but at this point only before the combat
    str: number;
    readonly WIL: number;
    readonly DEX: number;
    readonly RMR: number;
    readonly NAME: string;
    readonly detachment?: true;
    scarred?: true;
    wounded?: true;
    down?: true;
}

function combatant(key: string, data: any): Combatant {
    if (!(key in data)) {
        throw Error(`Key ${key} not found.`);
    }
    const json = data[key];
    const out: any = "proto" in json ? combatant(json.proto, data) : {};
    if ("hp" in json) {
        out.hp = json.hp;
    }
    if ("atk" in json) {
        out.ATK = json.atk;
    }
    if ("str" in json) {
        out.str = json.str;
    }
    if ("wil" in json) {
        out.WIL = json.wil;
    }
    if ("dex" in json) {
        out.DEX = json.dex;
    }
    if ("rmr" in json) {
        out.RMR = json.rmr;
    }
    if ("detachment" in json) {
        out.detachment = true;
    }
    out.NAME = key;
    return out as Combatant;
}
function combatants(key: string, data: any): Combatant[] {
    const [name, countStr] = key.split(":");
    const count = countStr ? parseInt(countStr) : 1;
    const out: Combatant[] = [];
    const template = combatant(name, data);
    for (let i = 0; i < count; i++) {
        out.push({ ...template });
    }
    return out;
}
function enhance(combatant: Combatant): void {
    combatant.ATK = 12;
}
function impair(combatant: Combatant): void {
    combatant.ATK = 4;
}
function applyDetachmentRules(players: Combatant[], enemy: Combatant): void {
    if (players.length == 1) {
        // the current method makes calculating detachments on the player side
        // too obnoxious with multiple players, so for now it's only supported
        // in a 1v1
        const player = players[0];
        if (player.detachment != enemy.detachment) {
            if (player.detachment) {
                impair(enemy);
                enhance(player);
            } else {
                impair(player);
                enhance(enemy);
            }
        }
        return;
    }
    for (const player of players) {
        if (enemy.detachment) {
            impair(player);
            enhance(enemy);
        }
    }
}

interface State {
    players: Combatant[];
    enemy: Combatant;
}

type Kills = number;

type Losses = number;
type Routs = number;
type Scars = number;
type Wounds = number;
type Casualties = number;
type Rounds = number;
type Result = readonly [
    Kills,
    Losses,
    Routs,
    Scars,
    Wounds,
    Casualties,
    Rounds,
];
const KILL: Result = [1, 0, 0, 0, 0, 0, 0];
const LOSS: Result = [0, 1, 0, 0, 0, 0, 0];
const ROUT: Result = [0, 0, 1, 0, 0, 0, 0];
const SCAR: Result = [0, 0, 0, 1, 0, 0, 0];
const WOUND: Result = [0, 0, 0, 0, 1, 0, 0];
const BLANK: Result = [0, 0, 0, 0, 0, 0, 0];
function kills(result: Result): Kills {
    return result[0];
}
function losses(result: Result): Losses {
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
function casualties(result: Result): Casualties {
    return result[5];
}
function rounds(result: Result): Rounds {
    return result[6];
}
function wins(result: Result): number {
    return kills(result) + routs(result);
}
function total(r: Result): number {
    return wins(r) + losses(r);
}
function add(a: Result, b: Result): Result {
    return [
        kills(a) + kills(b),
        losses(a) + losses(b),
        routs(a) + routs(b),
        scars(a) + scars(b),
        wounds(a) + wounds(b),
        casualties(a) + casualties(b),
        rounds(a) + rounds(b),
    ];
}

type Outcome = (() => Outcome) | Result;
function done(outcome: Outcome): outcome is Result {
    return !(outcome instanceof Function);
}

function dexSaves(state: State): Outcome {
    const passed: Combatant[] = [];
    const failed: Combatant[] = [];
    for (const player of state.players) {
        if (Math.ceil(Math.random() * 20) <= player.DEX) {
            passed.push(player);
        } else {
            failed.push(player);
        }
    }
    if (passed.length > 0) {
        // the players who pass their DEX save get to go before the monsters,
        // everyone else goes after
        return () => playerTurn({ players: passed, enemy: state.enemy }, state);
    } else {
        // the monsters go first
        return () => monsterTurn(state);
    }
}

function save(stat: number): boolean {
    const roll = Math.ceil(Math.random() * 20);
    return roll <= stat;
}

function getRoll(combatants: Combatant[]): number {
    // every attacker still standing gets a shot
    return Math.max(
        ...combatants.filter((c) => !c.down).map((c) =>
            Math.ceil(Math.random() * c.ATK)
        ),
    );
}

function playerTurn(state: State, nextState?: State): Outcome {
    if (state.players.every((p) => p.str == 0 || p.down)) {
        return LOSS;
    }

    ROUNDS += 0.5;
    const { players, enemy } = state;
    state = nextState ?? state; // if an overriding nextState is used, we want that from here on out.
    // ASSUMPTION: players in state are a subset of players in nextState

    // generate roll
    const roll = getRoll(players);
    const attack = Math.max(0, roll - enemy.RMR);
    const critical = attack > enemy.hp; // if attack is 0 and enemy hp is 0, it wont matter
    const morale = enemy.hp > 0 && attack >= enemy.hp;
    const strDamage = attack - enemy.hp;

    // apply damage
    enemy.hp = Math.max(0, enemy.hp - attack);
    if (strDamage > 0) {
        enemy.str = Math.max(0, enemy.str - strDamage);
    }

    // check outcomes
    if (enemy.str <= 0 || critical && !save(enemy.str)) {
        return KILL;
    }
    if (morale && !save(enemy.WIL)) {
        return ROUT;
    }
    return () => monsterTurn(state);
}

function monsterTurn(state: State): Outcome {
    ROUNDS += 0.5;
    const { players, enemy } = state;

    const targets = enemy.detachment
        ? players.filter((p) => !p.down)
        : [players.find((p) => !p.down)!];

    for (const target of targets) {
        // generate roll
        const roll = Math.ceil(Math.random() * enemy.ATK);
        const attack = Math.max(0, roll - target.RMR);
        const critical = attack > target.hp;
        if (target.hp > 0 && attack == target.hp) {
            target.scarred = true;
        }

        // apply damage
        const strDamage = Math.max(0, attack - target.hp);
        target.hp = Math.max(0, target.hp - attack);
        if (strDamage > 0) {
            target.str = Math.max(0, target.str - strDamage);
            target.wounded = true;
        }

        // check outcomes (playerTurn will handle actually validating if its a TPK)
        if (target.str <= 0 || critical && !save(target.str)) {
            target.down = true;
        }
    }
    return () => playerTurn(state);
}

let ROUNDS = 0;
function simulate(_players: Combatant[], _enemy: Combatant): Result {
    ROUNDS = 0;
    // make clean copies to not screw up other iterations
    const players = _players.map((p) => ({ ...p }));
    const enemy = { ..._enemy };
    const state = { players, enemy };
    let outcome: Outcome = () => dexSaves(state);
    while (!done(outcome)) {
        outcome = outcome();
    }
    if (losses(outcome) == 0) {
        // we only consider scars and wounds of players who survived, or were at least resuscitated
        if (state.players.some((p) => p.str > 0 && p.scarred)) {
            outcome = add(outcome, SCAR);
        }
        if (state.players.some((p) => p.str > 0 && p.wounded)) {
            outcome = add(outcome, WOUND);
        }
    }
    const casualties = wins(outcome) > 0
        ? state.players.filter((p) => p.down).length
        : 0; // only record casualties when we win
    return add(outcome, [0, 0, 0, 0, 0, casualties, ROUNDS]);
}
function asPercent(num: number, percentSign = true) {
    return `${(num * 100).toFixed(PRECISION)}${percentSign ? "%" : ""}`;
}
function report(result: Result): string {
    const TOTAL = total(result);
    const KILLS = kills(result);
    const ROUTS = routs(result);
    const WINS = KILLS + ROUTS;
    const SCARS = scars(result);
    const WOUNDS = wounds(result);
    const DEATHS = losses(result);
    const CASUALTIES = casualties(result);
    const ROUNDS = rounds(result);
    const out: string[] = [];
    out.push(`#####################`);
    out.push(` Wins:         ${asPercent(WINS / TOTAL)}`);
    out.push(`   By Kill:    ${asPercent(KILLS / TOTAL)}`);
    out.push(`   By Rout:    ${asPercent(ROUTS / TOTAL)}`);
    out.push(`   (Scar):     ${asPercent(SCARS / TOTAL)}`);
    out.push(`   (Wound):    ${asPercent(WOUNDS / TOTAL)}`);
    if (CASUALTIES > 0) {
        out.push(
            `   Avg. Down:  ${(CASUALTIES / WINS).toFixed(2)}`,
        );
    }
    out.push(` Losses:       ${asPercent(DEATHS / TOTAL)}`);
    out.push(`#####################`);
    out.push(` Avg. Rounds:  ${(ROUNDS / ITERATIONS).toFixed(2)}`);
    return out.join("\n");
}

function printResult({ players, enemy }: State, result: Result) {
    // render full report as percents
    console.log(
        `${players[0].NAME}${
            players.length > 1 ? " (x" + players.length + ")" : ""
        } (HP: ${players[0].hp} A${players[0].RMR} STR: ${
            players[0].str
        } WIL: ${players[0].WIL} DEX: ${players[0].DEX} d${players[0].ATK})`,
    );
    console.log(" vs.");
    console.log(
        `${enemy.NAME} (HP: ${enemy.hp} A${enemy.RMR} STR: ${enemy.str} WIL: ${enemy.WIL} DEX: ${enemy.DEX} d${enemy.ATK})`,
    );
    console.log(report(result));
}

if (import.meta.main) {
    // load combatants
    const first = Deno.args[0] ?? "default";
    const second = Deno.args[1] ?? first;
    const DATA = JSON.parse(Deno.readTextFileSync("data.json"));
    const players = combatants(first, DATA);
    const enemy = combatant(second, DATA);

    // check detachments
    applyDetachmentRules(players, enemy);

    // simulate 10 to 100 thousand combats
    let result: Result = BLANK;
    for (let i = 0; i < ITERATIONS; i++) {
        log("run", i + 1);
        result = add(result, simulate(players, enemy));
    }
    printResult({ players, enemy }, result);
}
