import { v4 as uuid } from 'uuid';
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
	const objectId = this.getNodeParameter('options.objectId', uuid()) as string;
	// Append the objectId (or a new UUID if objectId is falsy) to the URL.
	requestOptions.url = `${requestOptions.url}/${objectId || uuid()}`;
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
	if (!requestOptions.body.properties) {
		requestOptions.body.properties = {};
	}
	requestOptions.body.properties = {
		...customProperties,
		...requestOptions.body.properties,
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
 * Upserts a comment by preparing the request body and applying common transformations.
 * @param this - The execution context.
 * @param requestOptions - The HTTP request options to modify.
 * @returns The modified request options ready for the upsert operation.
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
	const results: JsonObject = response.body.Tables[0];
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