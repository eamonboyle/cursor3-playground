/** Sample `git status --porcelain` output for the demo textarea. */
export const SAMPLE_GIT_STATUS_PORCELAIN = `## cursor/cursor-testing-utility-26e2
 M README.md
M  lib/playground/demos.ts
MM components/todo/todo-app.tsx
A  app/git-status/page.tsx
D  lib/legacy/old-helper.ts
R  lib/utils/format.ts -> lib/utils/format-path.ts
?? app/git-status/
?? components/git-status/
?? lib/git-status/
UU lib/conflict/parse.ts
!! node_modules/
`

/** Sample human-readable `git status` for format detection demos. */
export const SAMPLE_GIT_STATUS_HUMAN = `On branch cursor/cursor-testing-utility-26e2
Your branch is up to date with 'origin/cursor/cursor-testing-utility-26e2'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	new file:   app/git-status/page.tsx
	modified:   lib/playground/demos.ts

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
	modified:   README.md
	modified:   components/todo/todo-app.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	components/git-status/
	lib/git-status/

`
