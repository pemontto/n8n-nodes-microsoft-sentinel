import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { v4 as uuid } from 'uuid';

import {
	addFilter,
	microsoftApiRequest,
	microsoftApiRequestAllItems,
	workspaceQuery,
	// microsoftApiRequestAllItemsSkip,
} from './GenericFunctions';

import { incidentFields, incidentOperations } from './descriptions/IncidentDescription';

export class MicrosoftSentinel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Sentinel',
		name: 'microsoftSentinel',
		group: ['transform'],
		icon: 'file:Microsoft-Sentinel-Logo.svg',
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Consume Microsoft Sentinel API',
		defaults: {
			name: 'Microsoft Sentinel',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'microsoftSentinelOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Alert',
						value: 'alert',
					},
					{
						name: 'Comment',
						value: 'comment',
					},
					{
						name: 'Entity',
						value: 'entity',
					},
					{
						name: 'Incident',
						value: 'incident',
					},
					{
						name: 'Query',
						value: 'query',
					},
					{
						name: 'Rule',
						value: 'rule',
					},
					{
						name: 'Watchlist',
						value: 'watchlist',
					},
				],
				default: 'incident',
			},
			...incidentOperations,
			...incidentFields,
			{
				displayName: 'Sentinel Instance',
				name: 'sentinelInstance',
				placeholder: 'Add Override',
				description:
					'Custom Sentinel Instance to use. Leave empty to use the default Sentinel instance.',
				type: 'collection',
				default: {},
				options: [
					{
						/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
						displayName: 'Subscription ID',
						name: 'subscriptionId',
						type: 'options',
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getSubscriptions',
						},
						placeholder: '00000000-0000-0000-0000-000000000000',
						description:
							'Subscription ID where the Sentinel workspace is located. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					{
						/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
						displayName: 'Resource Group Name',
						name: 'resourceGroupName',
						type: 'options',
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getResourceGroups',
							loadOptionsDependsOn: ['sentinelInstance.subscriptionId'],
						},
						placeholder: 'sentinel-rg',
						description:
							'Resource group name where the Sentinel workspace is located. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
					{
						displayName: 'Workspace Name',
						name: 'workspaceName',
						type: 'options',
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getWorkspaceNames',
							loadOptionsDependsOn: [
								'sentinelInstance.subscriptionId',
								'sentinelInstance.resourceGroupName',
							],
						},
						placeholder: 'sentinel',
						description:
							'Sentinel workspace name. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getSubscriptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const resourceUrl =
					'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01';
				const query = workspaceQuery;
				const { data } = await microsoftApiRequest.call(
					this,
					'POST',
					'',
					{
						query,
					},
					{},
					resourceUrl,
				);
				// for object in data get unique values for subscriptionId
				// const subscriptions = data.map((workspace: IDataObject) => workspace.subscriptionId);
				// const uniqueSubscriptions = [...new Set(subscriptions)];
				for (const workspace of data) {
					returnData.push({
						name: `${workspace.name} (${workspace.subscriptionId})`,
						value: workspace.subscriptionId as string,
					});
				}
				return returnData;
			},
			async getResourceGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const resourceUrl =
					'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01';
				const query = `${workspaceQuery} | where subscriptionId == '${this.getCurrentNodeParameter(
					'sentinelInstance.subscriptionId',
				)}'`;
				const { data } = await microsoftApiRequest.call(
					this,
					'POST',
					'',
					{
						query,
					},
					{},
					resourceUrl,
				);
				// for object in data get unique values for subscriptionId
				for (const workspace of data) {
					returnData.push({
						name: `${workspace.name} (${workspace.resourceGroup})`,
						value: workspace.resourceGroup,
					});
				}
				return returnData;
			},
			async getWorkspaceNames(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const resourceUrl =
					'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01';
				const query = `${workspaceQuery} | where resourceGroup == '${this.getCurrentNodeParameter(
					'sentinelInstance.resourceGroupName',
				)}'`;
				const { data } = await microsoftApiRequest.call(
					this,
					'POST',
					'',
					{
						query,
					},
					{},
					resourceUrl,
				);
				// for object in data get unique values for subscriptionId
				for (const workspace of data) {
					returnData.push({
						name: workspace.name,
						value: workspace.name,
					});
				}
				return returnData;
			},
		},
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		// const returnData: IDataObject[] = [];
		const returnData: INodeExecutionData[] = [];
		let responseData;

		let {
			subscriptionId: defaulltSubscriptionId,
			resourceGroupName: defaultResourceGroupName,
			workspaceName: defaultWorkspaceName,
		} = (await this.getCredentials('microsoftSentinelOAuth2Api')) as IDataObject;

		// let { subscriptionId, resourceGroupName, workspaceName } = this.getNodeParameter(
		// 	'sentinelInstance',
		// 	0,
		// ) as IDataObject;

		// subscriptionId = this.getNodeParameter('subscriptionId', 0) as string;
		// resourceGroupName = this.getNodeParameter('resourceGroupName', 0) as string;
		// workspaceName = this.getNodeParameter('workspaceName', 0) as string;
		console.log(
			`defaulltSubscriptionId, defaultResourceGroupName, defaultWorkspaceName`,
			defaulltSubscriptionId,
			defaultResourceGroupName,
			defaultWorkspaceName,
		);

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		console.log(`${resource}:${operation}`);

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const qs: IDataObject = {
				'api-version': '2022-12-01-preview',
			};
			try {
				let { subscriptionId, resourceGroupName, workspaceName } = this.getNodeParameter(
					'sentinelInstance',
					itemIndex,
				) as IDataObject;
				subscriptionId ||= defaulltSubscriptionId;
				resourceGroupName ||= defaultResourceGroupName;
				workspaceName ||= defaultWorkspaceName;
				console.log(
					`subscriptionId, resourceGroupName, workspaceName`,
					subscriptionId,
					resourceGroupName,
					workspaceName,
				);
				// If none of subscriptionId, resourceGroupName, or workspaceName is defined throw a node error
				if (!subscriptionId || !resourceGroupName || !workspaceName) {
					throw new NodeOperationError(
						this.getNode(),
						'Please provide a valid Sentinel subscription, resource group, and workspace using either credential defaults, or Sentinel instance override fields',
					);
				}
				const baseResource = `${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.OperationalInsights/workspaces/${workspaceName}`;
				if (resource === 'incident') {
					// https://docs.microsoft.com/en-us/graph/api/resources/security-api-overview?view=graph-rest-1.0
					if (operation === 'create') {
						const options = this.getNodeParameter('options', 0) as IDataObject;
						// Generate UUIDv4 for incident ID
						const incidentId = uuid();
						const title = this.getNodeParameter('title', itemIndex) as string;
						const severity = this.getNodeParameter('severity', itemIndex) as string;
						const status = this.getNodeParameter('status', itemIndex) as string;

						const body: IDataObject = {
							properties: {
								incidentId,
								title,
								severity,
								status,
							},
						};

						responseData = await microsoftApiRequest.call(
							this,
							'PUT',
							`${baseResource}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`,
							body,
							qs,
						);
						if (options.simple) {
							responseData = { id: responseData.name, ...responseData.properties };
						}
					} else if (operation === 'update') {
						const options = this.getNodeParameter('options', 0) as IDataObject;
						const incidentId = this.getNodeParameter('incidentId', itemIndex) as string;
						const updateFields = this.getNodeParameter('updateFields', itemIndex) as IDataObject;

						const x = async () => {
							// If any of updateFields.title, updateFields.severity, or updateFields.status are not set, make a request to get the current values
							if (
								!updateFields.title ||
								!updateFields.severity ||
								!updateFields.status ||
								updateFields.addTags ||
								updateFields.removeTags
							) {
								console.log('GETTING CURRENT INCIDENT');
								const currentIncident = await microsoftApiRequest.call(
									this,
									'GET',
									`${baseResource}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`,
									{},
									qs,
								);
								if (!updateFields.title) {
									updateFields.title = currentIncident.properties.title;
								}
								if (!updateFields.severity) {
									updateFields.severity = currentIncident.properties.severity;
								}
								if (!updateFields.status) {
									updateFields.status = currentIncident.properties.status;
								}
								updateFields.labels = currentIncident.properties.labels.map(
									(label: IDataObject) => label.labelName,
								);
								console.log(`updateFields.labels: ${JSON.stringify(updateFields.labels)}`);
								// Remove tags
								console.log(`Removing tags: ${JSON.stringify(updateFields.removeTags)}`);
								updateFields.labels = (updateFields.labels as string[]).filter(
									(label: string) => (updateFields.removeTags as string[]).indexOf(label) < 0,
								);
								console.log(`updateFields.labels: ${JSON.stringify(updateFields.labels)}`);
								// Add tags
								console.log(`Adding tags: ${JSON.stringify(updateFields.addTags)}`);
								(updateFields.addTags as string[]).forEach((tag: string) => {
									// @ts-ignore
									if (updateFields.labels.indexOf(tag) < 0) {
										// @ts-ignore
										updateFields.labels.push(tag);
									}
								});
								delete updateFields.removeTags;
								delete updateFields.addTags;
								console.log(`updateFields.labels: ${JSON.stringify(updateFields.labels)}`);
								updateFields.labels = (updateFields.labels as string[]).map((label: string) => ({
									labelName: label,
								}));
								console.log('CURRENT INCIDENT', currentIncident);
							}

							const body: IDataObject = {
								properties: {
									incidentId,
									...updateFields,
								},
							};

							let responseData = await microsoftApiRequest.call(
								this,
								'PUT',
								`${baseResource}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`,
								body,
								qs,
							);
							if (options.simple) {
								responseData.properties.labels = responseData.properties.labels.map(
									(x: IDataObject) => x.labelName,
								);
								responseData = { id: responseData.name, ...responseData.properties };
							}
							return responseData;
						};
						responseData = await x();
					} else if (operation === 'delete') {
						const incidentId = this.getNodeParameter('incidentId', itemIndex) as string;

						responseData = await microsoftApiRequest.call(
							this,
							'DELETE',
							`${baseResource}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`,
							{},
							qs,
						);
						console.log(JSON.stringify(responseData, null, 2));
						responseData = { result: 'success' };
					} else if (operation === 'get') {
						const options = this.getNodeParameter('options', 0) as IDataObject;
						const incidentId = this.getNodeParameter('incidentId', itemIndex) as string;

						responseData = await microsoftApiRequest.call(
							this,
							'GET',
							`${baseResource}/providers/Microsoft.SecurityInsights/incidents/${incidentId}`,
							{},
							qs,
						);
						if (options.simple) {
							responseData = { id: responseData.name, ...responseData.properties };
						}
					}
					if (operation === 'getAll') {
						const options = this.getNodeParameter('options', 0) as IDataObject;
						const filters = this.getNodeParameter('filters', itemIndex) as IDataObject;

						qs.limit = this.getNodeParameter('limit', itemIndex, null) as number;

						// console.log(`filters: ${JSON.stringify(filters, null, 2)}`);
						const queryFilter = [];

						if (filters.severity) {
							queryFilter.push(
								addFilter('properties/severity', 'eq', filters.severity as string[]),
							);
						}
						if (filters.status) {
							queryFilter.push(addFilter('properties/status', 'eq', filters.status as string[]));
						}
						if (filters.createdAfter) {
							queryFilter.push(`properties/createdTimeUtc ge ${filters.createdAfter}`);
						}
						if (filters.modifiedAfter) {
							queryFilter.push(`properties/lastModifiedTimeUtc ge ${filters.modifiedAfter}`);
						}
						if (filters.filter) {
							queryFilter.push(`(${filters.filter})`);
						}

						if (queryFilter.length) {
							console.debug(`queryFilter: ${queryFilter}`);
							qs.$filter = queryFilter.join(' and ');
						}

						responseData = await microsoftApiRequestAllItems.call(
							this,
							'value',
							'GET',
							`${baseResource}/providers/Microsoft.SecurityInsights/incidents`,
							{},
							qs,
						);

						// console.log(`\nresponseData:\n${JSON.stringify(responseData, null, 2)}`);
						if (options.simple) {
							responseData = responseData.map((x: IDataObject) => ({
								id: x.name,
								...(x.properties as IDataObject),
							}));
						}
						// console.log(`\nFINAL responseData:\n${JSON.stringify(responseData, null, 2)}`);
					}
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject),
				{ itemData: { item: itemIndex } },
			);
			returnData.push(...executionData);
			// Array.isArray(responseData)
			// 	? returnData.push(...(responseData as IDataObject[]))
			// 	: returnData.push(responseData as IDataObject);
		}

		return this.prepareOutputData(returnData);
	}
}
