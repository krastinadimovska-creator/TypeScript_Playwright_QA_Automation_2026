import { type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// A focused navigation helper keeps the local file URL out of each test.
export async function openLoginPage(page: Page): Promise<void> {
	await page.goto(pathToFileURL(resolve(__dirname, '../../../pages/login.html')).href);
}

// This module keeps no page or test state: dependencies and test data are explicit arguments.
export async function login(page: Page, username: string, password: string): Promise<void> {
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
}
