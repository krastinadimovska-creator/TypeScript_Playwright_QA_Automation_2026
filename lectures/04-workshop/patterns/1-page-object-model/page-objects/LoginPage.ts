import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export class LoginPage {
	private readonly usernameInput: Locator;
	private readonly passwordInput: Locator;
	private readonly signInButton: Locator;

	// Public readonly locators are assertion targets. They hide selector details while letting
	// tests use Playwright's retrying, web-first assertions.
	readonly errorMessage: Locator;

	constructor(private readonly page: Page) {
		this.usernameInput = page.locator('#username');
		this.passwordInput = page.locator('#password');
		this.signInButton = page.getByRole('button', { name: 'Sign in' });
		this.errorMessage = page.locator('#login-error');
	}

	async navigate(): Promise<void> {
		await this.page.goto(pathToFileURL(resolve(__dirname, '../../../pages/login.html')).href);
	}

	async login(username: string, password: string): Promise<void> {
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
		await this.signInButton.click();
	}
}
