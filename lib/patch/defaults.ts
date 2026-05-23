/** Sample unified diff for the patch lab demo. */
export const SAMPLE_UNIFIED_DIFF = `diff --git a/lib/patch/parse.ts b/lib/patch/parse.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/lib/patch/parse.ts
@@ -0,0 +1,8 @@
+import type { PatchParseResult } from "./types"
+
+export function parseUnifiedDiff(text: string): PatchParseResult {
+  const warnings: string[] = []
+  const files = []
+  return { files, summary: { fileCount: 0, additions: 0, deletions: 0, binaryCount: 0 }, warnings }
+}
diff --git a/README.md b/README.md
index 1111111..2222222 100644
--- a/README.md
+++ b/README.md
@@ -48,6 +48,7 @@ Open http://localhost:3000.
 | \`/json\` | Client | JSON validate, format, minify |
+| \`/patch\` | Client | Unified diff stats for PR review |
 | \`/notes\` | Client | Markdown notes |
diff --git a/public/logo.png b/public/logo.png
index 3333333..4444444 100644
Binary files a/public/logo.png and b/public/logo.png differ
`
