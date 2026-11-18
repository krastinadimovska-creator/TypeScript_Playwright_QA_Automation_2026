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
- Choosing role, CSS, and XPath locators for different situations

The [locator demo](lectures/02-playwright/pages/locators.html) is a small bilingual
shop. Its [commented tests](lectures/02-playwright/tests/locators.spec.ts) show
that no single strategy wins everywhere; each fits a particular situation:

| Situation | Good fit |
|---|---|
| Meaningful, hand-written ID | CSS (`#offers`) |
| Translated UI, where every text changes | CSS on `data-*` attributes or `data-testid` |
| Generated class names (CSS-in-JS) and no ID | `getByRole` with the visible text |
| Data or structural query without a role | CSS combinators and attributes |
| Only the text identifies an element and you need its relatives | XPath `ancestor::`, or Playwright `filter()` |
| Element is in the DOM but hidden until needed | Any strategy, plus an explicit visibility assertion |

CSS and XPath selectors also work outside Playwright (DevTools, Selenium, other
tools), while `getByRole` and `getByLabel` are Playwright-specific. The other
Lecture 2 specs list CSS and XPath alternatives next to their role and label locators.

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

## Lecture 3: Page Object Model

Read the [Lecture 3 notes](lectures/03-pom/README.md) for the Page Object Model,
refactoring guidance, best practices, exercises, and fictional account credentials.
The [sign-in page](lectures/03-pom/pages/login.html) and account page form a simple
customer-facing application; teaching material stays in the notes.
The [tests](lectures/03-pom/tests/login.spec.ts) demonstrate typed page objects,
page transitions, and assertions in test files. Run them with:

```bash
npx playwright test lectures/03-pom
```

### Lecture 3 homework

Use the [homework pages](lectures/03-pom/homework/pages/) to create `LoginPage`,
`OrdersPage`, and `AccountPage` in `lectures/03-pom/homework/page-objects/`.
Implement the 7 scenarios in
[homework.spec.ts](lectures/03-pom/homework/tests/homework.spec.ts), replacing
each `test.fixme` with a working test. Demo credentials are shown on the login page.
Run the homework with:

```bash
npx playwright test lectures/03-pom/homework
```
