/** Sample `git ls-remote origin` output with branches, tags, and pull refs. */
export const SAMPLE_GIT_LS_REMOTE = `a1b2c3d4e5f6789012345678abcdef0123456789	HEAD
e4f5a6b4e5f6789012345678abcdef0123456789	refs/heads/main
f3e4d5c4e5f6789012345678abcdef0123456789	refs/heads/cursor/ls-remote-lab
c7d8e9f4e5f6789012345678abcdef0123456789	refs/heads/feature/auth
d8e9f0a1b2c3d4e5f6789012345678abcdef01234567	refs/tags/v0.9.0
e9f0a1b2c3d4e5f6789012345678abcdef012345678	refs/tags/v1.0.0
f0a1b2c3d4e5f6789012345678abcdef0123456789a	refs/tags/v1.0.0^{}
a0b1c2d3e4f5a6789012345678abcdef0123456789ab	refs/tags/v0.9.0^{}
b1c2d3e4f5a6789012345678abcdef0123456789ab	refs/pull/42/head
`

/** Sample `git ls-remote --heads origin` output (branches only). */
export const SAMPLE_GIT_LS_REMOTE_HEADS = `e4f5a6b4e5f6789012345678abcdef0123456789	refs/heads/main
f3e4d5c4e5f6789012345678abcdef0123456789	refs/heads/cursor/ls-remote-lab
c7d8e9f4e5f6789012345678abcdef0123456789	refs/heads/feature/auth
`
