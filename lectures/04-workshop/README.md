# Lecture 4 Workshop: POM vs Functional Helpers vs Fixtures vs Factory Functions

One small app, the **same 5 test scenarios**, written with four patterns and then with
all of them combined. Open the files side by side and compare.

**Read [PATTERNS.md](PATTERNS.md)** for how each pattern works, its pros and cons, a full
comparison table, and how the patterns combine.

## Application

Open [the sign-in page](pages/login.html) directly in a browser. **TaskBoard** has a
sign-in page and a [task list](pages/tasks.html) where you can add, complete, and
delete tasks.

- Username: `alex`
- Password: `secret123`

Data lives in `sessionStorage`, so every test (a new browser context) starts clean.
The client-side credentials and session flag are for demonstration only, not real authentication.

```text
04-workshop/
  pages/
    login.html
    tasks.html
  patterns/
    1-page-object-model/
      page-objects/LoginPage.ts, TasksPage.ts
      tests/tasks.spec.ts
      pom-flow.html          <- animated walkthrough of classes, objects and `this`
    2-functional-helpers/
      helpers/auth.ts, tasks.ts
      tests/tasks.spec.ts
      helpers-flow.html      <- animated walkthrough of stateless helper calls
    3-fixtures/
      fixtures/index.ts      <- the entry point specs import (mergeTests)
      fixtures/app.fixture.ts, data.fixture.ts, auth.fixture.ts, errors.fixture.ts
      tests/tasks.spec.ts
      fixture-flow.html      <- animated walkthrough of the fixture lifecycle
    4-factory-functions/
      factories/taskBoardActions.ts, testData.ts
      tests/tasks.spec.ts
      factory-flow.html      <- animated walkthrough of factories and closures
    5-combined/              <- all patterns together (reuses folders 1-4)
      fixtures/combined.fixture.ts
      tests/tasks.spec.ts
      combined-flow.html     <- animated walkthrough: fixtures + POM + factories + helpers
  workshop-task/           <- hands-on exercise: write page objects for 4 new pages
    pages/profile.html, registration.html, attendees.html, settings.html
    page-objects/          <- students' page objects
    tests/pages.smoke.spec.ts
```

Every spec covers the same scenarios:

1. signs in with valid credentials
2. shows an error for a wrong password
3. adds a task
4. completes a task
5. deletes a task

## Run

```bash
npx playwright test lectures/04-workshop
npx playwright test lectures/04-workshop/patterns/1-page-object-model
npx playwright test lectures/04-workshop/patterns/2-functional-helpers
npx playwright test lectures/04-workshop/patterns/3-fixtures
npx playwright test lectures/04-workshop/patterns/4-factory-functions
npx playwright test lectures/04-workshop/patterns/5-combined
npx playwright test lectures/04-workshop/workshop-task
```

Every command runs in **Google Chrome and Firefox**. To run a single browser, add `--project`:

```bash
npx playwright test lectures/04-workshop --project=firefox
npx playwright test lectures/04-workshop/patterns/3-fixtures --project=chrome
npm run test:workshop          # all patterns, both browsers
```

## Cross-browser runs

The browsers are configured once, as **projects** in the root
[playwright.config.ts](../../playwright.config.ts). Playwright runs every test once per
project, and the HTML report labels each result `[chrome]` or `[firefox]`.
The `chrome` project sets `channel: 'chrome'`, so it uses the installed Google Chrome
rather than Playwright's bundled Chromium (install it with `npx playwright install chrome`).

No pattern contains any browser-specific code. Each one gets the browser through the
built-in `page` fixture, which Playwright creates from the current project:

| Pattern | Where the browser comes in |
|---|---|
| 1. Page Object Model | `new LoginPage(page)`: the class wraps whatever `page` it receives. |
| 2. Functional helpers | `addTask(page, ...)`: the page is passed in each call. |
| 3. Fixtures | `signedInPage` depends on `page`, so it is built in the project's browser. |
| 4. Factory functions | `createTaskActions(page)`: the closure captures that browser's page. |
| 5. Combined | Fixtures create the page and hand it to a page object, a factory, and helpers. |

Professional rules that keep a suite cross-browser:

- **Choose browsers in config, not in tests.** Page objects, helpers, fixtures, and
  factories should never call `chromium.launch()` or check the browser name.
- **Use web-first locators and assertions** (`getByRole`, `toHaveText`). They wait
  automatically and behave the same in every engine; fixed `waitForTimeout` delays do not.
- **Keep tests isolated.** Each test gets a new browser context (its own storage), so tests
  in different browsers and workers never share state.
- **When an engine really differs, say so explicitly in the test**, for example
  `test.skip(browserName === 'firefox', 'reason')` using the built-in `browserName` fixture.
  None of the workshop tests need this.
- **On CI**, `forbidOnly` fails the run if a `test.only` was committed, and failed tests are
  retried once or twice with a trace recorded (`trace: 'on-first-retry'`).

## What to notice in the code

**1. Page Object Model**: [LoginPage](patterns/1-page-object-model/page-objects/LoginPage.ts),
[TasksPage](patterns/1-page-object-model/page-objects/TasksPage.ts)

- Locators are defined once in the constructor; actions are methods.
- Form controls used only for actions are `private readonly`; tests see only `readonly`
  assertion locators such as the error, heading, and counter.
- `task(title)` returns a locator matched by the checkbox's exact accessible name.
  The delete test verifies that deleting **Buy milk** leaves **Buy milk and eggs** intact.
- `beforeEach` creates the objects by hand. Each test signs in and creates its tasks
  **through the UI**, even when it only tests deleting.
- The delete test keeps a similarly named task (`Buy milk and eggs`) to show why task
  locators should match exact accessible names.
- **Visual walkthrough:** open [pom-flow.html](patterns/1-page-object-model/pom-flow.html) in a
  browser. It animates `new`, the constructor, the fields on `this`, and how methods reach the
  page. Three flows: creating the objects, public vs private, and methods and `this` (with
  the detached-method pitfall).

**2. Functional helpers**: [auth.ts](patterns/2-functional-helpers/helpers/auth.ts),
[tasks.ts](patterns/2-functional-helpers/helpers/tasks.ts)

- No classes, `new`, or `this`. Every function receives `page`.
- Small functions compose: `addTasks` simply calls `addTask` in a loop.
- Task matching uses the checkbox's exact accessible name, not a substring of the row text.
- Setup is still manual: the same UI login as POM.
- **Visual walkthrough:** open [helpers-flow.html](patterns/2-functional-helpers/helpers-flow.html)
  in a browser. Its call-stack panel shows that a helper's arguments exist only while it runs.
  Three flows: signing in, helpers calling helpers, and the trade-offs compared with POM.

**3. Fixtures**: [fixtures/](patterns/3-fixtures/fixtures/)

- Fixtures are split by job, one `*.fixture.ts` file each:

  | File | Fixture | Kind |
  |---|---|---|
  | [app.fixture.ts](patterns/3-fixtures/fixtures/app.fixture.ts) | `appUrls` | **worker**: built once per worker process |
  | [data.fixture.ts](patterns/3-fixtures/fixtures/data.fixture.ts) | `seed` | **option**: override with `test.use(...)` |
  | [auth.fixture.ts](patterns/3-fixtures/fixtures/auth.fixture.ts) | `guestPage`, `signedInPage` | regular, built on app + data |
  | [errors.fixture.ts](patterns/3-fixtures/fixtures/errors.fixture.ts) | `failOnPageErrors` | **auto**: runs in every test |

- [index.ts](patterns/3-fixtures/fixtures/index.ts) combines them with `mergeTests(...)`, and
  the spec imports only `'../fixtures'`. **Extend** when fixtures depend on another file
  (`auth` uses `appUrls` and `seed`); **merge** when files are independent.
  See [Organizing fixtures](PATTERNS.md#organizing-fixtures-one-job-per-file).
- **Visual walkthrough:** open [fixture-flow.html](patterns/3-fixtures/fixture-flow.html) in a
  browser. It animates, step by step, which fixture runs when, what each one depends on, and how
  the test and a page object call the page. Three flows: `guestPage`, `signedInPage` with
  `seed`, and the folder 5 `loginPage` fixture with its POM.
- `import { test as base }` gives Playwright's `test` the local name `base`.
  `base.extend(...)` returns a new `test` with the original fixtures plus the new ones.
  See [how `extend` works](PATTERNS.md#3-fixtures-testextend).
- `guestPage` is a page already opened at sign-in. It is a plain `Page`, not a page object.
- `signedInPage` skips the UI login by seeding the session directly, like calling a
  login API in a real project. Tests about tasks no longer repeat login steps.
- `seed` is an **option fixture**: override it per `describe` with `test.use(...)` to
  start with existing tasks.
- `failOnPageErrors` is an **auto fixture** with **teardown**: the code after `await use()`
  runs after every test and fails it if the app threw a JavaScript error.
- Fixtures do not hide locators: `getByLabel(...)` and similar calls are still repeated in the
  tests.

**4. Factory functions**: [taskBoardActions.ts](patterns/4-factory-functions/factories/taskBoardActions.ts),
[testData.ts](patterns/4-factory-functions/factories/testData.ts)

- `createTaskActions(page)` groups actions per page like POM, but with no `class`, `new`, or `this`.
- `page` is passed once and remembered by a closure, so calls are as short as POM's.
- Values the tests should not use (the page URL and form inputs) stay inside the factory.
- Public locators are assertion targets; action controls stay inside the factory's closure.
- `buildTestUser({ password: 'wrong-password' })` is a test data factory with defaults and overrides.
- The `completes a task` test destructures the actions. That is safe here but breaks with a class.
- **Visual walkthrough:** open [factory-flow.html](patterns/4-factory-functions/factory-flow.html)
  in a browser. It animates factory calls, the closure's private variables and the public
  returned object. Three flows: creating the actions, test data with overrides, and closure
  vs `this` when destructuring.

**5. Combined**: [combined.fixture.ts](patterns/5-combined/fixtures/combined.fixture.ts),
[tasks.spec.ts](patterns/5-combined/tests/tasks.spec.ts)

- `base.extend(...)` builds on the fixtures from folder 3 and adds two fixtures:
  `loginPage` (a POM object from folder 1) and `tasks` (the factory from folder 4).
- Each line in the spec is tagged `[Fixtures]`, `[POM]`, `[Factory]`, or `[Helper]`, showing
  which pattern it uses.
- The tests contain no setup and no raw selectors, only the scenario and its assertions.
- **Visual walkthrough:** open [combined-flow.html](patterns/5-combined/combined-flow.html) in a
  browser. It shows the fixtures setting up (including the auto fixture), the test body using a
  POM object, a factory object and helpers, and teardown in reverse order. Three flows: signing
  in, the `seed` → `signedInPage` → `tasks` fixture chain, and who does what.

## Workshop exercises

1. Add a scenario "un-completes a task" to every pattern folder. Where did you
   change the most code?
2. Rename the **Add task** button to **Create**. How many files must change in each pattern?
3. Add a test with `seed.tasks` containing one task that is already done, and assert the counter
   says `0 tasks left`.
4. Add a `buildTask(overrides)` test data factory with defaults `{ title: 'Buy milk', done: false }`
   and use it to fill `seed.tasks` in `5-combined`.
5. In `5-combined`, add a `tasksPage` fixture that returns `new TasksPage(signedInPage)` from
   folder 1. Rewrite one test to use it instead of `tasks`. Which version do you prefer?
6. In `3-fixtures/fixtures`, add a `console.fixture.ts` with an auto fixture that fails the
   test on `console.error(...)` messages (`page.on('console')`). Add it to `mergeTests(...)`
   in `index.ts`. Did any spec need to change?

## Workshop task (hands-on)

[workshop-task/](workshop-task/README.md) contains **EventHub**, 4 new pages (profile, workshop
registration, attendees table, and accordion settings) with selects, inputs, checkboxes, radios,
dialogs, and accordions. Students write a page object for each page plus tests that use them.
The task, price rules, locator hints, and stretch goals are in
[workshop-task/README.md](workshop-task/README.md).
