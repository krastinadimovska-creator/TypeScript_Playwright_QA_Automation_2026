// AUTH FIXTURE: who the test is.
//
// Job:       hand the test a page that is either signed out (`guestPage`) or already
//            signed in with the seeded tasks (`signedInPage`).
// Depends:   `appUrls` (app.fixture.ts), `seed` (data.fixture.ts), and the built-in `page`.
// Used by:   the specs, and the fixtures in 5-combined.
//
// Two ways to build on other fixture files:
//   - LAYERING: X.extend(...) when the new fixtures USE fixtures from X. That is the case
//     here: `signedInPage` needs `appUrls` and `seed`, so we extend a test that has them.
//   - MERGING: mergeTests(A, B) when the files are independent (see index.ts).
// mergeTests(app, data) builds the starting test, and .extend() layers the auth fixtures on it.
import { expect, mergeTests, type Page } from '@playwright/test';
import { test as appTest } from './app.fixture';
import { test as dataTest } from './data.fixture';

type AuthFixtures = {
	// Page opened at the sign-in screen, not signed in. A plain Page, not a LoginPage object.
	guestPage: Page;
	// Page already signed in, with `seed.tasks` in the list. No UI login needed.
	signedInPage: Page;
};

export const test = mergeTests(appTest, dataTest).extend<AuthFixtures>({
	guestPage: async ({ page, appUrls }, use) => {
		await page.goto(appUrls.login);
		await use(page);
	},

	signedInPage: async ({ page, appUrls, seed }, use) => {
		// Seed the session directly, like calling a login API in a real project.
		// Not context.addInitScript (the docs' session storage recipe): it runs on every
		// navigation and would sign the user in again after "Sign out".
		await page.goto(appUrls.login);
		await page.evaluate((tasks) => {
			sessionStorage.setItem('taskboard-user', 'Alex');
			sessionStorage.setItem('taskboard-tasks', JSON.stringify(tasks));
		}, seed.tasks);
		await page.goto(appUrls.tasks);
		// Fail during setup, not in the test, if signing in did not work.
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hi, Alex!');

		await use(page);
		// No teardown needed: Playwright closes the test's page and context, and its storage.
	},
});
