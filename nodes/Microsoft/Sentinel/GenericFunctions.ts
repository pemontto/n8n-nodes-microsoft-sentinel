import { v4 as uuid } from 'uuid';
import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	IN8nHttpFullResponse,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';

function _addFilter(property: string, operator: string, values: string[]) {
	let newFilter = `(${property} ${operator} '`;
	newFilter += values.join(`' or ${property} ${operator} '`);
	newFilter += "')";
	return newFilter;
}

export async function buildFilterString(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	const queryFilter = [];
	const filters = this.getNodeParameter('filters', {}) as IDataObject;
	if (filters.createdAfter) {
		queryFilter.push(`properties/createdTimeUtc ge ${filters.createdAfter as string}`);
	}
	if (filters.modifiedAfter) {
		queryFilter.push(`properties/lastModifiedTimeUtc ge ${filters.modifiedAfter as string}`);
	}
	if (filters.incidentId) {
		queryFilter.push(`properties/incidentNumber eq ${filters.incidentId as string}`);
	}
	// @ts-ignore
	if (filters.severity?.length) {
		queryFilter.push(_addFilter('properties/severity', 'eq', filters.severity as string[]));
	}
	// @ts-ignore
	if (filters.status?.length) {
		queryFilter.push(_addFilter('properties/status', 'eq', filters.status as string[]));
	}
	if (filters.filter) {
		// if (queryFilter.length) {
		// 	queryFilter.push(' and ');
		// }
		queryFilter.push(`(${filters.filter as string})`);
	}
	if (queryFilter.length) {
		// @ts-ignore
		requestOptions.qs.$filter = queryFilter.join(' and ');
		if (nodeDebug) {
			this.logger.info(
				`[${this.getNode().type} | ${this.getNode().name}] - OData $filter: ${queryFilter.join(
					' and ',
				)}`,
			);
		}
	}

	// console.log('\n\n\nrequestOptions:', requestOptions);
	return requestOptions;
}

export async function addUUID(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const objectId = this.getNodeParameter('options.objectId', uuid()) as boolean;
	requestOptions.url = `${requestOptions.url}/${objectId || uuid()}`;
	return requestOptions;
}

export async function mergeProperties(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const customProperties = this.getNodeParameter('options.customProperties', {}) as IDataObject;
	// Merge incidentProperties into requestOptions.url.body.properties
	// create the body and properties objects if they don't exist
	// @ts-ignore
	requestOptions.body.properties = requestOptions.body.properties || {};
	// @ts-ignore
	requestOptions.body.properties = {
		...(customProperties || {}),
		// @ts-ignore
		...requestOptions.body.properties,
	};
	return requestOptions;
}

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
			suppressionDuration: this.getNodeParameter(
				'additionalFields.suppressionDuration',
				'PT5H',
			) as string,
			suppressionEnabled: this.getNodeParameter(
				'additionalFields.suppressionEnabled',
				false,
			) as boolean,
			triggerOperator: this.getNodeParameter('triggerOperator', null) as string,
			triggerThreshold: this.getNodeParameter('triggerThreshold', null) as number,
			...((this.getNodeParameter('additionalFields') ?? {}) as JsonObject),
		},
	};
	requestOptions = await addUUID.call(this, requestOptions);
	requestOptions = await mergeProperties.call(this, requestOptions);

	return requestOptions;
}

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
	requestOptions = await addUUID.call(this, requestOptions);
	requestOptions = await mergeProperties.call(this, requestOptions);

	return requestOptions;
}

export async function upsertAutomationRule(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions = await addUUID.call(this, requestOptions);
	requestOptions = await mergeProperties.call(this, requestOptions);
	return requestOptions;
}

export async function debugRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	if (nodeDebug) {
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] REQUEST - ${JSON.stringify(requestOptions, null, 2)}`,
		);
	}
	return requestOptions;
}

export async function debugResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
) {
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	if (nodeDebug) {
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] RESPONSE - ${JSON.stringify(response, null, 2)}`,
		);
	}
	return items;
}

export async function processQueryResults(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	items = [];

	// @ts-ignore
	const results: JsonObject = response.body.Tables[0];
	const columns = results.Columns as JsonObject[];
	const rows = results.Rows as [];

	rows.forEach((row) => {
		const rowData: JsonObject = {};
		columns.forEach((column: any, index: number) => {
			rowData[column.ColumnName] = row[index];
		});
		items.push({
			json: rowData,
			pairedItem: this.getItemIndex(),
		});
	});

	return items;
}

export async function prepareOutput(this: IExecuteSingleFunctions, items: INodeExecutionData[]) {
	// console.log('item:', items);
	const nodeDebug = this.getNodeParameter('nodeDebug', 0) as boolean;
	const simple = this.getNodeParameter('options.simple', true) as boolean;

	if (nodeDebug) {
		this.logger.info(
			`[${this.getNode().type} | ${this.getNode().name}] - Parsing properties of ${
				items.length
			} items}`,
		);
	}

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

	return items;
}

// https://learn.microsoft.com/en-us/rest/api/azureresourcegraph/resourcegraph/resources/resources?view=rest-azureresourcegraph-resourcegraph
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
| join kind=leftouter (ResourceContainers | where type =~ 'microsoft.resources/subscriptions' | project subscriptionId, subscriptionName = name) on subscriptionId
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
