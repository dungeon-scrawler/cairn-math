# To run:

> deno run -A ./odd \<player>(:#) \<enemy>

`player` and `enemy` are strings indicating objects in the `data.json` file. If
no `enemy` name is indicated, then it defaults to the value of `player`.
Appending `:` and a number after the `player` value will simulate a combat with
multiple instances of `player` working as a team.

> **Output (Example)**

```
(x 2) weak3 (3 HP, 3 Armor, 3 STR, 10 DEX, 10 WIL, d4)
 vs.
average1 (6 HP, 1 Armor, 6 STR, 10 DEX, 10 WIL, d6)
#####################
 Wins:        96%
   Kills:     47%
   Routs:     49%
   (Scars):   0.36
   (Injured): 0.26
   (Downed):  0.24
   (Deaths):  0.06
 Losses:      4%
#####################
 Avg. Rounds: 3.5
```

Not only will it tell you how often the player wins, it will even tell you if
the win was because of a kill, or a failed morale save (rout)! In addition, the
average number of scarred, injured, downed, and killed players will be
displayed. (These numbers are averages only across outcomes where the players
win; a scar is no good if you died getting it!)

Note that, with the exception of truly fiction-first ideas (like throwing sand
in their eyes!) this simulation follows full, true combat rules: it begins with
the players making a DEX save, and Critical Damage saves and Morale saves are
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
  "detachment"?: <true>
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
