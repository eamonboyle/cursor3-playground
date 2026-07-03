/** Sample `git blame -l lib/todo/parse.ts` output for the demo textarea. */
export const SAMPLE_BLAME_OUTPUT = `^abc123def4567890abcdef1234567890abcdef (Not Committed Yet 2026-07-01 09:14:22 -0700 1) import type { TodoMarker, TodoParseResult, TodoTag } from "./types"
deadbeef1234567890abcdef1234567890abcdef (Ada Lovelace 2026-03-10 11:02:15 -0800 2)
cafebabe1234567890abcdef1234567890abcdef (Ada Lovelace 2026-03-10 11:02:15 -0800 3) export const TODO_TAGS: readonly TodoTag[] = [
cafebabe1234567890abcdef1234567890abcdef (Ada Lovelace 2026-03-10 11:02:15 -0800 4)   "TODO",
cafebabe1234567890abcdef1234567890abcdef (Ada Lovelace 2026-03-10 11:02:15 -0800 5)   "FIXME",
feedface1234567890abcdef1234567890abcdef (Grace Hopper 2026-05-20 16:44:03 +0000 6)   "HACK",
feedface1234567890abcdef1234567890abcdef (Grace Hopper 2026-05-20 16:44:03 +0000 7)   "XXX",
feedface1234567890abcdef1234567890abcdef (Grace Hopper 2026-05-20 16:44:03 +0000 8)   "BUG",
deadbeef1234567890abcdef1234567890abcdef (Ada Lovelace 2026-03-10 11:02:15 -0800 9) ] as const
baddcafe1234567890abcdef1234567890abcdef (Alan Turing 2026-06-02 08:30:00 +0100 10)
baddcafe1234567890abcdef1234567890abcdef (Alan Turing 2026-06-02 08:30:00 +0100 11) const TAG_IN_LINE_RE =
baddcafe1234567890abcdef1234567890abcdef (Alan Turing 2026-06-02 08:30:00 +0100 12)   /\\b(TODO|FIXME|HACK|XXX|BUG)\\b\\s*:?\\s*-?\\s*(.*)$/i
`

export const SAMPLE_BLAME_FILEPATH = "lib/todo/parse.ts"
