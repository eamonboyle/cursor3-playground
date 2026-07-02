/** Sample `git stash list` output for the demo textarea. */
export const SAMPLE_STASH_LIST = `stash@{0}: WIP on cursor/cursor-testing-utility-8f4f: a1b2c3d Add git stash lab parser
stash@{1}: On main: wip before switching branches
stash@{2}: untracked files on main: e4f5g6h Save draft README edits
stash@{3}: autostash: merge conflict cleanup
`

/** Sample `git stash show --name-status stash@{0}` output. */
export const SAMPLE_STASH_SHOW = `M	lib/stash/parse.ts
A	lib/stash/types.ts
A	lib/stash/defaults.ts
A	lib/stash/parse.test.ts
A	components/stash/stash-app.tsx
A	app/stash/page.tsx
M	lib/playground/demos.ts
M	README.md
`
