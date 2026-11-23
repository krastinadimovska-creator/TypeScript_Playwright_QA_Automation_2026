// EventHub: shared helpers for all four pages.
// Data lives in sessionStorage, so it survives navigation between pages in the same tab,
// and every Playwright test (a new browser context) starts with the default data.
const EventHub = {
	load(key, fallback) {
		const raw = sessionStorage.getItem(`eventhub-${key}`);
		return raw ? JSON.parse(raw) : structuredClone(fallback);
	},
	save(key, value) {
		sessionStorage.setItem(`eventhub-${key}`, JSON.stringify(value));
	},
	defaultProfile: {
		firstName: 'Alex', lastName: 'Morgan', email: 'alex.morgan@example.com', phone: '+359 888 123 456',
		country: 'Bulgaria', contact: 'Email', interests: ['Test automation'], bio: '',
	},
	isValidEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	},
	// Shows or clears the message under a field (id "<field-id>-error") and sets aria-invalid.
	setFieldError(input, message) {
		const error = document.getElementById(`${input.id}-error`);
		error.textContent = message ?? '';
		error.hidden = !message;
		if (message) input.setAttribute('aria-invalid', 'true');
		else input.removeAttribute('aria-invalid');
		return !message;
	},
	renderHeader() {
		const profile = EventHub.load('profile', EventHub.defaultProfile);
		document.getElementById('current-user').textContent = `Signed in as ${profile.firstName} ${profile.lastName}`;
		const page = location.pathname.split('/').pop();
		document.querySelectorAll('.site-header nav a').forEach((link) => {
			if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
		});
		const appearance = EventHub.load('settings', {}).appearance ?? {};
		document.body.classList.toggle('theme-dark', appearance.theme === 'Dark');
		document.body.classList.toggle('font-small', appearance.fontSize === 'Small');
		document.body.classList.toggle('font-large', appearance.fontSize === 'Large');
	},
};
