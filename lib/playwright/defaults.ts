/** Sample `pnpm exec playwright test` output for the demo textarea. */
export const SAMPLE_PLAYWRIGHT_OUTPUT = `Running 4 tests using 2 workers

  ✓  tests/home.spec.ts:5:3 › Home › loads the hub (1.2s)
  ✘  [chromium] › tests/login.spec.ts:12:5 › Login › submits the form (retry #1) (5.1s)
  ✘  [firefox] › tests/login.spec.ts:12:5 › Login › submits the form (6.4s)
  ✓  tests/checkout.spec.ts:8:1 › Checkout › shows cart total (890ms)


  1) [chromium] › tests/login.spec.ts:12:5 › Login › submits the form ─────────

    Error: expect(locator).toBeVisible()

    Expected: visible
    Received: hidden
    Call log:
      - expect.toBeVisible with timeout 5000ms
      - waiting for locator('button[type=submit]')

       at tests/login.spec.ts:45:12


  2) [firefox] › tests/login.spec.ts:12:5 › Login › submits the form ──────────

    TimeoutError: page.click: Timeout 30000ms exceeded.
    =========================== logs ===========================
    waiting for selector "button[type=submit]"
    ============================================================

       at /workspace/tests/login.spec.ts:38:7


  2 failed
    [chromium] › tests/login.spec.ts:12:5 › Login › submits the form
    [firefox] › tests/login.spec.ts:12:5 › Login › submits the form
  2 passed (12.3s)
`
