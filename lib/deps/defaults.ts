import type { DepsPersisted } from "./types"

/** Minimal base package.json for the demo. */
export const SAMPLE_PACKAGE_BASE = `{
  "name": "cursor-playground",
  "version": "0.0.1",
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "date-fns": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "eslint": "^9.39.0",
    "prettier": "^3.8.0"
  }
}
`

/** Head package.json with upgrades, additions, and removals. */
export const SAMPLE_PACKAGE_HEAD = `{
  "name": "cursor-playground",
  "version": "0.0.2",
  "dependencies": {
    "next": "^16.2.7",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "eslint": "^9.39.4",
    "@types/node": "^25.9.2"
  }
}
`

export function defaultDepsPersisted(): DepsPersisted {
  return {
    baseText: SAMPLE_PACKAGE_BASE,
    headText: SAMPLE_PACKAGE_HEAD,
    sections: [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ],
  }
}
