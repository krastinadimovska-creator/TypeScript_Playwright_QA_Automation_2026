import { test, expect } from '@playwright/test';
import { createLoginActions, createTaskActions, type LoginActions, type TaskActions } from '../factories/taskBoardActions';
import { buildTestUser } from '../factories/testData';

// Factories group related actions and capture page once. They return plain functions rather
// than class instances, so actions can be safely destructured without a `this` binding.
test.describe('TaskBoard - Factory Functions', () => {
	let login: LoginActions;
	let tasks: TaskActions;

	test.beforeEach(async ({ page }) => {
		login = createLoginActions(page);
		tasks = createTaskActions(page);
		await login.open();
	});

	test('signs in with valid credentials', async () => {
		const user = buildTestUser();

		await login.loginAs(user);

		await expect(tasks.heading).toHaveText(`Hi, ${user.displayName}!`);
		await expect(tasks.counter).toHaveText('No tasks yet.');
	});

	test('shows an error for a wrong password', async () => {
		// Override only the field this scenario is about; the rest stays valid.
		await login.loginAs(buildTestUser({ password: 'wrong-password' }));

		await expect(login.errorMessage).toHaveText('Wrong username or password.');
	});

	test('adds a task', async () => {
		await login.loginAs(buildTestUser());

		await tasks.addTask('Buy milk');

		await expect(tasks.task('Buy milk')).toBeVisible();
		await expect(tasks.counter).toHaveText('1 task left');
	});

	test('completes a task', async () => {
		// Destructuring is safe: the functions use the captured `page`, not `this`.
		// The same line with a class instance (`const { addTask } = tasksPage`) would break.
		const { addTasks, completeTask, task, counter } = tasks;
		await login.loginAs(buildTestUser());
		await addTasks(['Buy milk', 'Walk the dog']);

		await completeTask('Buy milk');

		await expect(task('Buy milk').getByRole('checkbox')).toBeChecked();
		await expect(counter).toHaveText('1 task left');
	});

	test('deletes a task', async () => {
		await login.loginAs(buildTestUser());
		await tasks.addTasks(['Buy milk', 'Buy milk and eggs']);

		await tasks.deleteTask('Buy milk');

		await expect(tasks.task('Buy milk')).toHaveCount(0);
		await expect(tasks.task('Buy milk and eggs')).toBeVisible();
	});
});
