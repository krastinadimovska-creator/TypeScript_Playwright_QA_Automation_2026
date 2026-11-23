import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { TasksPage } from '../page-objects/TasksPage';

// POM: page classes own selector details and user actions. Tests create the objects and
// keep expected outcomes in the test. Only assertion locators are public and readonly.
test.describe('TaskBoard - Page Object Model', () => {
	let loginPage: LoginPage;
	let tasksPage: TasksPage;

	test.beforeEach(async ({ page }) => {
		// Playwright supplies a fresh page for this test; the objects wrap that page.
		loginPage = new LoginPage(page);
		tasksPage = new TasksPage(page);
		await loginPage.navigate();
	});

	test('signs in with valid credentials', async () => {
		await loginPage.login('alex', 'secret123');

		await expect(tasksPage.heading).toHaveText('Hi, Alex!');
		await expect(tasksPage.counter).toHaveText('No tasks yet.');
	});

	test('shows an error for a wrong password', async () => {
		await loginPage.login('alex', 'wrong-password');

		await expect(loginPage.errorMessage).toHaveText('Wrong username or password.');
	});

	test('adds a task', async () => {
		await loginPage.login('alex', 'secret123');

		await tasksPage.addTask('Buy milk');

		await expect(tasksPage.task('Buy milk')).toBeVisible();
		await expect(tasksPage.counter).toHaveText('1 task left');
	});

	test('completes a task', async () => {
		// This pattern prepares data through the UI, making setup part of the scenario flow.
		await loginPage.login('alex', 'secret123');
		await tasksPage.addTask('Buy milk');
		await tasksPage.addTask('Walk the dog');

		await tasksPage.completeTask('Buy milk');

		await expect(tasksPage.task('Buy milk').getByRole('checkbox')).toBeChecked();
		await expect(tasksPage.counter).toHaveText('1 task left');
	});

	test('deletes a task', async () => {
		await loginPage.login('alex', 'secret123');
		await tasksPage.addTask('Buy milk');
		await tasksPage.addTask('Buy milk and eggs');

		await tasksPage.deleteTask('Buy milk');

		await expect(tasksPage.task('Buy milk')).toHaveCount(0);
		await expect(tasksPage.task('Buy milk and eggs')).toBeVisible();
	});
});
