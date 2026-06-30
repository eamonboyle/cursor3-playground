/** Sample `git diff --stat main...HEAD` output for the demo textarea. */
export const SAMPLE_DIFF_STAT = ` lib/playground/demos.ts        |  8 ++++++++
 lib/stat/parse.ts              | 142 ++++++++++++++++++++++++++++++++++++++++
 lib/stat/parse.test.ts         |  48 ++++++++++++++
 lib/stat/types.ts              |  22 +++++++
 lib/stat/defaults.ts           |  18 ++++++
 components/stat/stat-app.tsx   | 210 ++++++++++++++++++++++++++++++++++++++++++++++
 app/stat/page.tsx              |  12 +++
 README.md                      |  1 +
 package.json                   |  0
 public/logo.png                | Bin 0 -> 48291 bytes
 9 files changed, 451 insertions(+), 2 deletions(-)
`

/** Sample `git diff --numstat` output. */
export const SAMPLE_DIFF_NUMSTAT = `8	0	lib/playground/demos.ts
142	0	lib/stat/parse.ts
48	0	lib/stat/parse.test.ts
22	0	lib/stat/types.ts
18	0	lib/stat/defaults.ts
210	0	components/stat/stat-app.tsx
12	0	app/stat/page.tsx
1	0	README.md
0	0	package.json
-	-	public/logo.png
`
