// ERRORS FIXTURE: a safety net for every test.
//
// Job:       fail the test if the app throws an uncaught JavaScript error in the page.
// Kind:      AUTO fixture ({ auto: true }). It runs for every test that uses this `test`,
//            even though no test lists it in its arguments. Its type is `void` because it
//            gives the test nothing; it only does work before and after it.
// Depends:   the built-in `page`. It is the same `page` that `guestPage` and `signedInPage`
//            receive: Playwright creates each fixture only once per test.
// Used by:   every test, automatically.
//
// Not covered: console.error() messages, failed network requests, and errors in other tabs
// (use page.on('console'), page.on('requestfailed'), or context.on('weberror') for those).
//
// Keep auto fixtures few and cheap: they cost time in every test. This one also makes every
// test open a page, which is fine for a UI suite but not for API-only tests.
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ failOnPageErrors: void }>({
	failOnPageErrors: [async ({ page }, use) => {
		// Setup: listen before anything navigates, so errors during page load are caught too.
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));

		await use();

		// Teardown: runs after the test, even if it failed.
		expect(errors, 'JavaScript errors thrown by the page').toEqual([]);
	}, { auto: true, title: 'check for page errors' }],
});
