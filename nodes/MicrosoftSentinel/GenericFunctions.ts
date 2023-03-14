import type { OptionsWithUri } from 'request';

import type {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export function addFilter(property: string, operator: string, values: string[]): string {
	let newFilter = `(${property} ${operator} '`;
	// @ts-ignore
	newFilter += values.join(`' or ${property} ${operator} '`);
	newFilter += "')";
	return newFilter;
}

export let workspaceQuery = `
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
| parse id with "/subscriptions/" subId "/resourcegroups/" resourceGroupName "/providers/" providers "/" nestedResource "/" resourceName
| extend id =  strcat("/subscriptions/", subId, "/resourcegroups/", resourceGroupName, "/providers/", "microsoft.securityinsightsarg/sentinel/", resourceName)
| extend type = "microsoft.securityinsightsarg/sentinel"
| project id, name, type, location, resourceGroup, subscriptionId, kind, tags, tenantId
| extend tagsString=tostring(tags)
| where (type !~ ('paloaltonetworks.cloudngfw/firewalls')) | where (type !~ ('paloaltonetworks.cloudngfw/globalrulestacks')) | where (type !~ ('paloaltonetworks.cloudngfw/localrulestacks')) | where (type !~ ('microsoft.azureactivedirectory/ciamdirectories')) | where (type !~ ('microsoft.agfoodplatform/farmbeats')) | where (type !~ ('microsoft.anybuild/clusters')) | where (type !~ ('microsoft.cdn/profiles/customdomains')) | where (type !~ ('microsoft.cdn/profiles/afdendpoints')) | where (type !~ ('microsoft.cdn/profiles/origingroups/origins')) | where (type !~ ('microsoft.cdn/profiles/origingroups')) | where (type !~ ('microsoft.cdn/profiles/afdendpoints/routes')) | where (type !~ ('microsoft.cdn/profiles/rulesets/rules')) | where (type !~ ('microsoft.cdn/profiles/rulesets')) | where (type !~ ('microsoft.cdn/profiles/secrets')) | where (type !~ ('microsoft.cdn/profiles/securitypolicies')) | where (type !~ ('microsoft.cloudtest/accounts')) | where (type !~ ('microsoft.cloudtest/hostedpools')) | where (type !~ ('microsoft.cloudtest/images')) | where (type !~ ('microsoft.cloudtest/pools')) | where (type !~ ('microsoft.codesigning/codesigningaccounts')) | where (type !~ ('microsoft.kubernetes/connectedclusters/microsoft.kubernetesconfiguration/namespaces')) | where (type !~ ('microsoft.containerservice/managedclusters/microsoft.kubernetesconfiguration/namespaces')) | where (type !~ ('microsoft.kubernetes/connectedclusters/microsoft.kubernetesconfiguration/fluxconfigurations')) | where (type !~ ('microsoft.containerservice/managedclusters/microsoft.kubernetesconfiguration/fluxconfigurations')) | where (type !~ ('microsoft.portalservices/extensions/deployments')) | where (type !~ ('microsoft.portalservices/extensions')) | where (type !~ ('microsoft.portalservices/extensions/slots')) | where (type !~ ('microsoft.portalservices/extensions/versions')) | where (type !~ ('microsoft.azuredatatransfer/connections')) | where (type !~ ('microsoft.azuredatatransfer/connections/flows')) | where (type !~ ('microsoft.azuredatatransfer/pipelines')) | where (type !~ ('microsoft.databasewatcher/watchers')) | where (type !~ ('microsoft.datacollaboration/workspaces')) | where (type !~ ('microsoft.compute/locations/communitygalleries/images')) | where (type !~ ('microsoft.documentdb/mongoclusters')) | where (type !~ ('microsoft.eventgrid/namespaces')) | where (type !~ ('microsoft.hdinsight/clusterpools/clusters')) | where (type !~ ('microsoft.hdinsight/clusterpools')) | where (type !~ ('microsoft.network/virtualhubs')) or ((kind =~ ('routeserver'))) | where (type !~ ('microsoft.metaverse/metaverses')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/connectors')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/files')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/filerequests')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/licenses')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/storages')) | where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/workloads')) | where (type !~ ('microsoft.modsimworkbench/workbenches/sharedstorages')) | where (type !~ ('microsoft.modsimworkbench/workbenches')) | where (type !~ ('microsoft.insights/diagnosticsettings')) | where (type !~ ('microsoft.insights/scheduledqueryrules')) | where not((type =~ ('microsoft.network/serviceendpointpolicies')) and ((kind =~ ('internal')))) | where (type !~ ('microsoft.openlogisticsplatform/workspaces')) | where (type !~ ('microsoft.scom/managedinstances')) | where (type !~ ('microsoft.orbital/edgesites')) | where (type !~ ('microsoft.orbital/groundstations')) | where (type !~ ('microsoft.orbital/l2connections')) | where (type !~ ('microsoft.recommendationsservice/accounts/modeling')) | where (type !~ ('microsoft.recommendationsservice/accounts/serviceendpoints')) | where (type !~ ('microsoft.recoveryservicesbvtd/vaults')) | where (type !~ ('microsoft.recoveryservicesbvtd2/vaults')) | where (type !~ ('microsoft.recoveryservicesintd/vaults')) | where (type !~ ('microsoft.recoveryservicesintd2/vaults')) | where (type !~ ('microsoft.deploymentmanager/rollouts')) | where (type !~ ('microsoft.datareplication/replicationvaults')) | where (type !~ ('microsoft.storage/storagetasks')) | where not((type =~ ('microsoft.synapse/workspaces/sqlpools')) and ((kind =~ ('v3')))) | where (type !~ ('microsoft.voiceservices/operatorvoicemailinstances')) | where (type !~ ('microsoft.windowspushnotificationservices/registrations')) | where not((type =~ ('microsoft.sql/servers/databases')) and ((kind in~ ('system', 'v2.0,system', 'v12.0,system', 'v12.0,user,datawarehouse,gen2,analytics')))) | where not((type =~ ('microsoft.sql/servers')) and ((kind =~ ('v12.0,analytics'))))
| project
    name,
    resourceGroup,
    tagsString,
    id,
    type,
    kind,
    location,
    subscriptionId,
    tags
| sort by (tolower(tostring(name))) asc
`;

export async function microsoftApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: string,
	resource: string,
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	headers: IDataObject = {},
): Promise<any> {
	// const credentials = await this.getCredentials('microsoftSentinelOAuth2Api');
	// console.log(`credentials: ${JSON.stringify(credentials, null, 2)}`);
	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: uri || `https://management.azure.com/subscriptions/${resource}`,
		json: true,
	};

	if (!Object.keys(body).length) {
		delete options.body;
	}

	if (!Object.keys(qs).length) {
		delete options.qs;
	}

	console.log(`\nREQUEST:\n${JSON.stringify(options, null, 2)}`);
	try {
		if (Object.keys(headers).length !== 0) {
			options.headers = Object.assign({}, options.headers, headers);
		}
		//@ts-ignore
		return await this.helpers.requestOAuth2.call(this, 'microsoftSentinelOAuth2Api', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function microsoftApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	propertyName: string,
	method: string,
	endpoint: string,
	body: any = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;
	let uri: string | undefined;

	console.log(`query: ${JSON.stringify(query)}`);

	const limit = query.limit as number;
	delete query.limit;
	console.log(`limit: ${limit}`);
	query.$top = limit && limit <= 1000 ? limit : 1000;
	do {
		// Don't reqeust more items than we need
		if (limit && !query.$top && returnData.length + 1000 > limit) {
			query.$top = limit - returnData.length;
			uri = uri?.replace(/(&\$top=)(\d+)/, '');
		}
		// console.log(`query.$top: ${query.$top}`);
		// console.log(`\n\nMaking a request #${++counter}`);
		responseData = await microsoftApiRequest.call(this, method, endpoint, body, query, uri);
		// console.log(`responseData[propertyName].length: ${responseData[propertyName].length}`);
		// console.log(JSON.stringify(responseData, null, 2));
		uri = responseData.nextLink;
		query = {};
		body = {};
		// console.log(`uri: ${uri}`);
		returnData.push.apply(returnData, responseData[propertyName] as IDataObject[]);
		// console.log(`query.limit: ${query.limit}`);
		// console.log(`returnData.length: ${returnData.length}`);
		// @ts-ignore
		if (limit && limit <= returnData.length) {
			return returnData.slice(0, limit);
		}
	} while (responseData.nextLink !== undefined);

	return returnData;
}

export async function microsoftApiRequestAllItemsSkip(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	propertyName: string,
	method: string,
	endpoint: string,
	body: any = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;

	query.$top = (query.$top as number) || 1000;

	query.$skip = 0;

	let counter = 0;

	do {
		console.log(`\n\nMaking request #${++counter}`);
		responseData = await microsoftApiRequest.call(this, method, endpoint, body, query);
		console.log(`responseData[propertyName].length: ${responseData[propertyName].length}`);
		query.$skip += query.$top;
		returnData.push.apply(returnData, responseData[propertyName] as IDataObject[]);
		// console.log(`query.$top: ${query.$top}`);
		// console.log(`query.limit: ${query.limit}`);
		// console.log(`returnData.length: ${returnData.length}`);
		// console.log(
		// 	`responseData[propertyName].at(-1): ${JSON.stringify(
		// 		responseData[propertyName].at(-1),
		// 		null,
		// 		2,
		// 	)}`,
		// );
		// @ts-ignore
		if (query.limit && query.limit <= returnData.length) {
			return returnData;
		}
	} while (responseData.value.length !== 0);

	return returnData;
}
