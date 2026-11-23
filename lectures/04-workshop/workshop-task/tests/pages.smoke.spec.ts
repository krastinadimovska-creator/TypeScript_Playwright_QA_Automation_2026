import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Starter smoke test: it only proves that each page opens. Your own specs go next to this file
// and should use the page objects you create in ../page-objects.
const pageUrl = (file: string): string => pathToFileURL(resolve(__dirname, '../pages', file)).href;

const pages = [
	{ file: 'profile.html', heading: 'My profile' },
	{ file: 'registration.html', heading: 'Workshop registration' },
	{ file: 'attendees.html', heading: 'Attendees' },
	{ file: 'settings.html', heading: 'Settings' },
];

for (const { file, heading } of pages) {
	test(`${file} opens`, async ({ page }) => {
		await page.goto(pageUrl(file));

		await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
		await expect(page.getByText('Signed in as Alex Morgan')).toBeVisible();
	});
}
