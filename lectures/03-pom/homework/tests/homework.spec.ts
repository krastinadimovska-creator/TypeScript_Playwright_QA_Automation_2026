import { test } from '@playwright/test';

// Homework: implement these tests with the page-object model.
// Pages: ../pages/login.html, ../pages/index.html (orders) and ../pages/account.html.
// Demo account: alex.morgan@example.test / Northwind#2026
// Create LoginPage, OrdersPage and AccountPage in ../page-objects/, then replace test.fixme with test.

test.describe('Northwind Supply partner portal', () => {
	test.fixme('signs in with valid credentials and opens the orders dashboard', async () => {});

	test.fixme('shows an error message for an incorrect password', async () => {});

	test.fixme('lists all 8 orders in the grid after sign in', async () => {});

	test.fixme('able to filter the orders grid by customer name and status', async () => {});

	test.fixme('able to sort orders by total from highest to lowest', async () => {});

	test.fixme('updates the phone number on the account page and shows it in the summary', async () => {});

	test.fixme('signs out and redirects to sign in when the orders page is opened again', async () => {});
});
