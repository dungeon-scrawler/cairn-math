To run:

> deno run -A ./main.ts \<player> \<monster>

`player` and `monster` are strings indicating objects in the `data.json` file.
If no `monster` name is indicated, then it defaults to the value of `player`.

Feel free to add or edit values in `data.json` to simulate whatever you please!

> **NOTE:** Currently, this simulator can only compute 1v1 combat outcomes, and
> pitting armored foes against armored foes (after a certain threshold of low
> stats) is not working entirely to my satisfaction. (The heuristic approach
> currently employed is still experimental, and not highly trustworthy.)

> **TODO** I'd love to make this output the likelihood of walking away (alive)
> with a scar, or the likelihood of winning with attribute loss. I'm not yet
> sure if that will jive with the current memoization, or if it will
> significantly reduce the frequency of cache hits.
