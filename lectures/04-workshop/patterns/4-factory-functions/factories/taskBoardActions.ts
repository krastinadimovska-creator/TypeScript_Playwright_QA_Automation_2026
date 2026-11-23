// FACTORY FUNCTION PATTERN: grouped UI actions
//
// A factory function is a regular function that creates and returns a new object, without using
// `class` or `new`. Here each factory receives `page` ONCE and returns related actions. The returned
// functions remember `page` through a closure, so tests never pass it again.
//
//   Functional helpers:  await addTask(page, 'Buy milk');      // `page` in every call
//   Factory function:    const tasks = createTaskActions(page); // `page` given once...
//                        await tasks.addTask('Buy milk');       // ...and remembered
//
// Pros
// - Less boilerplate than a class: no `class`, `constructor`, `this`, or inheritance.
// - Dependencies are captured once in a closure (here `page`) and reused by every returned function.
// - Flexible return shape: an object of methods (below), a single function, or test data
//   (see buildTestUser in testData.ts).
// - Easy to compose: a factory can call or wrap other factories without an inheritance tree.
// - No `new` or `this` problems: destructuring `const { addTask } = tasks` still works,
//   whereas a destructured class method would lose `this`.
//
// Cons
// - Every call creates new function instances. That doesn't matter in a test suite, but it is
//   good to know.
// - Less familiar to teams used to classical OOP (`class`, `private`, interfaces, inheritance).
// - There is no `private` keyword: values stay out of the public API by keeping them in the
//   factory's scope (see `loginPageUrl` and `usernameInput` below).
// - It can grow too large: a factory returning 15+ methods becomes a "god object". Split it by
//   page or component, as done here with createLoginActions and createTaskActions.

import { type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type TestUser } from './testData';

export function createLoginActions(page: Page) {
	// These details are private by convention: only values returned below become the public API.
	const loginPageUrl = pathToFileURL(resolve(__dirname, '../../../pages/login.html')).href;
	const usernameInput = page.getByLabel('Username');
	const passwordInput = page.getByLabel('Password');
	const signInButton = page.getByRole('button', { name: 'Sign in' });

	async function open(): Promise<void> {
		await page.goto(loginPageUrl);
	}

	async function loginAs(user: TestUser): Promise<void> {
		await usernameInput.fill(user.username);
		await passwordInput.fill(user.password);
		await signInButton.click();
	}

	// Public API: expose the assertion target, but keep form controls private to loginAs().
	return {
		errorMessage: page.getByRole('alert'),
		open,
		loginAs,
	};
}

export function createTaskActions(page: Page) {
	// Controls used only to perform actions remain inside the closure.
	const newTaskInput = page.getByLabel('New task');
	const addTaskButton = page.getByRole('button', { name: 'Add task' });

	// Match an exact accessible name; a title that is a substring of another task won't collide.
	function task(title: string) {
		const taskCheckbox = page.getByRole('checkbox', { name: title, exact: true });
		return page.getByRole('listitem').filter({ has: taskCheckbox });
	}

	// Inner functions capture page and controls through the closure, not `this`.
	async function addTask(title: string): Promise<void> {
		await newTaskInput.fill(title);
		await addTaskButton.click();
	}

	async function addTasks(titles: string[]): Promise<void> {
		for (const title of titles) {
			await addTask(title);
		}
	}

	async function completeTask(title: string): Promise<void> {
		await task(title).getByRole('checkbox').check();
	}

	async function deleteTask(title: string): Promise<void> {
		await task(title).getByRole('button', { name: `Delete ${title}`, exact: true }).click();
	}

	// Public assertion locators and actions only; tests can't reach interaction controls.
	return {
		heading: page.getByRole('heading', { level: 1 }),
		counter: page.getByRole('status'),
		task,
		addTask,
		addTasks,
		completeTask,
		deleteTask,
	};
}

// No class means no class name to use as a type. 
// TypeScript can infer the type from the factory.
export type LoginActions = ReturnType<typeof createLoginActions>;
export type TaskActions = ReturnType<typeof createTaskActions>;
