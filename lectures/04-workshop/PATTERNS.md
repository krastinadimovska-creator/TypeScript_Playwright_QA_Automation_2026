# Test Design Patterns in Playwright

A guide to the four patterns in this workshop and how to combine them. Every pattern
implements the same TaskBoard scenarios, so the code can be compared line by line:

| # | Pattern | Code |
|---|---|---|
| 1 | Page Object Model | [page-objects/](patterns/1-page-object-model/page-objects/), [tests](patterns/1-page-object-model/tests/tasks.spec.ts) |
| 2 | Functional Helpers | [helpers/](patterns/2-functional-helpers/helpers/), [tests](patterns/2-functional-helpers/tests/tasks.spec.ts) |
| 3 | Fixtures (`test.extend`) | [fixtures/](patterns/3-fixtures/fixtures/) (`*.fixture.ts` + [index.ts](patterns/3-fixtures/fixtures/index.ts)), [tests](patterns/3-fixtures/tests/tasks.spec.ts) |
| 4 | Factory Functions | [factories/](patterns/4-factory-functions/factories/), [tests](patterns/4-factory-functions/tests/tasks.spec.ts) |
| 5 | **All combined** | [fixtures/combined.fixture.ts](patterns/5-combined/fixtures/combined.fixture.ts), [tests](patterns/5-combined/tests/tasks.spec.ts) |

Two questions help to place every pattern:

- **Where do my locators and click/fill steps live?** Answered by POM, functional helpers,
  and factory functions.
- **What does a test need before it starts, and who cleans up after it?** Answered by fixtures.

---

## 1. Page Object Model (POM)

**Idea:** a **class** represents a page or component. It holds the page's locators and offers
methods for user actions.

### How it works

```ts
export class TasksPage {
  readonly counter: Locator;
  private readonly newTaskInput: Locator;
  private readonly addTaskButton: Locator;

  constructor(private readonly page: Page) {
    // Public, readonly locators are only assertion targets; controls used for actions stay private.
    this.counter = page.getByRole('status');
    this.newTaskInput = page.getByLabel('New task');
    this.addTaskButton = page.getByRole('button', { name: 'Add task' });
  }

  async addTask(title: string): Promise<void> {
    await this.newTaskInput.fill(title);
    await this.addTaskButton.click();
  }
}

// In the test: create the object by hand, usually in beforeEach
const tasksPage = new TasksPage(page);
await tasksPage.addTask('Buy milk');
await expect(tasksPage.counter).toHaveText('1 task left');   // the test owns the assertion
```

1. The constructor receives `page` and stores it on `this`.
2. Locators are created once, as `readonly` properties.
3. Methods describe user intent (`login`, `addTask`) and hide the steps.
4. Interaction locators are `private readonly`. Expose only `readonly` locator targets that
   tests need for assertions, so `expect(locator).toHaveText(...)` can auto-wait.

**Visual walkthrough:** open
[pom-flow.html](patterns/1-page-object-model/pom-flow.html) in a browser. It animates `new`,
the constructor filling `this`, and how a method finds its fields through `this`. Its three
flows also show `private`/`readonly` and why a detached method loses `this`. A collapsible
**"What is a Page Object?"** panel explains the basics.

### Encapsulation: what to expose

The page object should hide **which selector** identifies a control and how an action is
performed. Use `private readonly` for controls used only by page-object actions. A
`readonly Locator` may be public when a test needs to assert the outcome; the test sees
`page.errorMessage`, not `getByRole('alert')`, and Playwright's locator assertions still retry.
Tests should assert on public locators, not click or fill them.

Avoid setters: callers should not replace a page object's locator. A getter that merely returns
the same locator usually adds no more encapsulation than a `readonly` property. Avoid methods
that return a one-time string/boolean for changing UI state; snapshots do not retry an assertion.
Keep expected values and `expect(...)` in the test.

### Pros

- **Familiar structure** for teams that know OOP: `class`, `private`, `readonly`.
- **Strong autocomplete:** typing `tasksPage.` lists everything the page offers.
- **One home per page:** a changed selector is fixed in one place.
- **Clear public API:** action locators stay private, while readonly assertion targets support
  Playwright's auto-waiting assertions.
- **Navigation can be modelled:** a method can return the next page object
  (see Lecture 3's `loginAndOpenAccount`).

### Cons

- **More boilerplate:** class, constructor, `this`, and `new` for every page.
- **Manual lifecycle:** every test (or `beforeEach`) must create and prepare the objects.
- **`this` can be lost:** `const { addTask } = tasksPage` throws a `TypeError` when called.
- **Inheritance gets messy:** deep `BasePage -> AppPage -> TasksPage` chains are hard to follow.
- **Public assertion locators are still usable as locators:** TypeScript cannot stop a caller
  from clicking one; keep them readonly and document them as assertion-only API.

**Best fit:** complex or stateful pages where an explicit, stable page API helps. POM is not
limited to OOP-heavy teams.

---

## 2. Functional Helpers

**Idea:** plain, **stateless functions** that receive `page` (or a `Locator`) as their first
argument.

### How it works

```ts
export function taskCounter(page: Page): Locator {
  return page.getByRole('status');
}

export async function addTask(page: Page, title: string): Promise<void> {
  await page.getByLabel('New task').fill(title);
  await page.getByRole('button', { name: 'Add task' }).click();
}

// Small functions compose into bigger ones
export async function addTasks(page: Page, titles: string[]): Promise<void> {
  for (const title of titles) await addTask(page, title);
}

// In the test: import and call, passing page every time
await addTask(page, 'Buy milk');
```

1. Each function gets everything it needs as arguments, and nothing is stored.
2. Files are grouped by area (`auth.ts`, `tasks.ts`) and imported by name.
3. Bigger workflows are just functions that call smaller ones.
4. A helper can return a `Locator` for a test assertion instead of a one-time text snapshot.

**Visual walkthrough:** open
[helpers-flow.html](patterns/2-functional-helpers/helpers-flow.html) in a browser. It animates
each helper call with its arguments on a call stack, helpers calling helpers, and the
trade-offs compared with POM. A collapsible **"What is a functional helper?"** panel explains
the basics.

### Pros

- **Very little boilerplate:** no classes, constructors, `new`, or `this`.
- **Easy to read and trace:** the arguments show exactly what a function uses.
- **Composes well:** small functions combine into workflows without inheritance.
- **Easy to share:** any test, fixture, or page object can call them.

### Cons

- **`page` is repeated** in every call.
- **Flatter autocomplete:** you need to know which file to import from.
- **No grouping by page:** in large suites, related functions can scatter across files.
- **Setup is still manual,** as in POM.

**Best fit:** fast-moving TS/JS teams, action-focused flows, small reusable steps.

---

## 3. Fixtures (`test.extend`)

**Idea:** Playwright **injects ready-made dependencies and state** into the test's arguments,
and handles setup and teardown for every test.

### How it works

The fixture file imports Playwright's `test` **as `base`**. This is just an import alias:
`base` is not a special Playwright keyword. Therefore, `base.extend(...)` calls the same
`extend` method that the documentation calls `test.extend(...)`. The alias also leaves the
name `test` available for the new, extended test.

The following is simplified from [auth.fixture.ts](patterns/3-fixtures/fixtures/auth.fixture.ts);
`loginUrl` and `tasksUrl` represent the local page URLs (the real file gets them from the
`appUrls` fixture):

```ts
// Import Playwright's built-in test and give it the local name "base".
import { test as base, type Page } from '@playwright/test';

// Create a new test with signedInPage, while keeping base's built-in fixtures.
export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    // 1. Setup: runs before the test
    await page.goto(loginUrl);
    await page.evaluate(() => sessionStorage.setItem('taskboard-user', 'Alex'));
    await page.goto(tasksUrl);

    // 2. Hand the value to the test
    await use(page);

    // 3. Teardown can go here, after the test has finished
  },
});
```

In a separate test file, import the **extended** `test` and request its fixture:

```ts
import { test } from '../fixtures'; // fixtures/index.ts

// Playwright prepares signedInPage when this test requests it.
test('adds a task', async ({ signedInPage }) => { /* already signed in */ });
```

1. `base.extend(...)` returns a **new test** with the inherited fixtures, such as `page`,
   plus the fixture definitions passed to it. It can also override a fixture; it does not
   change `base` or run the setup immediately.
2. `<{ signedInPage: Page }>` tells TypeScript the new fixture's type. The object passed
   to `extend` defines how to set it up.
3. Tests import the new `test` from the fixture file. When a test requests `signedInPage`,
   Playwright supplies `page`, runs the setup and passes the result to the test via
   `await use(page)`. Code after `use` is teardown.
4. Non-automatic fixtures run only when a test, hook, or another needed fixture depends on
   them. Automatic fixtures run without being requested.
5. Fixtures can **depend on other fixtures** (`signedInPage` uses `page` and `seed`).
6. Fixture variations:
   - **Option fixture** (`seed`): a value with a default, overridden with `test.use({ seed })`.
   - **Auto fixture** (`failOnPageErrors`): runs for every test without being listed.
   - **Worker fixture** (`appUrls`, `{ scope: 'worker' }`): created once per worker process
     and shared by its tests. In real projects: an API client or one test account per worker.

In [combined.fixture.ts](patterns/5-combined/fixtures/combined.fixture.ts), `base` is instead
the extended `test` imported from folder 3. Calling `base.extend(...)` there keeps those
fixtures and adds `loginPage` and `tasks`.

### Organizing fixtures: one job per file

A single fixtures file grows quickly in a real suite. Folder 3 splits fixtures by
responsibility, one `*.fixture.ts` file each, plus an `index.ts` that specs import:

| File | Fixture | Kind | Answers |
|---|---|---|---|
| [app.fixture.ts](patterns/3-fixtures/fixtures/app.fixture.ts) | `appUrls` | worker | Where does the app live? |
| [data.fixture.ts](patterns/3-fixtures/fixtures/data.fixture.ts) | `seed` | option | What data does the test start with? |
| [auth.fixture.ts](patterns/3-fixtures/fixtures/auth.fixture.ts) | `guestPage`, `signedInPage` | regular | Who is the test? |
| [errors.fixture.ts](patterns/3-fixtures/fixtures/errors.fixture.ts) | `failOnPageErrors` | auto | What must hold in every test? |
| [index.ts](patterns/3-fixtures/fixtures/index.ts) | all of the above | `mergeTests` | What do specs import? |

Each file extends Playwright's `test` (or another fixture file's `test`). There are two ways
to put the files together:

```ts
// LAYERING with extend: the new fixtures USE fixtures from another file.
// auth.fixture.ts: signedInPage needs appUrls and seed.
export const test = mergeTests(appTest, dataTest).extend<AuthFixtures>({ /* ... */ });

// MERGING with mergeTests: the files are independent of each other.
// index.ts: auth and errors do not use each other's fixtures.
export const test = mergeTests(authTest, errorsTest);
```

```ts
// Every spec imports the same entry point; it does not care which file defines what.
import { test, expect } from '../fixtures';
```

To **see** the execution order, open
[fixture-flow.html](patterns/3-fixtures/fixture-flow.html) in a browser. It animates setup,
`await use()`, the test body, and teardown in reverse order for three tests, including
the folder 5 test that calls a page object.

Rules that keep fixtures manageable as a suite grows:

1. **One job per fixture file.** Name files after the question they answer: `auth`,
   `data`, `errors`.
2. **Extend when you depend, merge when you don't.** Keep `extend` chains shallow (2–3 levels).
3. **Unique fixture names across files.** `mergeTests` combines them into one `test`.
4. **Specs import from one entry point** (`index.ts`), so files can move without touching specs.
5. **Prefer options over new fixtures** when only the data differs (`seed`).
6. **Worker scope for expensive, shared, read-only things;** test scope for anything a test
   changes. Worker fixtures cannot use test fixtures such as `page`.
7. **Few, cheap auto fixtures.** They run in every test.
8. **Fixtures prepare and clean up; they do not contain test steps.** Locators and actions
   stay in page objects, helpers, or factories.
9. **Do not reuse built-in names** (`page`, `context`, `request`) unless you mean to override them.

### Pros

- **Automatic lifecycle:** setup and teardown live together, and every test is isolated.
- **Fast, reliable setup:** sign in via API or storage instead of the UI.
- **On demand and composable:** tests take only what they need; fixtures build on each other.
- **Strong typing:** `{ signedInPage }` is typed and autocompleted in the test arguments.
- **Replaces most `beforeEach`/`afterEach` hooks** and works across files.

### Cons

- **Some "magic":** where a value comes from is not visible in the test body.
- **Learning curve:** `use`, scopes, options, and array values in `test.use`
  (an array must be wrapped; see the comment on `seed`).
- **Does not organize locators:** without POM, helpers, or factories, selectors are still
  repeated in the tests (see folder 3).

**Best fit:** every Playwright suite, especially for auth, test data seeding, and cleanup.

---

## 4. Factory Functions

**Idea:** a **regular function that creates and returns a new object** (or function, or data),
without `class` or `new`. The returned functions remember the arguments through a **closure**.

### How it works

```ts
export function createTaskActions(page: Page) {
  const newTaskInput = page.getByLabel('New task');   // private: not returned

  async function addTask(title: string): Promise<void> {
    await newTaskInput.fill(title);                    // uses `page` from the closure
    await page.getByRole('button', { name: 'Add task' }).click();
  }

  return { counter: page.getByRole('status'), addTask };   // the public API
}
export type TaskActions = ReturnType<typeof createTaskActions>;

// In the test: call once, then use without passing page
const tasks = createTaskActions(page);
await tasks.addTask('Buy milk');
```

The same idea builds **test data**: valid defaults, overridden per scenario.

```ts
export function buildTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return { username: 'alex', password: 'secret123', displayName: 'Alex', ...overrides };
}

buildTestUser();                               // the valid demo user
buildTestUser({ password: 'wrong-password' }); // same user, wrong password
```

1. The factory receives its dependencies (`page`) once.
2. Inner functions use them through the closure, so there is no `this`.
3. Only what is returned is public. Everything else stays private in the factory's scope.
4. `ReturnType<typeof factory>` gives a type for variables and fixtures.

**Visual walkthrough:** open
[factory-flow.html](patterns/4-factory-functions/factory-flow.html) in a browser. It animates
how the test calls a factory, what the closure keeps, and when the browser is actually used.
It has three flows: creating the actions in `beforeEach`, the `buildTestUser` data factory, and
destructuring (closure vs `this`). A collapsible **"What is a factory function?"** panel
explains the basics.

### Side by side: why closures avoid repeating `page`

```ts
// Functional helpers: every call needs `page`
await addTask(page, 'Buy milk');

// Page Object Model: `page` is stored on `this`
const tasksPage = new TasksPage(page);
const { addTask } = tasksPage;
await addTask('Walk the dog');          // TypeError: `this` is undefined

// Factory function: `page` is captured once by the closure
const tasks = createTaskActions(page);
const { completeTask } = tasks;
await completeTask('Buy milk');         // works: no `this` involved
```

The POM's locator is an assertion target; interaction controls remain private. A factory keeps
unreturned values inside its closure, but TypeScript cannot apply `private` to those values.

### Where a factory gets too large

```ts
// Too large: one factory for the whole app becomes a "god object"
function createAppActions(page: Page) {
  return { open, loginAs, logout, addTask, addTasks, completeTask, deleteTask,
           editTask, filterTasks, sortTasks, openSettings, changeTheme, exportCsv, ... };
}

// Better: one small factory per page or component
const login = createLoginActions(page);
const tasks = createTaskActions(page);
```

### Pros

- **Less boilerplate than classes:** no `class`, `constructor`, `this`, or inheritance.
- **Captures dependencies cleanly:** pass `page` (or config) once; every returned function
  reuses it.
- **Flexible return shapes:** an object of actions, a single function, or a test data object.
- **Easy composition:** factories can call or wrap other factories.
- **No `new`/`this` quirks:** methods still work when destructured or passed around.

### Cons

- **New function instances per call:** each call creates fresh closures. That is negligible
  in tests, but good to know.
- **Less familiar to OOP-heavy teams** used to `class`, `private`, and interfaces.
- **Encapsulation by closure only:** there is no `private` keyword; hidden values must stay
  in the factory's scope.
- **Can grow into a god object:** a factory with 15+ methods should be split.

**Best fit:** teams that want POM-style grouping with plain functions, and test data builders.

---

## Comparison

| Dimension | Page Object Model | Functional Helpers | Fixtures (`test.extend`) | Factory Functions |
|---|---|---|---|---|
| **Core idea** | Locators & actions inside a **class** | **Stateless functions** that take `page` | **Inject** ready-made dependencies and state into `test(...)` | A **function returns** an object of actions (or data) with `page` in a closure |
| **Primary role** | UI structure & interaction | UI actions & workflows | Lifecycle, setup/teardown, dependency injection | UI actions grouped per page; test data |
| **Boilerplate** | Medium–High | Very Low | Low–Medium | Low |
| **State & lifecycle** | Manual (`beforeEach`, `new`) | Stateless (passed per call) | Automatic, isolated per test/worker, built-in teardown | Captured once per call, manual creation |
| **Composability** | Harder (inheritance) | High | High (fixtures depend on fixtures) | High (factories wrap factories) |
| **IDE autocomplete** | Strong (`tasksPage.`) | Good, flatter | Strong (`{ signedInPage }`) | Strong (`tasks.`) |
| **`page` in each call?** | No (`this.page`) | Yes | Not needed: the fixture prepares the page | No (closure) |
| **Best fit** | OOP teams, complex stateful pages | Action-focused flows | Every suite: auth, seeding, cleanup | POM-style grouping without classes, test data builders |

## How they relate in practice

- **POM, helpers, and factories are alternatives.** All three answer *"where do my locators
  and steps live?"* Choose one main style per suite so the code stays consistent.
- **Factory functions sit between POM and helpers.** They group actions per page like POM but
  are built from plain functions like helpers, and they are a natural fit for test data.
- **Fixtures are the glue, not a replacement for locators.** They create and hand over
  whatever the test needs: a signed-in page, seeded data, a page object, or a factory's
  actions. Then they clean up.

## Combining all patterns (demo 5)

[Demo 5](patterns/5-combined/) uses each pattern for the job it does best:

| Job | Pattern | In the code |
|---|---|---|
| Sign in without the UI, seed tasks, check for page errors | Fixtures | `signedInPage`, `seed`, `failOnPageErrors` (folder 3) |
| Give the test ready-made objects | Fixtures | `loginPage` and `tasks` in [combined.fixture.ts](patterns/5-combined/fixtures/combined.fixture.ts) |
| Stateful sign-in form with an error message | POM | `loginPage.login(...)`, `loginPage.errorMessage` |
| Task actions without passing `page` | Factory | `tasks.addTask(...)`, `tasks.completeTask(...)` |
| Test users with valid defaults | Factory (data) | `buildTestUser({ password: 'wrong-password' })` |
| A single check on another page | Helper | `taskCounter(page)` |

```ts
// combined.fixture.ts: fixtures build on folder 3 and hand out a page object and a factory
import { test as base } from '../../3-fixtures/fixtures';
export const test = base.extend<{ loginPage: LoginPage; tasks: TaskActions }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  },
  tasks: async ({ signedInPage }, use) => {
    await use(createTaskActions(signedInPage));
  },
});

// tasks.spec.ts: no setup, no raw selectors, only the scenario
test('adds a task', async ({ tasks }) => {
  await tasks.addTask('Buy milk');
  await expect(tasks.counter).toHaveText('1 task left');
});
```

**Practical verdict:** use **fixtures** for setup, auth, data, and teardown in every suite.
For the UI steps, pick **one main style** (lightweight page objects, factory functions, or
functional helpers) and use small helpers for one-off steps. In most cases, mixing
POM *and* factories for the **same** page only confuses readers. Demo 5 mixes them for
different pages to show that they fit together.

**Visual walkthrough:** open [combined-flow.html](patterns/5-combined/combined-flow.html) in a
browser. It animates which fixtures run before the test (dependencies first, plus the auto
fixture), what the test body calls, and the teardown in reverse order. A collapsible
**"Why combine patterns?"** panel explains the basics.

## Official documentation

- [Page object models](https://playwright.dev/docs/pom)
- [Fixtures](https://playwright.dev/docs/test-fixtures): creating, automatic, option, and
  worker fixtures, execution order, and `mergeTests`
- [Authentication](https://playwright.dev/docs/auth): reusing signed-in state
