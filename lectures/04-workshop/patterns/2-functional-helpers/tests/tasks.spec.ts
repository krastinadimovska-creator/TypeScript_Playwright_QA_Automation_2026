import { test, expect } from '@playwright/test';
import { login, openLoginPage } from '../helpers/auth';
import { addTask, addTasks, completeTask, deleteTask, taskCounter, taskItem, welcomeHeading } from '../helpers/tasks';

// Functional helpers: no classes or `this`; pass each function the page it needs.
test.describe('TaskBoard - Functional Helpers', () => {
	test.beforeEach(async ({ page }) => {
		await openLoginPage(page);
	});

	test('signs in with valid credentials', async ({ page }) => {
		await login(page, 'alex', 'secret123');

		await expect(welcomeHeading(page)).toHaveText('Hi, Alex!');
		await expect(taskCounter(page)).toHaveText('No tasks yet.');
	});

	test('shows an error for a wrong password', async ({ page }) => {
		await login(page, 'alex', 'wrong-password');

		await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
	});

	test('adds a task', async ({ page }) => {
		await login(page, 'alex', 'secret123');

		await addTask(page, 'Buy milk');

		await expect(taskItem(page, 'Buy milk')).toBeVisible();
		await expect(taskCounter(page)).toHaveText('1 task left');
	});

	test('completes a task', async ({ page }) => {
		await login(page, 'alex', 'secret123');
		await addTasks(page, ['Buy milk', 'Walk the dog']);

		await completeTask(page, 'Buy milk');

		await expect(taskItem(page, 'Buy milk').getByRole('checkbox')).toBeChecked();
		await expect(taskCounter(page)).toHaveText('1 task left');
	});

	test('deletes a task', async ({ page }) => {
		await login(page, 'alex', 'secret123');
		await addTasks(page, ['Buy milk', 'Buy milk and eggs']);

		await deleteTask(page, 'Buy milk');

		await expect(taskItem(page, 'Buy milk')).toHaveCount(0);
		await expect(taskItem(page, 'Buy milk and eggs')).toBeVisible();
	});
});
