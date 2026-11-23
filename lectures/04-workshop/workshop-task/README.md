# Workshop task: build page objects for EventHub

**EventHub** is a small conference app with 4 pages. Your task is to write a **page object**
for each page, then write tests that use them. The pages are plain HTML files and need no server.
Open them directly in a browser.

| Page | What you can do |
|---|---|
| [profile.html](pages/profile.html) | View your profile, edit it, and save it (inputs, select, radios, checkboxes, textarea, validation) |
| [registration.html](pages/registration.html) | Book a workshop. The total price updates live (dependent selects, radios, number input, checkboxes, FAQ accordion) |
| [attendees.html](pages/attendees.html) | Search, filter, add, edit, check in, and delete attendees (table rows, confirm dialog) |
| [settings.html](pages/settings.html) | Change settings in 4 accordion sections and save each one separately |

Data is stored in `sessionStorage`, so every test starts with the same demo data. Pages share
it within one tab, so a name you save on **Profile** appears in the header and on **Registration**.

```text
workshop-task/
  pages/          <- the app (do not change it)
  page-objects/   <- YOUR page objects go here
  tests/          <- YOUR specs go here (pages.smoke.spec.ts is a starter)
```

## Your deliverables

1. `page-objects/ProfilePage.ts`, `RegistrationPage.ts`, `AttendeesPage.ts`, `SettingsPage.ts`
2. At least **2 tests per page** in `tests/`, using only your page objects (no raw locators in specs)
3. All tests pass in Chrome and Firefox:

```bash
npx playwright test lectures/04-workshop/workshop-task
npx playwright test lectures/04-workshop/workshop-task --project=chrome --headed
```

## The pages in detail

### 1. Profile

- Read-only details first. **Edit profile** opens the form; **Save changes** / **Cancel** close it.
- Fields: First name, Last name, Email, Phone, **Country** (select), **Preferred contact** (radios),
  **Interests** (checkboxes), **Bio** (textarea with a `x / 200 characters` counter).
- Rules: first name, last name, and country are required. Email must be valid. Phone may contain only digits, spaces, `-`, and a leading `+`.
  Errors appear under each field, plus an alert: `Please fix N errors.`
- After saving: status `Profile saved.`, the details are updated, and the header shows the new name.
- **Reset to demo data** restores the starting profile.

Suggested tests: edit and save all fields, then check the details. Check that saving with an empty first name and a bad email shows 2 errors. Check that Cancel discards changes.

### 2. Registration

- **Workshop** select. The **Date** select stays disabled until you pick a workshop, then lists that workshop's dates.
- **Ticket type** radios: Standard, Student, VIP. **Student** shows a required **Student ID** field (format `S-12345`).
- **Number of seats** (1–5), **Add-ons** checkboxes, Full name and Email (prefilled from the profile), Notes.
- **Register** is disabled until you check the terms checkbox.
- On success, **Registration confirmed** appears with a reference (`EH-0001`, `EH-0002`, …) and the booking details.

Price rules (the **Order summary** shows each line and the **Total**):

| Item | Price |
|---|---|
| Playwright Basics / API Testing / CI/CD for QA / Accessibility Testing | €120 / €150 / €180 / €140 per seat |
| Student ticket | −50% of the seat price |
| VIP ticket | +€60 per seat |
| Lunch / Certificate | +€15 / +€10 per seat |
| Video recording | +€25 once |

Example: Playwright Basics, Standard, 2 seats, Lunch = 120×2 + 15×2 = **€270**.

Suggested tests: check the total for several combinations (a good fit for a data-driven `for` loop). Check that the date select is disabled at first. Check that a student ticket requires an ID. Complete a full booking.

### 3. Attendees

- A table with 5 demo attendees. Each row has a **Checked in** checkbox plus **Edit** and **Delete** buttons.
- Toolbar: **Search attendees** (name, email, company), **Filter by role** (select), **Show only checked-in**.
- The text under the table reads `Showing X of Y attendees (Z checked in)`.
- The same form adds and edits. Its heading changes to `Edit attendee: <name>` and the button to **Save changes**.
- Rules: name required, valid email, and no duplicate email (`An attendee with this email already exists.`).
- **Delete** opens a browser `confirm()` dialog. Your page object must handle it.

Suggested tests: add an attendee, edit their company, and delete a row (accept the dialog). Check that dismissing the dialog keeps the row. Check search and filter counts. Check in an attendee.

### 4. Settings

- 4 accordion sections: **Notifications** (open at start), **Privacy**, **Appearance**, **Account**,
  plus **Expand all** / **Collapse all**.
- Each section has its own **Save** button, an `Unsaved changes` badge after you edit, and a saved message
  (for example `Privacy settings saved.`).
- Rules: **Digest frequency** is disabled when Email notifications are off. **Show my email…** is disabled
  for a **Private** profile. **Display name** is required. **Delete account** is enabled only after the
  "I understand…" checkbox.
- Saving Appearance applies the theme and font size right away, and they persist after a reload.

Suggested tests: open Privacy, choose Private, and check that "Show my email" is disabled. Save notifications and check the message. Check that Expand all and Collapse all toggle every section.

## Rules for good page objects

- **One class per page**, with constructor `(private readonly page: Page)` and a `navigate()` method.
- Keep **interaction locators private**. Expose only what tests need to assert, as `readonly` locators
  or small getter methods (for example `totalPrice`, `rowFor(name)`).
- Methods describe **user intent**: `fillContactDetails(...)`, `chooseTicket('Student')`,
  `deleteAttendee(name)`. Avoid names like `clickButton3()`.
- **No assertions inside page objects.** Assertions (`expect`) stay in the tests.
- Prefer **role- and label-based locators** (`getByRole`, `getByLabel`). Use `getByTestId` where the page provides `data-testid`.
- For many fields, accept one object: `fillProfile({ firstName, country, interests })`.

## Locator hints

```ts
// Opening a local file
await page.goto(pathToFileURL(resolve(__dirname, '../pages/profile.html')).href);

// Select, radio, checkbox
await page.getByLabel('Country').selectOption('Germany');
await page.getByRole('radio', { name: 'SMS' }).check();
await page.getByRole('checkbox', { name: 'Security' }).setChecked(true);

// Careful: on Profile, getByLabel('Email') matches the Email textbox AND the "Email" radio.
// Be specific with the role:
page.getByRole('textbox', { name: 'Email' });

// A table row, and a button inside it
page.getByTestId('attendee-row').filter({ hasText: 'Maria Ivanova' });
page.getByRole('button', { name: 'Delete Maria Ivanova' });

// confirm() dialog: register the handler BEFORE the click
page.once('dialog', (dialog) => dialog.accept());   // or dialog.dismiss()

// Accordion: a section is open when its button has aria-expanded="true"
page.getByRole('button', { name: 'Privacy' });
page.getByRole('region', { name: 'Privacy' });       // the panel; scope locators inside it
await expect(page.getByRole('button', { name: 'Privacy' })).toHaveAttribute('aria-expanded', 'true');

// Native <details> FAQ
await page.getByText('Is lunch vegetarian?').click();
```

> Tip: the panels repeat names like **Email** and the **Save** buttons. Scope your locators to a
> section, for example `page.getByRole('region', { name: 'Notifications' }).getByRole('checkbox', { name: 'Email', exact: true })`.

## Stretch goals

1. **Component objects:** an `AccordionSection` class (`open()`, `save()`, `isOpen()`) reused by
   `SettingsPage`, or an `AttendeeRow` class returned by `AttendeesPage.row(name)`.
2. **Shared header:** a `HeaderComponent` (navigation + `Signed in as …`) used by all 4 page objects.
3. **Fixtures:** provide your page objects through `test.extend` (see `../patterns/3-fixtures`).
4. **Test data factory:** `buildAttendee(overrides)` with unique emails (see `../patterns/4-factory-functions`).
5. **Cross-page flow:** change the name on Profile, then check that Registration prefills it.
6. Rewrite one page object as **functional helpers** or a **factory function**. Which one reads best?
