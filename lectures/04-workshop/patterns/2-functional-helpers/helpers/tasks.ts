import { type Locator, type Page } from '@playwright/test';

// Helpers keep no page state between calls; every dependency is passed explicitly.
export function taskItem(page: Page, title: string): Locator {
	const taskCheckbox = page.getByRole('checkbox', { name: title, exact: true });
	return page.getByRole('listitem').filter({ has: taskCheckbox });
}

export function taskCounter(page: Page): Locator {
	return page.getByRole('status');
}

export function welcomeHeading(page: Page): Locator {
	return page.getByRole('heading', { level: 1 });
}

// Each action is a plain function; tests can see exactly which page it acts on.
export async function addTask(page: Page, title: string): Promise<void> {
	await page.getByLabel('New task').fill(title);
	await page.getByRole('button', { name: 'Add task' }).click();
}

// Small helpers compose into bigger workflows.
export async function addTasks(page: Page, titles: string[]): Promise<void> {
	for (const title of titles) {
		await addTask(page, title);
	}
}

export async function completeTask(page: Page, title: string): Promise<void> {
	await taskItem(page, title).getByRole('checkbox').check();
}

export async function deleteTask(page: Page, title: string): Promise<void> {
	await taskItem(page, title).getByRole('button', { name: `Delete ${title}`, exact: true }).click();
}
