// APP FIXTURE: where the application lives.
//
// Job:       give every test the TaskBoard page URLs.
// Scope:     WORKER. The URLs never change, so each worker process builds them once and
//            shares them with all of its tests. Test-scoped fixtures (like `page`) are
//            created again for every test.
// Depends:   nothing.
// Used by:   auth.fixture.ts (to open the sign-in and tasks pages).
//
// In a real project, worker fixtures hold expensive or shared resources: an API client,
// a database connection, or one test account per worker. A worker fixture cannot depend on
// test fixtures such as `page`; the opposite direction is allowed.
import { test as base } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export type AppUrls = {
	login: string;
	tasks: string;
};

// Turn a page filename into a local file URL; no web server is required.
const pageUrl = (file: string) => pathToFileURL(resolve(__dirname, '../../../pages', file)).href;

// extend<TestFixtures, WorkerFixtures>: this file adds no test fixtures, so the first type is {}.
export const test = base.extend<{}, { appUrls: AppUrls }>({
	appUrls: [async ({}, use) => {
		// Playwright requires the first argument to be destructured, even when it is empty.
		await use({ login: pageUrl('login.html'), tasks: pageUrl('tasks.html') });
	}, { scope: 'worker' }],
});
