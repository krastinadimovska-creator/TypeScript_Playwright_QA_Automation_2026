# TypeScript_Playwright_QA_Automation_2026

## Install

Install Node.js with npm, then run these commands from the repository root:

```bash
npm install
npx playwright install
```

## Run tests

```bash
npx playwright test
```

Tests run headlessly by default. To see the browser, run:

```bash
npx playwright test --headed
```

## Lecture 2: Advanced interactions

Open [the examples index](lectures/02-playwright/pages/index.html) directly in a
browser. Each topic has a separate HTML page:

- Native single and multiple dropdowns
- Checkboxes, radio groups, and registration validation
- Tables, row editing, and advanced selectors
- Single and multiple file selection, replacement, and clearing
- Dynamic loading and delayed enabled controls
- A local iframe with an interactive form
- Native alerts, confirmations, and prompts

The examples work offline without a server or sign-in. State resets on reload;
selected files are not uploaded. Use demo data only.

Run only the lecture 2 tests:

```bash
npx playwright test lectures/02-playwright
```

To run only one spec file in headed mode, pass its path:

```bash
npx playwright test lectures/02-playwright/tests/dropdowns.spec.ts --headed
```