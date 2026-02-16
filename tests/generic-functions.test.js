const test = require('node:test');
const assert = require('node:assert/strict');

const { buildFilterString } = require('../dist/nodes/Microsoft/Sentinel/GenericFunctions.js');
const { createExecuteContext } = require('./helpers/context.js');

test('buildFilterString lowercases title search for case-insensitive filtering', async () => {
	const context = createExecuteContext({
		nodeDebug: false,
		filters: {
			title: 'PhIsHiNg',
		},
	});
	const requestOptions = {};

	await buildFilterString.call(context, requestOptions);

	assert.equal(
		requestOptions.qs.$filter,
		"contains(toLower(properties/title), 'phishing')",
	);
});

test('buildFilterString escapes single quotes in title filter', async () => {
	const context = createExecuteContext({
		nodeDebug: false,
		filters: {
			title: "O'Brien",
		},
	});
	const requestOptions = {};

	await buildFilterString.call(context, requestOptions);

	assert.equal(
		requestOptions.qs.$filter,
		"contains(toLower(properties/title), 'o%27brien')",
	);
});

test('buildFilterString combines all configured filters in deterministic order', async () => {
	const context = createExecuteContext({
		nodeDebug: false,
		filters: {
			createdAfter: '2026-01-01T00:00:00',
			modifiedAfter: '2026-01-02T00:00:00+01:00',
			incidentId: 12345,
			title: 'Credential Access',
			severity: ['High', 'Medium'],
			status: 'New, Active',
			filter: "properties/status ne 'Closed'",
		},
	});
	const requestOptions = {};

	await buildFilterString.call(context, requestOptions);

	assert.equal(
		requestOptions.qs.$filter,
		"properties/createdTimeUtc ge 2026-01-01T00:00:00Z and properties/lastModifiedTimeUtc ge 2026-01-02T00:00:00+01:00 and properties/incidentNumber eq 12345 and contains(toLower(properties/title), 'credential access') and (properties/severity eq 'High' or properties/severity eq 'Medium') and (properties/status eq 'New' or properties/status eq 'Active') and (properties/status ne 'Closed')",
	);
});

test('buildFilterString leaves request query untouched when no filters are set', async () => {
	const context = createExecuteContext({
		nodeDebug: false,
		filters: {},
	});
	const requestOptions = {};

	await buildFilterString.call(context, requestOptions);

	assert.equal(requestOptions.qs, undefined);
});
