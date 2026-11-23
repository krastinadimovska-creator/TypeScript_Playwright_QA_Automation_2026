import { type Locator, type Page } from '@playwright/test';

export class TasksPage {
	// Public locators support retrying assertions in tests; interaction locators stay private.
	readonly heading: Locator;
	readonly counter: Locator;
	private readonly newTaskInput: Locator;
	private readonly addTaskButton: Locator;

	constructor(private readonly page: Page) {
		this.heading = page.getByRole('heading', { level: 1 });
		this.newTaskInput = page.getByLabel('New task');
		this.addTaskButton = page.getByRole('button', { name: 'Add task' });
		this.counter = page.getByRole('status');
	}

	// Match the task by its exact accessible checkbox name so "Buy milk" won't match
	// a different task such as "Buy milk and eggs".
	task(title: string): Locator {
		const taskCheckbox = this.page.getByRole('checkbox', { name: title, exact: true });
		// Return the list item containing the exact checkbox for the task.
		return this.page.getByRole('listitem').filter({ has: taskCheckbox });
	}

	async addTask(title: string): Promise<void> {
		await this.newTaskInput.fill(title);
		await this.addTaskButton.click();
	}

	async completeTask(title: string): Promise<void> {
		await this.task(title).getByRole('checkbox').check();
	}

	async deleteTask(title: string): Promise<void> {
		await this.task(title)
			.getByRole('button', { name: `Delete ${title}`, exact: true })
			.click();
	}
}
