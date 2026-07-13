/** Sample `git range-diff @{u} @{1} @` output — added, equal, modified, and removed commits. */
export const SAMPLE_GIT_RANGE_DIFF = `-:  ------- > 1:  0ddba11 Prepare for the inevitable!
1:  c0debee = 2:  cab005e Add a helpful message at the start
2:  f00dba1 ! 3:  decafe1 Describe a bug
    @@ -1,3 +1,3 @@
     Author: A U Thor <author@example.com>

    -TODO: Describe a bug
    +Describe a bug
    @@ -324,5 +324,6
      This is expected.

    -+What is unexpected is that it will also crash.
    ++Unexpectedly, it also crashes. This is a bug, and the jury is
    ++still out there how to fix it best. See ticket #314 for details.

      Contact
3:  bedead < -:  ------- TO-UNDO`

/** Shorter sample with only equal and added rows — no patch bodies. */
export const SAMPLE_GIT_RANGE_DIFF_SHORT = `1:  a1b2c3d = 1:  e4f5a6b feat: add session refresh hook
2:  c7d8e9f = 2:  1a2b3c4 fix: guard null user in profile route
-:  ------- > 3:  9f8e7d6 docs: update README quick start section`
