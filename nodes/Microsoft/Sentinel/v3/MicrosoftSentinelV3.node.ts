/**
 * Microsoft Sentinel V3 Node Implementation
 *
 * Clean implementation with:
 * - Incident Comment as a separate resource (not under Incident)
 * - No @version displayOptions (version handled by wrapper)
 * - Clean sidebar showing only relevant operations
 */

import type {
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { incidentOperationsV3, incidentFieldsV3 } from '../descriptions/IncidentDescription';
import { incidentCommentOperations, incidentCommentFields } from '../descriptions/IncidentCommentDescription';
import { alertRuleFields, alertRuleOperations } from '../descriptions/AlertRuleDescription';
import { automationRuleFields, automationRuleOperations } from '../descriptions/AutomationDescription';
import {
	debugRequest,
	debugResponse,
	processQueryResults,
	workspaceQuery,
} from '../GenericFunctions';
import type { AzureWorkspaceResource } from '../types';

// Icon is inherited from baseDescription in VersionedNodeType pattern
// eslint-disable-next-line @n8n/community-nodes/icon-validation
export class MicrosoftSentinelV3 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 3,
			subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
			defaults: {
				name: 'Sentinel',
			},
			usableAsTool: true,
			credentials: [
				{
					name: 'microsoftSentinelOAuth2Api',
					required: true,
				},
			],
			requestDefaults: {
				baseURL:
					`=https://management.azure.com/subscriptions/{{
						$parameter.sentinelInstance.match(/(?:%2F)?([0-9a-fA-F-]{36})/)[1]
					}}/resourceGroups/{{
						$parameter.sentinelInstance.match(
							/resourceGroups(?:%2F|\\/)(.*?)(?:%2F|\\/)/i
						)?.[1]
						|| $parameter.sentinelInstance.split('/')[1]
					}}/providers/Microsoft.OperationalInsights/workspaces/{{
						$parameter.sentinelInstance.match(
							/(?:%2F|\\/)(?:sentinel|workspaces)(?:%2F|\\/)(.*?)(?:%2F|\\/|$)/i
						)?.[1]
						|| $parameter.sentinelInstance.split('/')[2]
					}}/providers/Microsoft.SecurityInsights`,
				qs: {
					'api-version': '2025-07-01-preview',
				},
			},
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			properties: [
				// Sentinel Instance selector
				{
					displayName: 'Sentinel Instance',
					name: 'sentinelInstance',
					type: 'resourceLocator',
					default: { mode: 'list', value: '' },
					description: 'The Sentinel instance to use. Select from the list, enter as {subscriptionId}/{resourceGroupName}/{workspaceName} (Path mode), or provide a valid Azure Portal/Management URL (URL mode).',
					displayOptions: {
						hide: {
							resource: ['instance'],
						},
					},
					modes: [
						{
							displayName: 'Path',
							name: 'path',
							type: 'string',
							hint: 'Format: {subscriptionId}/{resourceGroupName}/{workspaceName}',
							placeholder: 'subId/RG/Workspace',
							validation: [
								{
									type: 'regex',
									properties: {
										regex: '.*\\/?(?<subscriptionId>[0-9a-fA-F-]{36}).*\\/(?<resourceGroupName>[\\w.-]+).*\\/(?<workspaceName>[\\w.-]+)',
										errorMessage: 'Invalid format. Expected: {subscriptionId}/{resourceGroupName}/{workspaceName}',
									},
								},
							],
							extractValue: {
								type: 'regex',
								regex: '^\\/?(?<subscriptionId>[0-9a-fA-F-]{36})\\/(?<resourceGroupName>[\\w.-]+)\\/(?<workspaceName>[\\w.-]+)$',
							},
						},
						{
							displayName: 'URL',
							name: 'url',
							type: 'string',
							hint: 'Enter an Azure Portal or Management API URL containing the Sentinel instance details.',
							placeholder: 'e.g., https://portal.azure.com/.../subscriptions/...',
							extractValue: {
								type: 'regex',
								regex: '.*subscriptions(?:/|%2F)(.*)',
							},
							validation: [
								{
									type: 'regex',
									properties: {
										regex: '.*subscriptions(?:/|%2F)(.*)',
										errorMessage: 'Invalid or unrecognized URL format. Ensure it contains .../subscriptions/{subId}/resourceGroups/{rg}/.../workspaces/{ws} or .../sentinel/{ws}.',
									},
								},
							],
						},
						{
							displayName: 'List',
							name: 'list',
							type: 'list',
							typeOptions: {
								searchListMethod: 'listSentinelInstances',
								searchable: true,
								searchFilterRequired: false,
							},
						},
					],
				},
				// Resource selector - V3 includes Incident Comment as separate resource
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
						{
							name: 'Instance',
							value: 'instance',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
						{
							name: 'Alert Rule',
							value: 'alertRule',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
						{
							name: 'Automation Rule',
							value: 'automationRule',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
						{
							name: 'Incident',
							value: 'incident',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
						{
							name: 'Incident Comment',
							value: 'incidentComment',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
						{
							name: 'Query',
							value: 'query',
							routing: {
								send: { preSend: [debugRequest] },
								output: { postReceive: [debugResponse] },
							},
						},
					],
					default: 'incident',
				},

				// Resource operations and fields
				...alertRuleOperations,
				...alertRuleFields,

				// V3-specific incident operations (no @version guards, no comment ops)
				...incidentOperationsV3,
				...incidentFieldsV3,

				// V3 Incident Comment as separate resource
				...incidentCommentOperations,
				...incidentCommentFields,

				...automationRuleOperations,
				...automationRuleFields,

				// Instance operations
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					default: 'get',
					displayOptions: {
						show: {
							resource: ['instance'],
						},
					},
					options: [
						{
							name: 'Get Instances',
							value: 'get',
							action: 'Get instances',
							routing: {
								request: {
									method: 'POST',
									baseURL: 'https://management.azure.com',
									url: '/providers/Microsoft.ResourceGraph/resources',
									qs: {
										'api-version': '2022-10-01',
									},
									body: {
										query: workspaceQuery,
									},
								},
								output: {
									postReceive: [
										{
											type: 'rootProperty',
											properties: {
												property: 'data',
											},
										},
									],
								},
							},
						},
					],
				},

				// Query operations
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					default: 'get',
					displayOptions: {
						show: {
							resource: ['query'],
						},
					},
					options: [
						{
							name: 'Run Query',
							value: 'get',
							action: 'Run a query',
						},
					],
				},
				{
					displayName: 'Query',
					name: 'query',
					type: 'string',
					default: '',
					typeOptions: {
						rows: 4,
					},
					displayOptions: {
						show: {
							resource: ['query'],
							operation: ['get'],
						},
					},
					description: 'Enter the query to run',
					routing: {
						request: {
							method: 'GET',
							baseURL:
								`=https://management.azure.com/subscriptions/{{
									$parameter.sentinelInstance.match(/(?:%2F)?([0-9a-fA-F-]{36})/)[1]
								}}/resourceGroups/{{
									$parameter.sentinelInstance.match(
										/resourceGroups(?:%2F|\\/)(.*?)(?:%2F|\\/)/i
									)?.[1]
									|| $parameter.sentinelInstance.split('/')[1]
								}}/providers/Microsoft.OperationalInsights/workspaces/{{
									$parameter.sentinelInstance.match(
										/(?:%2F|\\/)(?:sentinel|workspaces)(?:%2F|\\/)(.*?)(?:%2F|\\/|$)/i
									)?.[1]
									|| $parameter.sentinelInstance.split('/')[2]
								}}/api/query`,
							qs: {
								'api-version': '2017-01-01-preview',
								query: '={{ $value }}',
							},
						},
						output: {
							postReceive: [processQueryResults],
						},
					},
				},

				// Debug setting
				{
					displayName: 'Debug',
					name: 'nodeDebug',
					type: 'boolean',
					isNodeSetting: true,
					default: false,
					noDataExpression: true,
				},
			],
		};
	}

	methods = {
		listSearch: {
			listSentinelInstances: async function (
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				let listQuery = workspaceQuery;
				if (filter) {
					listQuery += `| where * contains '${filter.toLowerCase()}'`;
				}
				const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'microsoftSentinelOAuth2Api', {
					method: 'POST',
					baseURL: 'https://management.azure.com',
					url: '/providers/Microsoft.ResourceGraph/resources',
					qs: {
						'api-version': '2022-10-01',
					},
					body: {
						query: listQuery
					},
				});

				if (responseData && responseData.data && Array.isArray(responseData.data)) {
					const options: INodePropertyOptions[] = responseData.data.map((item: AzureWorkspaceResource) => ({
						name: `${item.name} (${item.subscriptionName} > ${item.resourceGroup})`,
						value: item.path,
						url: `https://portal.azure.com/#view/Microsoft_Azure_Security_Insights/MainMenuBlade/~/0/id/%2Fsubscriptions%2F${item.subscriptionId}%2Fresourcegroups%2F${item.resourceGroup}%2Fproviders%2Fmicrosoft.securityinsightsarg%2Fsentinel%2F${item.name}`
					}));

					options.sort((a, b) => a.name.localeCompare(b.name));

					return {
						results: options,
					};
				}
				return {
					results: [],
				};
			},
		},
	};
}
