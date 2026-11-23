// FIXTURES ENTRY POINT: the one file specs import.
//
//   app.fixture.ts     appUrls            worker fixture: page URLs, built once per worker
//   data.fixture.ts    seed               option fixture: tasks that exist at the start
//   auth.fixture.ts    guestPage,         built on app + data (layering)
//                      signedInPage
//   errors.fixture.ts  failOnPageErrors   auto fixture: runs in every test
//
// mergeTests() combines independent fixture files into one `test`. The result has every
// fixture from every file, including those auth.fixture.ts inherited from app and data.
// Fixture names must be unique across the merged files.
//
// Specs import from here, so they never need to know which file defines which fixture:
//   import { test, expect } from '../fixtures';
import { expect, mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as errorsTest } from './errors.fixture';

export const test = mergeTests(authTest, errorsTest);

// No custom matchers yet, so Playwright's own expect is enough. With custom matchers from
// several files, combine them with mergeExpects() here.
export { expect };

export type { Task, Seed } from './data.fixture';
export type { AppUrls } from './app.fixture';
