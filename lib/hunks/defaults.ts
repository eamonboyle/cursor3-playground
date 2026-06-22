/** Sample unified diff with multiple hunks for the demo textarea. */
export const SAMPLE_HUNKS_DIFF = `diff --git a/lib/hunks/parse.ts b/lib/hunks/parse.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/lib/hunks/parse.ts
@@ -0,0 +1,12 @@
+import type { DiffHunk, HunksParseResult } from "./types"
+
+export function parseDiffHunks(text: string): HunksParseResult {
+  const warnings: string[] = []
+  const hunks: DiffHunk[] = []
+  return {
+    hunks,
+    summary: { fileCount: 0, hunkCount: 0, additions: 0, deletions: 0, binaryCount: 0 },
+    warnings,
+  }
+}
diff --git a/components/hunks/hunks-app.tsx b/components/hunks/hunks-app.tsx
index 1111111..2222222 100644
--- a/components/hunks/hunks-app.tsx
+++ b/components/hunks/hunks-app.tsx
@@ -40,6 +40,14 @@ export function HunksApp() {
   const result = React.useMemo(() => parseDiffHunks(input), [input])
 
+  async function copyText(label: string, text: string) {
+    if (!text.trim()) {
+      toast.error("Nothing to copy yet.")
+      return
+    }
+    await navigator.clipboard.writeText(text)
+    toast.success(label)
+  }
+
   return (
     <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 p-6">
@@ -88,12 +96,20 @@ export function HunksApp() {
         </CardContent>
       </Card>
 
+      <Card>
+        <CardHeader>
+          <CardTitle className="text-base">Hunks</CardTitle>
+        </CardHeader>
+        <CardContent>
+          <p className="text-muted-foreground text-sm">Hunk table goes here.</p>
+        </CardContent>
+      </Card>
     </div>
   )
 }
diff --git a/public/logo.png b/public/logo.png
index 3333333..4444444 100644
Binary files a/public/logo.png and b/public/logo.png differ
`
