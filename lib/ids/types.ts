export type IdFormat = "uuid" | "hex" | "base64url"

export type IdsPersisted = {
  format: IdFormat
  count: number
  /** Raw entropy length in bytes for hex and base64url tokens. */
  entropyBytes: number
  hexUppercase: boolean
}
