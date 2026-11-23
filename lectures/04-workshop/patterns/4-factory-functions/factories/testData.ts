// FACTORY FUNCTION PATTERN: test data
//
// A factory can also build data instead of actions. The defaults describe a valid demo user,
// and each test overrides only the fields that matter for its scenario:
//
//   buildTestUser()                              -> the valid demo user
//   buildTestUser({ password: 'wrong-password' }) -> same user, wrong password
//
// Every call returns a NEW object, so one test cannot accidentally change data another test uses
// (a shared `const user = {...}` object could be changed by any test that imports it).

export type TestUser = Readonly<{
	username: string;
	password: string;
	displayName: string;
}>;

export function buildTestUser(overrides: Partial<TestUser> = {}): TestUser {
	// Return a fresh immutable-shaped value; the override spread must stay last.
	return {
		username: 'alex',
		password: 'secret123',
		displayName: 'Alex',
		// Spread last: any field passed in `overrides` replaces the default above.
		...overrides,
	};
}
