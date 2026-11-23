// COMBINED PATTERNS: the tests
//
// Each pattern does the job it is best at. Comments in [brackets] show which pattern a line uses:
//
//   [Fixtures]  setup, state, and cleanup: `loginPage`, `tasks`, `seed`, and `failOnPageErrors`
//               (auto fixture, runs in every test without being listed)
//   [POM]       the sign-in page, as a LoginPage object
//   [Factory]   task actions (`tasks.addTask(...)`) and test data (`buildTestUser(...)`)
//   [Helper]    a one-off check on another page; no object needed for a single locator
//
// The test bodies contain no setup and no raw selectors, only the scenario and its assertions.

// [Fixtures] `test` comes from our combined fixtures file; `expect` is Playwright's own.
import { test, expect } from '../fixtures/combined.fixture';
// [Factory] Test data factory: valid defaults, override only what the scenario is about.
import { buildTestUser } from '../../4-factory-functions/factories/testData';
// [Helper] Stateless function: pass `page` in, get a locator back.
import { taskCounter, welcomeHeading } from '../../2-functional-helpers/helpers/tasks';

test.describe('TaskBoard - All patterns combined', () => {
	test.describe('signing in', () => {
		// [Fixtures] Asking for `loginPage` replaces `beforeEach` + `new LoginPage(page)` + navigate.
		test('signs in with valid credentials', async ({ loginPage, page }) => {
			// [Factory] A fresh user object with the valid demo credentials.
			const user = buildTestUser();

			// [POM] One method hides the three form steps.
			await loginPage.login(user.username, user.password);

			// The heading comes from the test data, so the expectation follows the user.
			await expect(welcomeHeading(page)).toHaveText(`Hi, ${user.displayName}!`);
			// [Helper] A single check on the tasks page: a plain function is enough here.
			await expect(taskCounter(page)).toHaveText('No tasks yet.');
		});

		test('shows an error for a wrong password', async ({ loginPage }) => {
			// [Factory] Override only the field this scenario is about.
			const user = buildTestUser({ password: 'wrong-password' });

			// [POM] Same action as above; the result depends only on the data.
			await loginPage.login(user.username, user.password);

			// [POM] The page object exposes the locator; the test owns the assertion.
			await expect(loginPage.errorMessage).toHaveText('Wrong username or password.');
		});
	});

	test.describe('managing tasks', () => {
		// [Fixtures] `tasks` depends on `signedInPage`: the user is signed in WITHOUT the UI,
		// so these tests do not repeat login steps or depend on the sign-in page working.
		test('adds a task', async ({ tasks }) => {
			// [Factory] `page` was captured by the factory inside the fixture.
			await tasks.addTask('Buy milk');

			await expect(tasks.task('Buy milk')).toBeVisible();
			await expect(tasks.counter).toHaveText('1 task left');
		});

		test.describe('with existing tasks', () => {
			// [Fixtures] Option fixture: start these tests with two tasks already in the list,
			// instead of adding them through the UI in every test.
			test.use({
				seed: {
					tasks: [
						{ title: 'Buy milk', done: false },
						{ title: 'Buy milk and eggs', done: false },
					],
				},
			});

			test('completes a task', async ({ tasks }) => {
				// [Factory] Destructuring is safe: the functions use the closure, not `this`.
				const { completeTask, task, counter } = tasks;

				await completeTask('Buy milk');

				await expect(task('Buy milk').getByRole('checkbox')).toBeChecked();
				await expect(counter).toHaveText('1 task left');
			});

			test('deletes a task', async ({ tasks }) => {
				await tasks.deleteTask('Buy milk');

				await expect(tasks.task('Buy milk')).toHaveCount(0);
				await expect(tasks.task('Buy milk and eggs')).toBeVisible();
			});
		});
	});
	// [Fixtures] After each test, `failOnPageErrors` (from folder 3) checks that the app threw
	// no JavaScript errors. It is an auto fixture, so no test has to ask for it.
});
