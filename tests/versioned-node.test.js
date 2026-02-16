const test = require('node:test');
const assert = require('node:assert/strict');

const { MicrosoftSentinel } = require('../dist/nodes/Microsoft/Sentinel/MicrosoftSentinel.node.js');

function getResourceValues(description) {
	const resourceProperty = (description.properties || []).find((property) => property.name === 'resource');
	return (resourceProperty?.options || []).map((option) => option.value);
}

function getIncidentOperationValues(description) {
	const incidentOperation = (description.properties || []).find((property) =>
		property.name === 'operation' &&
		property.displayOptions &&
		property.displayOptions.show &&
		Array.isArray(property.displayOptions.show.resource) &&
		property.displayOptions.show.resource.includes('incident'),
	);

	return (incidentOperation?.options || []).map((option) => option.value);
}

test('MicrosoftSentinel wrapper registers versions 1, 2, and 3 with default version 3', () => {
	const node = new MicrosoftSentinel();

	assert.deepEqual(Object.keys(node.nodeVersions).sort(), ['1', '2', '3']);
	assert.equal(node.description.defaultVersion, 3);
});

test('only v3 exposes Incident Comment as a standalone resource', () => {
	const node = new MicrosoftSentinel();

	const v1Resources = getResourceValues(node.nodeVersions['1'].description);
	const v2Resources = getResourceValues(node.nodeVersions['2'].description);
	const v3Resources = getResourceValues(node.nodeVersions['3'].description);

	assert.equal(v1Resources.includes('incidentComment'), false);
	assert.equal(v2Resources.includes('incidentComment'), false);
	assert.equal(v3Resources.includes('incidentComment'), true);
});

test('v3 incident operations exclude comment actions', () => {
	const node = new MicrosoftSentinel();
	const v3OperationValues = getIncidentOperationValues(node.nodeVersions['3'].description);

	assert.equal(v3OperationValues.includes('getComment'), false);
	assert.equal(v3OperationValues.includes('getComments'), false);
	assert.equal(v3OperationValues.includes('upsertComment'), false);
	assert.equal(v3OperationValues.includes('create'), true);
	assert.equal(v3OperationValues.includes('update'), true);
	assert.equal(v3OperationValues.includes('getAll'), true);
});
