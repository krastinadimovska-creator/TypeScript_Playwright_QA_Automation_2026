// COMBINED PATTERNS: the fixtures file
//
// This file adds no new UI code. It reuses what the earlier folders already built and lets
// Playwright hand it to the tests, ready to use:
//
//   3-fixtures           -> the base `test`: appUrls, seed, guestPage, signedInPage,
//                           failOnPageErrors (merged from its *.fixture.ts files)
//   1-page-object-model  -> LoginPage class, injected as the `loginPage` fixture
//   4-factory-functions  -> createTaskActions factory, injected as the `tasks` fixture
//
// Rule of thumb: fixtures decide WHAT a test starts with; page objects, factories, and helpers
// decide HOW the test talks to the UI.

// [Fixtures] LAYERING: extend folder 3's merged test (its index.ts), not '@playwright/test',
// so the new fixtures can depend on its fixtures (`signedInPage`, `seed`) and its auto fixture
// keeps running. We extend instead of merge because `tasks` USES `signedInPage`.
import { test as base } from '../../3-fixtures/fixtures';
// [POM] A class for the sign-in page: a stateful form with several locators and an error message.
import { LoginPage } from '../../1-page-object-model/page-objects/LoginPage';
// [Factory] Grouped task actions that capture `page` in a closure. TaskActions is the type
// TypeScript infers from the factory (there is no class name to use as a type).
import { createTaskActions, type TaskActions } from '../../4-factory-functions/factories/taskBoardActions';

type CombinedFixtures = {
	// A LoginPage object, already opened at the sign-in screen. Tests start signed out.
	loginPage: LoginPage;
	// Task actions bound to a page that is already signed in, with `seed.tasks` in the list.
	tasks: TaskActions;
};

export const test = base.extend<CombinedFixtures>({
	// [Fixtures + POM] The fixture does what POM tests did in `beforeEach`: create the object
	// and navigate. This is the `todoPage` example from the Playwright fixtures docs.
	loginPage: async ({ page }, use) => {
		const loginPage = new LoginPage(page);
		await loginPage.navigate();
		await use(loginPage);
	},

	// [Fixtures + Factory] Depends on `signedInPage` from folder 3, which depends on `seed`.
	// Playwright builds them in order: seed -> signedInPage -> tasks.
	tasks: async ({ signedInPage }, use) => {
		await use(createTaskActions(signedInPage));
		// No teardown: the built-in `page` fixture closes the browser context and its storage.
	},
});

export { expect } from '@playwright/test';
