import { randomUUID } from 'crypto';
import {
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type INodeExecutionData,
	type IN8nHttpFullResponse,
	type IDataObject,
	type JsonObject,
} from 'n8n-workflow';
import type { KQLColumn, IncidentFilters } from './types';

/**
 * Logs the request options if debugging is enabled.
 * @param this - The execution context containing node parameters and logger.
 * @param requestOptions - The HTTP request options.
 * @returns The unchanged request options.
 */
export async function debugRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	if (nodeDebug) {
		const sentinelInstance = this.getNodeParameter('sentinelInstance') as IDataObject;
		this.logger.info(`[debugRequest] sentinelInstance: ${JSON.stringify(sentinelInstance)}`);
		this.logger.info(`[debugRequest] sentinelInstance.value: ${sentinelInstance.value}`);
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] REQUEST - ${JSON.stringify(requestOptions, null, 2)}`
		);
	}
	return requestOptions;
}

/**
 * Logs the response if debugging is enabled.
 * @param this - The execution context containing node parameters and logger.
 * @param items - The node execution data items.
 * @param response - The full HTTP response.
 * @returns The unchanged node execution data items.
 */
export async function debugResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
) {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	if (nodeDebug) {
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] RESPONSE - ${JSON.stringify(response, null, 2)}`
		);
	}
	return items;
}

/**
 * Builds an OData filter clause for a given property and operator.
 * @param property - The property to filter.
 * @param operator - The operator to use (e.g., 'eq').
 * @param values - The array of values for the filter.
 * @returns The constructed filter clause.
 */
function buildODataFilterClause(property: string, operator: string, values: string[]): string {
	const joinedValues = values.join(`' or ${property} ${operator} '`);
	return `(${property} ${operator} '${joinedValues}')`;
}

/**
 * Normalizes a date string to ISO 8601 format with timezone information.
 * Azure OData requires DateTimeOffset values in format 'yyyy-mm-ddThh:mm:ss(.s+)?(zzzzzz)?'
 * @param dateString - The date string to normalize.
 * @returns The normalized date string with timezone information.
 */
function normalizeDateForOData(dateString: string): string {
	// If already has timezone info (ends with Z or has offset like +00:00), return as is
	if (dateString.match(/Z$|[+-]\d{2}:\d{2}$/)) {
		return dateString;
	}
	// Otherwise, assume UTC and append 'Z'
	return `${dateString}Z`;
}

/**
 * Builds the OData filter string based on provided filter parameters.
 * @param this - The execution context containing node parameters and logger.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options with the OData filter applied.
 */
export async function buildFilterString(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	const filterClauses: string[] = [];
	const filters = this.getNodeParameter('filters', {}) as IncidentFilters;

	// Check for date-based filters
	if (filters.createdAfter) {
		const createdAfter = normalizeDateForOData(filters.createdAfter);
		filterClauses.push(`properties/createdTimeUtc ge ${createdAfter}`);
	}
	if (filters.modifiedAfter) {
		const modifiedAfter = normalizeDateForOData(filters.modifiedAfter);
		filterClauses.push(`properties/lastModifiedTimeUtc ge ${modifiedAfter}`);
	}

	// Filter by incident ID
	if (filters.incidentId) {
		filterClauses.push(`properties/incidentNumber eq ${filters.incidentId}`);
	}

	// Filter by title with proper sanitization
	if (filters.title) {
		const sanitizedTitle = filters.title.replace(/'/g, '%27');
		filterClauses.push(`contains(toLower(properties/title), '${sanitizedTitle}')`);
	}

	// Process array-based filters for severity
	if (filters.severity && filters.severity.length) {
		const severityValues = typeof filters.severity === 'string'
			? filters.severity.split(/, */)
			: filters.severity;
		filterClauses.push(buildODataFilterClause('properties/severity', 'eq', severityValues));
	}

	// Process array-based filters for status
	if (filters.status && filters.status.length) {
		const statusValues = typeof filters.status === 'string'
			? filters.status.split(/, */)
			: filters.status;
		filterClauses.push(buildODataFilterClause('properties/status', 'eq', statusValues));
	}

	// Additional raw filter clause, if provided
	if (filters.filter) {
		filterClauses.push(`(${filters.filter})`);
	}

	// If there are any filter clauses, attach them to the query string.
	if (filterClauses.length) {
		requestOptions.qs = {
			...requestOptions.qs,
			$filter: filterClauses.join(' and '),
		};
		if (nodeDebug) {
			this.logger.info(
				`[${this.getNode().type} | ${this.getNode().name}] - OData $filter: ${filterClauses.join(' and ')}`
			);
		}
	}

	return requestOptions;
}

/**
 * Applies common transformations to the request options.
 * Chains the addUUID and mergeProperties functions.
 * @param context - The execution context.
 * @param requestOptions - The HTTP request options to transform.
 * @returns The transformed request options.
 */
async function applyTransformations(
	context: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions = await addUUID.call(context, requestOptions);
	requestOptions = await mergeProperties.call(context, requestOptions);
	return requestOptions;
}

/**
 * Adds a unique identifier to the request URL.
 * @param this - The execution context containing node parameters.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options with the objectId appended.
 */
export async function addUUID(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const objectId = this.getNodeParameter('options.objectId', randomUUID()) as string;
	// Append the objectId (or a new UUID if objectId is falsy) to the URL.
	requestOptions.url = `${requestOptions.url}/${objectId || randomUUID()}`;
	return requestOptions;
}

/**
 * Merges custom properties into the request body.
 * @param this - The execution context containing node parameters.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options with merged properties.
 */
export async function mergeProperties(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const customProperties = this.getNodeParameter('options.customProperties', {}) as IDataObject;
	// Ensure the body and its properties object exist before merging.
	if (!requestOptions.body) {
		requestOptions.body = {};
	}
	const body = requestOptions.body as IDataObject;
	if (!body.properties) {
		body.properties = {};
	}
	body.properties = {
		...customProperties,
		...(body.properties as IDataObject),
	};
	return requestOptions;
}

/**
 * Upserts an alert rule by preparing the request body and applying common transformations.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the upsert operation.
 */
export async function upsertAlertRule(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = {
		kind: this.getNodeParameter('ruleType', 'Scheduled') as string,
		etag: this.getNodeParameter('options.etag', null) as string,
		properties: {
			displayName: this.getNodeParameter('displayName') as string,
			enabled: this.getNodeParameter('enabled') as boolean,
			severity: this.getNodeParameter('severity') as string,
			query: this.getNodeParameter('query') as string,
			queryFrequency: this.getNodeParameter('queryFrequency', null) as string,
			queryPeriod: this.getNodeParameter('queryPeriod', null) as string,
			suppressionDuration: this.getNodeParameter('additionalFields.suppressionDuration', 'PT5H') as string,
			suppressionEnabled: this.getNodeParameter('additionalFields.suppressionEnabled', false) as boolean,
			triggerOperator: this.getNodeParameter('triggerOperator', null) as string,
			triggerThreshold: this.getNodeParameter('triggerThreshold', null) as number,
			...((this.getNodeParameter('additionalFields') ?? {}) as JsonObject),
		},
	};

	return applyTransformations(this, requestOptions);
}

/**
 * Upserts an incident by preparing the request body and applying common transformations.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the upsert operation.
 */
export async function upsertIncident(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = {
		etag: this.getNodeParameter('options.etag', null) as string,
		properties: {
			title: this.getNodeParameter('title') as string,
			description: this.getNodeParameter('description') as string,
			severity: this.getNodeParameter('severity') as string,
			status: this.getNodeParameter('status') as string,
		},
	};
	return applyTransformations(this, requestOptions);
}

/**
 * Upserts an automation rule by applying common transformations.
 * This function does not modify the request body.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to transform.
 * @returns The modified request options ready for the upsert operation.
 */
export async function upsertAutomationRule(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	return applyTransformations(this, requestOptions);
}

/**
 * Creates a comment by preparing the request body and adding a UUID.
 * Used for the Create operation in the Incident Comment resource.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the create operation.
 */
export async function upsertComment(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = {
		etag: this.getNodeParameter('options.etag', null) as string,
		properties: {
			message: this.getNodeParameter('message') as string,
		},
	};
	return applyTransformations(this, requestOptions);
}

/**
 * Updates a comment by preparing the request body.
 * Used for the Update operation in the Incident Comment resource.
 * Does not add UUID since commentId is already in the URL.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the update operation.
 */
export async function updateComment(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = {
		etag: this.getNodeParameter('options.etag', null) as string,
		properties: {
			message: this.getNodeParameter('message') as string,
		},
	};
	return requestOptions;
}

/**
 * Processes the query results by mapping rows to JSON objects.
 * @param this - The execution context.
 * @param items - The node execution data items (will be replaced).
 * @param response - The full HTTP response from the query.
 * @returns An array of node execution data with parsed results.
 */
export async function processQueryResults(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	items = [];
	// Access the first table in the response
	const responseBody = response.body as IDataObject;
	const tables = responseBody.Tables as IDataObject[];
	const results: JsonObject = tables[0] as JsonObject;
	const columns = results.Columns as unknown as KQLColumn[];
	const rows = results.Rows as [];

	// Map each row to an object using column definitions
	rows.forEach((row) => {
		const rowData: JsonObject = {};
		columns.forEach((column, index: number) => {
			rowData[column.ColumnName] = row[index];
		});
		items.push({
			json: rowData,
			pairedItem: this.getItemIndex(),
		});
	});

	return items;
}

/**
 * Prepares the output items based on node parameters.
 * Formats the items either as individual items or grouped under a single key.
 * @param this - The execution context.
 * @param items - The node execution data items.
 * @returns An array of node execution data with formatted output.
 */
export async function prepareOutput(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	const simple = this.getNodeParameter('options.simple', true) as boolean;
	const splitResults = this.getNodeParameter('options.splitResults', true) as boolean;

	if (nodeDebug) {
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] - Parsing properties of ${items.length} items`
		);
	}

	// Format each item based on the 'simple' flag
	items = items.map((item) => {
		item.pairedItem = this.getItemIndex();
		if (simple) {
			item.json = {
				id: item.json.name,
				kind: item.json.kind,
				...(item.json.properties as JsonObject),
				etag: item.json.etag,
			};
		}
		return item;
	});

	// Return items as separate entries or grouped under a single key
	if (splitResults) {
		return items;
	} else {
		let outKey = (this.getNodeParameter('operation', 'results') as string).toLowerCase();
		// Remove prepended 'get' from outKey if present
		if (outKey.startsWith('get')) {
			outKey = outKey.slice(3);
		}
		return [
			{
				json: {
					[outKey]: items.map((item) => item.json),
				},
				pairedItem: this.getItemIndex(),
			},
		];
	}
}

/**
 * Parses label input as either comma-separated string or JSON array.
 * @param input - The label input (string or array).
 * @returns An array of label strings.
 */
export function parseLabels(input: string | string[]): string[] {
	if (Array.isArray(input)) {
		return input.filter((s) => s.length > 0);
	}

	if (typeof input === 'string') {
		// Try parsing as JSON array first
		try {
			const parsed = JSON.parse(input);
			if (Array.isArray(parsed)) {
				return parsed.filter((s) => typeof s === 'string' && s.length > 0);
			}
		} catch {
			// Not valid JSON, continue to comma-separated parsing
		}

		// Parse as comma-separated string
		return input.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
	}

	return [];
}

/**
 * Fetches an existing incident by ID.
 * @param this - The execution context.
 * @param incidentId - The incident ID to fetch.
 * @returns The incident data.
 */
async function getIncident(
	this: IExecuteSingleFunctions,
	incidentId: string,
): Promise<IDataObject> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	const sentinelInstance = this.getNodeParameter('sentinelInstance') as IDataObject;
	const instanceValue = sentinelInstance.value as string;

	if (nodeDebug) {
		this.logger.info(`[getIncident] sentinelInstance raw: ${JSON.stringify(sentinelInstance)}`);
		this.logger.info(`[getIncident] instanceValue: ${instanceValue}`);
		this.logger.info(`[getIncident] incidentId: ${incidentId}`);
	}

	// Parse the instance value to extract subscription, resource group, and workspace
	const subscriptionMatch = instanceValue.match(/(?:%2F)?([0-9a-fA-F-]{36})/);
	const resourceGroupMatch = instanceValue.match(/resourceGroups(?:%2F|\/)(.*?)(?:%2F|\/)/i) ||
		instanceValue.split('/')[1];
	const workspaceMatch = instanceValue.match(/(?:%2F|\/)(?:sentinel|workspaces)(?:%2F|\/)(.*?)(?:%2F|\/|$)/i) ||
		instanceValue.split('/')[2];

	const subscriptionId = subscriptionMatch ? subscriptionMatch[1] : '';
	const resourceGroup = typeof resourceGroupMatch === 'string' ? resourceGroupMatch : resourceGroupMatch[1];
	const workspace = typeof workspaceMatch === 'string' ? workspaceMatch : workspaceMatch[1];

	const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspace}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`;

	if (nodeDebug) {
		this.logger.info(`[getIncident] Fetching incident from URL: ${url}`);
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'microsoftSentinelOAuth2Api',
			{
				method: 'GET',
				url,
				qs: {
					'api-version': '2025-07-01-preview',
				},
			},
		);

		if (nodeDebug) {
			this.logger.info(`[getIncident] Successfully fetched incident`);
		}

		return response as IDataObject;
	} catch (error) {
		this.logger.error(`[getIncident] Failed to fetch incident: ${error.message}`);
		throw error;
	}
}

/**
 * Helper function to apply additional fields to incident properties.
 * Handles classification, owner, dates, labels, and other optional fields.
 * For update operations, uses 'in' operator to preserve unspecified fields.
 * @param additionalFields - The additional fields from the node parameter.
 * @param properties - The properties object to modify.
 * @param currentProperties - Optional current properties for update operations (preserves values).
 */
function applyAdditionalFieldsToProperties(
	additionalFields: IDataObject,
	properties: IDataObject,
	currentProperties?: IDataObject,
): void {
	const isUpdate = !!currentProperties;

	// Description
	if ('description' in additionalFields) {
		properties.description = additionalFields.description;
	} else if (isUpdate && currentProperties!.description) {
		properties.description = currentProperties!.description;
	}

	// Handle classification fields - parse combined classificationAndReason field
	if ('classificationAndReason' in additionalFields) {
		const classificationValue = additionalFields.classificationAndReason as string;
		if (classificationValue.includes(':')) {
			const [classification, reason] = classificationValue.split(':');
			properties.classification = classification;
			properties.classificationReason = reason;
		} else {
			// Just classification without reason (e.g., 'Undetermined')
			properties.classification = classificationValue;
		}
	} else if (isUpdate && currentProperties!.classification) {
		// Preserve current classification and reason
		properties.classification = currentProperties!.classification;
		if (currentProperties!.classificationReason) {
			properties.classificationReason = currentProperties!.classificationReason;
		}
	}

	// classificationComment is allowed for all classification values
	if ('classificationComment' in additionalFields) {
		properties.classificationComment = additionalFields.classificationComment;
	} else if (isUpdate && currentProperties!.classificationComment) {
		properties.classificationComment = currentProperties!.classificationComment;
	}

	// Date fields with normalization
	if ('firstActivityTimeUtc' in additionalFields) {
		properties.firstActivityTimeUtc = additionalFields.firstActivityTimeUtc
			? normalizeDateForOData(additionalFields.firstActivityTimeUtc as string)
			: null;
	} else if (isUpdate && currentProperties!.firstActivityTimeUtc) {
		properties.firstActivityTimeUtc = normalizeDateForOData(currentProperties!.firstActivityTimeUtc as string);
	}

	if ('lastActivityTimeUtc' in additionalFields) {
		properties.lastActivityTimeUtc = additionalFields.lastActivityTimeUtc
			? normalizeDateForOData(additionalFields.lastActivityTimeUtc as string)
			: null;
	} else if (isUpdate && currentProperties!.lastActivityTimeUtc) {
		properties.lastActivityTimeUtc = normalizeDateForOData(currentProperties!.lastActivityTimeUtc as string);
	}

	// Owner field - convert UPN string to owner object
	if ('owner' in additionalFields) {
		if (additionalFields.owner) {
			const ownerUpn = additionalFields.owner as string;
			properties.owner = {
				email: ownerUpn,
				assignedTo: ownerUpn,
				ownerType: 'User',
			};
		} else {
			// Explicitly clear owner
			properties.owner = null;
		}
	} else if (isUpdate && currentProperties!.owner) {
		properties.owner = currentProperties!.owner;
	}

	// Handle labels
	if ('labels' in additionalFields) {
		const labelInput = additionalFields.labels as string | string[];
		const labelMode = additionalFields.labelMode as string || 'add';
		const parsedLabels = parseLabels(labelInput);

		if (labelMode === 'replace' || !isUpdate) {
			// For create or replace mode, set the labels directly
			properties.labels = parsedLabels.map((labelName) => ({
				labelName,
				labelType: 'User',
			}));
		} else if (labelMode === 'add') {
			// For update with add mode, merge with current labels
			const currentLabels = (currentProperties!.labels as IDataObject[]) || [];
			const existingLabelNames = currentLabels.map((label) => label.labelName as string);
			const newLabels = parsedLabels
				.filter((labelName) => !existingLabelNames.includes(labelName))
				.map((labelName) => ({
					labelName,
					labelType: 'User',
				}));
			properties.labels = [...currentLabels, ...newLabels];
		}
	} else if (isUpdate && currentProperties!.labels) {
		// Preserve current labels
		properties.labels = currentProperties!.labels;
	}
}

/**
 * Creates an incident by preparing the request body with user-specified fields only.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the create operation.
 */
export async function createIncident(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const properties: IDataObject = {
		title: this.getNodeParameter('title') as string,
		severity: this.getNodeParameter('severity') as string,
		status: this.getNodeParameter('status') as string,
	};

	// Add optional fields from Additional Fields collection
	const additionalFields = this.getNodeParameter('additionalFields', {}) as IDataObject;
	applyAdditionalFieldsToProperties(additionalFields, properties);

	requestOptions.body = {
		properties,
	};

	return applyTransformations(this, requestOptions);
}

/**
 * Updates an incident by fetching current values and merging with user-provided fields.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the update operation.
 */
export async function updateIncident(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const incidentId = this.getNodeParameter('incidentId') as string;
	const forceUpdate = this.getNodeParameter('options.forceUpdate', false) as boolean;

	// Fetch current incident
	const currentIncident = await getIncident.call(this, incidentId);
	const currentProperties = currentIncident.properties as IDataObject;

	// Get user-provided fields from Additional Fields
	const additionalFields = this.getNodeParameter('additionalFields', {}) as IDataObject;

	// Build properties object, preserving current values if not provided by user
	// Use 'in' operator to distinguish between undefined (not provided) and null/empty (explicitly clearing)
	const properties: IDataObject = {
		title: 'title' in additionalFields ? additionalFields.title : currentProperties.title,
		severity: 'severity' in additionalFields ? additionalFields.severity : currentProperties.severity,
		status: 'status' in additionalFields ? additionalFields.status : currentProperties.status,
	};

	// Apply all additional fields using shared helper function
	applyAdditionalFieldsToProperties(additionalFields, properties, currentProperties);

	const body: IDataObject = {
		properties,
	};

	// Include etag unless force update is enabled
	if (!forceUpdate) {
		body.etag = currentIncident.etag;
	}

	requestOptions.body = body;

	// Add UUID to URL
	requestOptions.url = `${requestOptions.url}/${incidentId}`;

	return mergeProperties.call(this, requestOptions);
}

/**
 * Adds label(s) to an existing incident.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the operation.
 */
export async function addLabelsToIncident(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const incidentId = this.getNodeParameter('incidentId') as string;
	const forceUpdate = this.getNodeParameter('options.forceUpdate', false) as boolean;
	const labelInput = this.getNodeParameter('labels') as string | string[];

	// Fetch current incident
	const currentIncident = await getIncident.call(this, incidentId);
	const currentProperties = currentIncident.properties as IDataObject;
	const currentLabels = (currentProperties.labels as IDataObject[]) || [];

	// Parse new labels
	const parsedLabels = parseLabels(labelInput);

	// Add new labels to existing ones (avoid duplicates)
	const existingLabelNames = currentLabels.map((label) => label.labelName as string);
	const newLabels = parsedLabels
		.filter((labelName) => !existingLabelNames.includes(labelName))
		.map((labelName) => ({
			labelName,
			labelType: 'User',
		}));

	const properties: IDataObject = {
		title: currentProperties.title,
		severity: currentProperties.severity,
		status: currentProperties.status,
		description: currentProperties.description,
		owner: currentProperties.owner,
		labels: [...currentLabels, ...newLabels],
	};

	// Handle classification fields - preserve current classification and reason
	if (currentProperties.classification) {
		properties.classification = currentProperties.classification;
		// classificationComment is allowed for all classification values
		properties.classificationComment = currentProperties.classificationComment;
		// Preserve classificationReason if present (it's already valid since it came from Azure)
		if (currentProperties.classificationReason) {
			properties.classificationReason = currentProperties.classificationReason;
		}
	}

	// Handle date fields with normalization
	if (currentProperties.firstActivityTimeUtc) {
		properties.firstActivityTimeUtc = normalizeDateForOData(currentProperties.firstActivityTimeUtc as string);
	}
	if (currentProperties.lastActivityTimeUtc) {
		properties.lastActivityTimeUtc = normalizeDateForOData(currentProperties.lastActivityTimeUtc as string);
	}

	const body: IDataObject = {
		properties,
	};

	// Include etag unless force update is enabled
	if (!forceUpdate) {
		body.etag = currentIncident.etag;
	}

	requestOptions.body = body;
	requestOptions.url = `${requestOptions.url}/${incidentId}`;

	return requestOptions;
}

/**
 * Removes label(s) from an existing incident.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the operation.
 */
export async function removeLabelsFromIncident(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const incidentId = this.getNodeParameter('incidentId') as string;
	const forceUpdate = this.getNodeParameter('options.forceUpdate', false) as boolean;
	const labelInput = this.getNodeParameter('labels') as string | string[];

	// Fetch current incident
	const currentIncident = await getIncident.call(this, incidentId);
	const currentProperties = currentIncident.properties as IDataObject;
	const currentLabels = (currentProperties.labels as IDataObject[]) || [];

	// Parse labels to remove
	const labelsToRemove = parseLabels(labelInput);

	// Filter out labels that should be removed
	const remainingLabels = currentLabels.filter(
		(label) => !labelsToRemove.includes(label.labelName as string),
	);

	const properties: IDataObject = {
		title: currentProperties.title,
		severity: currentProperties.severity,
		status: currentProperties.status,
		description: currentProperties.description,
		owner: currentProperties.owner,
		labels: remainingLabels,
	};

	// Handle classification fields - preserve current classification and reason
	if (currentProperties.classification) {
		properties.classification = currentProperties.classification;
		// classificationComment is allowed for all classification values
		properties.classificationComment = currentProperties.classificationComment;
		// Preserve classificationReason if present (it's already valid since it came from Azure)
		if (currentProperties.classificationReason) {
			properties.classificationReason = currentProperties.classificationReason;
		}
	}

	// Handle date fields with normalization
	if (currentProperties.firstActivityTimeUtc) {
		properties.firstActivityTimeUtc = normalizeDateForOData(currentProperties.firstActivityTimeUtc as string);
	}
	if (currentProperties.lastActivityTimeUtc) {
		properties.lastActivityTimeUtc = normalizeDateForOData(currentProperties.lastActivityTimeUtc as string);
	}

	const body: IDataObject = {
		properties,
	};

	// Include etag unless force update is enabled
	if (!forceUpdate) {
		body.etag = currentIncident.etag;
	}

	requestOptions.body = body;
	requestOptions.url = `${requestOptions.url}/${incidentId}`;

	return requestOptions;
}

/**
 * Concurrency limit for parallel requests when fetching related data.
 */
const INCIDENT_CONCURRENCY = 12;

/**
 * Builds the base URL for incident-related API calls.
 * @param context - The execution context.
 * @returns The base URL for incident API calls.
 */
function buildIncidentBaseUrl(context: IExecuteSingleFunctions): string {
	const sentinelInstance = context.getNodeParameter('sentinelInstance') as IDataObject;
	const instanceValue = sentinelInstance.value as string;

	// Parse the instance value to extract subscription, resource group, and workspace
	const subscriptionMatch = instanceValue.match(/(?:%2F)?([0-9a-fA-F-]{36})/);
	const resourceGroupMatch = instanceValue.match(/resourceGroups(?:%2F|\/)(.*?)(?:%2F|\/)/i) ||
		instanceValue.split('/')[1];
	const workspaceMatch = instanceValue.match(/(?:%2F|\/)(?:sentinel|workspaces)(?:%2F|\/)(.*?)(?:%2F|\/|$)/i) ||
		instanceValue.split('/')[2];

	const subscriptionId = subscriptionMatch ? subscriptionMatch[1] : '';
	const resourceGroup = typeof resourceGroupMatch === 'string' ? resourceGroupMatch : resourceGroupMatch[1];
	const workspace = typeof workspaceMatch === 'string' ? workspaceMatch : workspaceMatch[1];

	return `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspace}/providers/Microsoft.SecurityInsights`;
}

/**
 * Fetches alerts for an incident.
 * @param context - The execution context.
 * @param baseUrl - The base URL for API calls.
 * @param incidentId - The incident ID.
 * @param simple - Whether to simplify the response.
 * @returns Array of alerts.
 */
async function fetchIncidentAlerts(
	context: IExecuteSingleFunctions,
	baseUrl: string,
	incidentId: string,
	simple: boolean,
): Promise<IDataObject[]> {
	const url = `${baseUrl}/incidents/${incidentId}/alerts`;

	const response = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'microsoftSentinelOAuth2Api',
		{
			method: 'POST',
			url,
			qs: { 'api-version': '2025-07-01-preview' },
		},
	);

	const alerts = (response as IDataObject).value as IDataObject[] || [];

	if (simple) {
		return alerts.map((alert) => ({
			id: alert.name,
			kind: alert.kind,
			...(alert.properties as IDataObject),
		}));
	}

	return alerts;
}

/**
 * Fetches entities for an incident.
 * @param context - The execution context.
 * @param baseUrl - The base URL for API calls.
 * @param incidentId - The incident ID.
 * @param simple - Whether to simplify the response.
 * @returns Array of entities.
 */
async function fetchIncidentEntities(
	context: IExecuteSingleFunctions,
	baseUrl: string,
	incidentId: string,
	simple: boolean,
): Promise<IDataObject[]> {
	const url = `${baseUrl}/incidents/${incidentId}/entities`;

	const response = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'microsoftSentinelOAuth2Api',
		{
			method: 'POST',
			url,
			qs: { 'api-version': '2025-07-01-preview' },
		},
	);

	const entities = (response as IDataObject).entities as IDataObject[] || [];

	if (simple) {
		return entities.map((entity) => ({
			id: entity.name,
			kind: entity.kind,
			...(entity.properties as IDataObject),
		}));
	}

	return entities;
}

/**
 * Fetches comments for an incident (handles pagination).
 * @param context - The execution context.
 * @param baseUrl - The base URL for API calls.
 * @param incidentId - The incident ID.
 * @param simple - Whether to simplify the response.
 * @returns Array of comments.
 */
async function fetchIncidentComments(
	context: IExecuteSingleFunctions,
	baseUrl: string,
	incidentId: string,
	simple: boolean,
): Promise<IDataObject[]> {
	const allComments: IDataObject[] = [];
	let url: string | undefined = `${baseUrl}/incidents/${incidentId}/comments`;

	while (url) {
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			'microsoftSentinelOAuth2Api',
			{
				method: 'GET',
				url,
				qs: { 'api-version': '2025-07-01-preview', $top: 100 },
			},
		) as IDataObject;

		const comments = response.value as IDataObject[] || [];
		allComments.push(...comments);

		// Handle pagination
		url = response.nextLink as string | undefined;
	}

	if (simple) {
		return allComments.map((comment) => ({
			id: comment.name,
			...(comment.properties as IDataObject),
			etag: comment.etag,
		}));
	}

	return allComments;
}

/**
 * PostReceive function that fetches related data (alerts, entities, comments) for incidents.
 * Uses parallel fetching with concurrency limit.
 * @param this - The execution context.
 * @param items - The incident items from the API response.
 * @returns Items with related data merged in.
 */
export async function includeRelatedData(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const nodeDebug = this.getNodeParameter('nodeDebug', false) as boolean;
	const includeAlerts = this.getNodeParameter('options.includeAlerts', false) as boolean;
	const includeComments = this.getNodeParameter('options.includeComments', false) as boolean;
	const includeEntities = this.getNodeParameter('options.includeEntities', false) as boolean;
	const simple = this.getNodeParameter('options.simple', true) as boolean;

	// If no include options are enabled, return items unchanged
	if (!includeAlerts && !includeComments && !includeEntities) {
		return items;
	}

	if (nodeDebug) {
		this.logger.info(
			`[includeRelatedData] Fetching related data for ${items.length} incidents. ` +
			`Alerts: ${includeAlerts}, Comments: ${includeComments}, Entities: ${includeEntities}`
		);
	}

	const baseUrl = buildIncidentBaseUrl(this);

	// Process incidents in batches to respect concurrency limit
	for (let i = 0; i < items.length; i += INCIDENT_CONCURRENCY) {
		const batch = items.slice(i, i + INCIDENT_CONCURRENCY);

		await Promise.all(batch.map(async (item) => {
			// Get incident ID from the item
			// When simple=true: prepareOutput sets 'id' to the incident UUID
			// When simple=false: raw response has 'name' as UUID, 'id' as full resource path
			const incidentId = simple
				? (item.json.id as string)
				: (item.json.name as string);

			if (!incidentId) {
				if (nodeDebug) {
					this.logger.warn('[includeRelatedData] Could not determine incident ID for item');
				}
				return;
			}

			try {
				// Fetch all enabled related data in parallel
				const fetchPromises: Promise<void>[] = [];

				if (includeAlerts) {
					fetchPromises.push(
						fetchIncidentAlerts(this, baseUrl, incidentId, simple)
							.then((alerts) => { item.json.Alerts = alerts; })
							.catch((error) => {
								if (nodeDebug) {
									this.logger.error(`[includeRelatedData] Failed to fetch alerts for ${incidentId}: ${error.message}`);
								}
								item.json.Alerts = [];
							})
					);
				}

				if (includeEntities) {
					fetchPromises.push(
						fetchIncidentEntities(this, baseUrl, incidentId, simple)
							.then((entities) => { item.json.Entities = entities; })
							.catch((error) => {
								if (nodeDebug) {
									this.logger.error(`[includeRelatedData] Failed to fetch entities for ${incidentId}: ${error.message}`);
								}
								item.json.Entities = [];
							})
					);
				}

				if (includeComments) {
					fetchPromises.push(
						fetchIncidentComments(this, baseUrl, incidentId, simple)
							.then((comments) => { item.json.Comments = comments; })
							.catch((error) => {
								if (nodeDebug) {
									this.logger.error(`[includeRelatedData] Failed to fetch comments for ${incidentId}: ${error.message}`);
								}
								item.json.Comments = [];
							})
					);
				}

				await Promise.all(fetchPromises);
			} catch (error) {
				if (nodeDebug) {
					this.logger.error(`[includeRelatedData] Error processing incident ${incidentId}: ${error.message}`);
				}
			}
		}));
	}

	if (nodeDebug) {
		this.logger.info(`[includeRelatedData] Completed fetching related data for ${items.length} incidents`);
	}

	return items;
}

/**
 * The workspace query to retrieve Sentinel workspace information.
 * @see https://learn.microsoft.com/en-us/rest/api/azureresourcegraph/resourcegraph/resources/resources?view=rest-azureresourcegraph-resourcegraph
 */
export const workspaceQuery = `
resources
| where type =~ 'microsoft.operationsmanagement/solutions'
| where name contains 'SecurityInsights'
| project id = tolower(tostring(properties.workspaceResourceId))
| join kind = inner (
    resources
    | where type =~ 'microsoft.operationalinsights/workspaces'
    | extend id=tolower(id)
    )
    on id
| extend path =  strcat("/subscriptions/", subscriptionId, "/resourcegroups/", resourceGroup, "/providers/Microsoft.OperationalInsights/workspaces/", name, "/providers/Microsoft.SecurityInsights")
| extend sentinelInstance =  strcat(subscriptionId, "/", resourceGroup, "/", name)
| join kind=leftouter (
    ResourceContainers
    | where type =~ 'microsoft.resources/subscriptions'
    | project subscriptionId, subscriptionName = name
    ) on subscriptionId
| project
    name,
    resourceGroup,
    subscriptionName,
    subscriptionId,
    location,
    tags,
    sentinelInstance,
    path
| sort by (tolower(tostring(name))) asc
`;