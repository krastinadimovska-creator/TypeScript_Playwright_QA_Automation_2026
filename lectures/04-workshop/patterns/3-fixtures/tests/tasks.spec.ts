// Import `test` and `expect` from the fixtures entry point (fixtures/index.ts), not from
// '@playwright/test'. The spec does not need to know which *.fixture.ts file defines what.
import { test, expect } from '../fixtures';

// Fixtures: request ready-made setup through test arguments. The fixture owns lifecycle,
// while locators and assertions stay visible in the test.
// `failOnPageErrors` (errors.fixture.ts) is an auto fixture: it runs in every test below.
test.describe('TaskBoard - Fixtures (test.extend)', () => {
	test('signs in with valid credentials', async ({ guestPage }) => {
		await guestPage.getByLabel('Username').fill('alex');
		await guestPage.getByLabel('Password').fill('secret123');
		await guestPage.getByRole('button', { name: 'Sign in' }).click();

		await expect(guestPage.getByRole('heading', { level: 1 })).toHaveText('Hi, Alex!');
		await expect(guestPage.getByRole('status')).toHaveText('No tasks yet.');
	});

	test('shows an error for a wrong password', async ({ guestPage }) => {
		await guestPage.getByLabel('Username').fill('alex');
		await guestPage.getByLabel('Password').fill('wrong-password');
		await guestPage.getByRole('button', { name: 'Sign in' }).click();

		await expect(guestPage.getByRole('alert')).toHaveText('Wrong username or password.');
	});

	test('adds a task', async ({ signedInPage }) => {
		// The fixture seeds an authenticated session, so this test focuses on task behavior.
		await signedInPage.getByLabel('New task').fill('Buy milk');
		await signedInPage.getByRole('button', { name: 'Add task' }).click();

		await expect(signedInPage.getByRole('listitem').filter({ hasText: 'Buy milk' })).toBeVisible();
		await expect(signedInPage.getByRole('status')).toHaveText('1 task left');
	});

	test.describe('with existing tasks', () => {
		// Override the `seed` option (data.fixture.ts) for this group; each test gets an isolated
		// copy of the state. `signedInPage` (auth.fixture.ts) puts these tasks into the session.
		test.use({
			seed: {
				tasks: [
					{ title: 'Buy milk', done: false },
					{ title: 'Buy milk and eggs', done: false },
				],
			},
		});

		test('completes a task', async ({ signedInPage }) => {
			// Exact accessible checkbox name prevents matching a similarly named task.
			const buyMilk = signedInPage.getByRole('listitem').filter({
				has: signedInPage.getByRole('checkbox', { name: 'Buy milk', exact: true }),
			});

			await buyMilk.getByRole('checkbox').check();

			await expect(buyMilk.getByRole('checkbox')).toBeChecked();
			await expect(signedInPage.getByRole('status')).toHaveText('1 task left');
		});

		test('deletes a task', async ({ signedInPage }) => {
			const buyMilk = signedInPage.getByRole('listitem').filter({
				has: signedInPage.getByRole('checkbox', { name: 'Buy milk', exact: true }),
			});
			await buyMilk.getByRole('button', { name: 'Delete Buy milk', exact: true }).click();

			await expect(buyMilk).toHaveCount(0);
			await expect(signedInPage.getByRole('checkbox', { name: 'Buy milk and eggs', exact: true })).toBeVisible();
		});
	});
});
