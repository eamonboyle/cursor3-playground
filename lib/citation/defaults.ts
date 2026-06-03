/** Sample ripgrep line for the scan textarea. */
export const SAMPLE_CITATION_SCAN = `lib/patch/parse.ts:76:export function parseUnifiedDiff(text: string): PatchParseResult {
lib/patch/parse.ts:182:export function formatPatchSummaryMarkdown(result: PatchParseResult): string {
components/patch/patch-app.tsx:50:export function PatchApp() {
`

/** Default builder fields. */
export const SAMPLE_CITATION_BUILD = {
  filepath: "lib/patch/parse.ts",
  startLine: 76,
  endLine: 90,
  code: `export function parseUnifiedDiff(text: string): PatchParseResult {
  const warnings: string[] = []
  // ... existing code ...
}`,
}
