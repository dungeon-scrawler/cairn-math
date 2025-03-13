To run:

> deno run -A ./main.ts \<player> \<monster>

`player` and `monster` are strings indicating objects in the `data.json` file.
If no `monster` name is indicated, then it defaults to the value of `player`.

Feel free to add or edit values in `data.json` to simulate whatever you please!

> **NOTE:** Currently, this simulator can only compute 1v1 combat outcomes, and
> pitting armored foes against armored foes (after a certain threshold of low
> stats) is not working entirely to my satisfaction. (The heuristic approach
> currently employed is still experimental, and not highly trustworthy.)
