# To run:

> deno run -A ./main.ts \<player> \<enemy>

`player` and `enemy` are strings indicating objects in the `data.json` file. If
no `enemy` name is indicated, then it defaults to the value of `player`.

> **Output (Example)**

```
weak (HP: 3 A0 STR: 3 WIL: 10 DEX: 10 d4) 
average (HP: 6 A0 STR: 6 WIL: 10 DEX: 10 d6) 
#####################
 Wins:      10.43%
   By Kill: 6.26%
   By Rout: 4.18%
 Losses:    89.57%
 (Scarred): 4.51%
 (Wounded): 0.83%
#####################
 Avg. Rounds: 2.62
```

Not only will it tell you how often the player wins, it will even tell you if
the win was because of a kill, or a failed morale save (rout)! In addition, the
likelihood of walking away with a Scar or attribute loss is reported.

Note that, with the exception of truly fiction-first ideas (like throwing sand
in their eyes!) this simulation follows full, true combat rules: it begins with
the player making a DEX save, and Critical Damage saves and Morale saves are
considered as usual.

> **How it works:** Thanks to some great advice, this now uses a monte carlo
> method: for any given pair of combatants, the script simulates 1 million
> combats (it usually takes only a couple of seconds), recording the outcome of
> each match. This gives a _remarkably_ close to precise result (because
> statistics)

# Adding data:

Combatants are defined in a simple json format:

```json
"<name>": {
  "hp": <number>,
  "str": <number>,
  "dex": <number>,
  "wil": <number>,
  "atk": <number>, // e.g. for a d6 simply use 6
  "rmr": <number>, // e.g. armor
}
```

In addition, if you simply want to make a minor variation on an existing
combatant, use `proto`:

```json
"<name>": {
  "proto": <other-name>,
  <attributes you want to override>
}
```

Example:

```json
"average_armor1": {
  "proto": "average",
  "rmr": 1
}
```

Feel free to add or edit values in `data.json` to simulate whatever you please!

> **TODO**
>
> - add "detachment" tag to combatant data, and adjust program to correctly
>   account for this
>
> * Allow for multiple combatants (only on one side; simulating multiple
>   attackers on both sides is needlesslly complex, as it simply reduces to some
>   number of 1vX matchups; if we want to figure out a many vs. many combat, we
>   can figure out each matchup individually)
