// DATA FIXTURE: what the test starts with.
//
// Job:       describe the tasks that should already exist when a test begins.
// Kind:      OPTION fixture. It has a default value and does no work itself; a spec file
//            changes it with test.use({ seed: ... }).
// Depends:   nothing.
// Used by:   auth.fixture.ts (`signedInPage` puts `seed.tasks` into the session).
//
// Keeping the data separate from the fixture that applies it means a spec changes WHAT
// it starts with without knowing HOW the data gets into the app.
import { test as base } from '@playwright/test';

export type Task = { title: string; done: boolean };

export type Seed = { tasks: Task[] };

export const test = base.extend<{ seed: Seed }>({
	// [default value, options]. `option: true` lets test.use() and the config override it.
	// The value is an object, not a bare array: test.use treats an array as [value, options].
	// See "Array as an option value": https://playwright.dev/docs/test-fixtures#fixtures-options
	seed: [{ tasks: [] }, { option: true }],
});
