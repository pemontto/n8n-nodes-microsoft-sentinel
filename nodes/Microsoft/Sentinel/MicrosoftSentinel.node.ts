import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

import { incidentFields, incidentOperations } from './descriptions/IncidentDescription';
import { alertRuleFields, alertRuleOperations } from './descriptions/AlertRuleDescription';
import { automationRuleFields, automationRuleOperations } from './descriptions/AutomationDescription';
import {
	debugRequest,
	debugResponse,
	processQueryResults,
	workspaceQuery,
} from './GenericFunctions';

export class MicrosoftSentinel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Microsoft Sentinel',
		name: 'microsoftSentinel',
		icon: 'file:MicrosoftSentinel.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the Sentinel API',
		defaults: {
			name: 'Sentinel',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'microsoftSentinelOAuth2Api',
				required: true,
			},
		],
		requestDefaults: {
			// ignoreHttpStatusErrors: true,
			// skipSslCertificateValidation: true,
			// returnFullResponse: true,
			baseURL:
				'=https://management.azure.com/subscriptions/{{ $parameter.sentinelInstance.split("/")[0] }}/resourceGroups/{{ $parameter.sentinelInstance.split("/")[1] }}/providers/Microsoft.OperationalInsights/workspaces/{{ $parameter.sentinelInstance.split("/")[2] }}/providers/Microsoft.SecurityInsights',

			qs: {
				'api-version': '2024-01-01-preview',
			},
		},
		properties: [
			{
				/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
				displayName: 'Sentinel Instance',
				name: 'sentinelInstance',
				default: '',
				type: 'options',
				typeOptions: {
					loadOptions: {
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
									{
										type: 'setKeyValue',
										properties: {
											name: '={{ $responseItem.name }} ({{ $responseItem.subscriptionName }} > {{ $responseItem.resourceGroup }})',
											value:
												'={{ $responseItem.subscriptionId }}/{{ $responseItem.resourceGroup }}/{{ $responseItem.name }}',
											// '=/subscriptions/{{ $responseItem.subscriptionId }}/resourceGroups/{{ $responseItem.resourceGroup }}/providers/Microsoft.OperationalInsights/workspaces/{{ $responseItem.name }}/providers/Microsoft.SecurityInsights',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				displayOptions: {
					hide: {
						resource: ['instance'],
					},
				},
				description:
					'The Sentinel instance to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.\nFormat is `{subscriptionId}/{resourceGroupName}/{workspaceName}`.',
			},
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
							send: {
								preSend: [debugRequest],
							},
							output: {
								postReceive: [debugResponse],
							},
						},
					},
					{
						name: 'Alert Rule',
						value: 'alertRule',
						routing: {
							send: {
								preSend: [debugRequest],
							},
							output: {
								postReceive: [debugResponse],
							},
						},
					},
					{
						name: 'Automation Rule',
						value: 'automationRule',
						routing: {
							send: {
								preSend: [debugRequest],
							},
							output: {
								postReceive: [debugResponse],
							},
						},
					},
					{
						name: 'Incident',
						value: 'incident',
						routing: {
							send: {
								preSend: [debugRequest],
							},
							output: {
								postReceive: [debugResponse],
							},
						},
					},
					{
						name: 'Query',
						value: 'query',
						routing: {
							send: {
								preSend: [debugRequest],
							},
							output: {
								postReceive: [debugResponse],
							},
						},
					},
				],
				default: 'incident',
			},

			...alertRuleOperations,
			...alertRuleFields,

			...incidentOperations,
			...incidentFields,

			...automationRuleOperations,
			...automationRuleFields,

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
							'=https://management.azure.com/subscriptions/{{ $parameter.sentinelInstance.split("/")[0] }}/resourceGroups/{{ $parameter.sentinelInstance.split("/")[1] }}/providers/Microsoft.OperationalInsights/workspaces/{{ $parameter.sentinelInstance.split("/")[2] }}/api/query',

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

			// {
			// 	displayName: 'Sentinel Instance',
			// 	name: 'sentinelInstance',
			// 	type: 'resourceLocator',
			// 	default: { mode: 'list', value: '' },
			// 	description: 'The Sentinel instance to use',
			// 	modes: [
			// 		{
			// 			displayName: 'IDs',
			// 			name: 'workspacePath',
			// 			type: 'string',
			// 			hint: 'Enter the subscription ID, resource group name, and workspace name',
			// 			validation: [
			// 				{
			// 					type: 'regex',
			// 					properties: {
			// 						regex:
			// 							'^\\/?(?<subscriptionId>[0-9a-fA-F-]{36})\\/(?<resourceGroupName>[\\w_-]{1,64})\\/(?<workspaceName>[\\w_-]+)$',
			// 						// '^\\/?subscriptions\\/(?<subscriptionId>[0-9a-fA-F-]{36})\\/resourcegroups\\/(?<resourceGroupName>\\w+)\\/providers\\/Microsoft\\.OperationalInsights\\/workspaces\\/(?<workspaceName>[w-]+)$',
			// 						errorMessage:
			// 							'You must provide a valid subscription GUID, resource group name, and workspace name',
			// 					},
			// 				},
			// 			],
			// 			placeholder: '{subscriptionId}/{resourceGroupName}/{workspaceName}',
			// 			// How to use the ID in API call
			// 			url: '=/subscriptions/{{ $value.split("/")[0] }}/resourceGroups/{{ $value.split("/")[1] }}/providers/Microsoft.OperationalInsights/workspaces/{{ $value.split("/")[2] }}/providers/Microsoft.SecurityInsights',
			// 		},
			// 		// {
			// 		// 	displayName: 'URL',
			// 		// 	name: 'url',
			// 		// 	type: 'string',
			// 		// 	hint: 'Enter a URL',
			// 		// 	validation: [
			// 		// 		{
			// 		// 			type: 'regex',
			// 		// 			properties: {
			// 		// 				regex:
			// 		// 					'.*(?:\\/|%2F)subscriptions(?:\\/|%2F)?(?<subscriptionId>[0-9a-fA-F-]{36})(?:\\/|%2F)resource[Gg]roups(?:\\/|%2F)(?<resourceGroupName>[\\w\\d_-]{1,64})(?:\\/|%2F)providers(?:\\/|%2F).*(?:\\/|%2F)(?:sentinel|workspaces)(?:\\/|%2F)(?<workspaceName>[\\w\\d_-]+)(?:\\/|%2F|$).*',
			// 		// 				errorMessage: 'Invalid URL',
			// 		// 			},
			// 		// 		},
			// 		// 	],
			// 		// 	placeholder:
			// 		// 		'https://portal.azure.com/#view/Microsoft_Azure_Security_Insights/MainMenuBlade/~/0/id/%2Fsubscriptions%2F{subscriptionId}%2Fresourcegroups%2F{resourceGroupName}%2Fproviders%2Fmicrosoft.securityinsightsarg%2Fsentinel%2F{workspaceName}',
			// 		// 	// How to get the ID from the URL
			// 		// 	extractValue: {
			// 		// 		type: 'regex',
			// 		// 		regex:
			// 		// 			/.*(?:\/|%2F)subscriptions(?:\/|%2F)?(?<subscriptionId>[0-9a-fA-F-]{36})(?:\/|%2F)resource[Gg]roups(?:\/|%2F)(?<resourceGroupName>[\w\d_-]{1,64})(?:\/|%2F)providers(?:\/|%2F).*(?:\/|%2F)(?:sentinel|workspaces)(?:\/|%2F)(?<workspaceName>[\w\d_-]+)(?:\/|%2F|$).*/,
			// 		// 	},
			// 		// },
			// 		{
			// 			displayName: 'List',
			// 			name: 'list',
			// 			type: 'list',
			// 			typeOptions: {
			// 				// You must always provide a search method
			// 				// Write this method within the methods object in your base file
			// 				// The method must populate the list, and handle searching if searchable: true
			// 				searchListMethod: 'listInstances',
			// 				// If you want users to be able to search the list
			// 				searchable: true,
			// 				// Set to true if you want to force users to search
			// 				// When true, users can't browse the list
			// 				// Or false if users can browse a list
			// 				searchFilterRequired: false,
			// 			},
			// 		},
			// 	],
			// },

			// {
			// 	/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
			// 	displayName: 'Subscription ID',
			// 	name: 'subscriptionId',
			// 	// type: 'string',
			// 	default: '',
			// 	type: 'options',
			// 	typeOptions: {
			// 		loadOptions: {
			// 			routing: {
			// 				request: {
			// 					method: 'POST',
			// 					baseURL: 'https://management.azure.com',
			// 					url: '/providers/Microsoft.ResourceGraph/resources',
			// 					qs: {
			// 						'api-version': '2022-10-01',
			// 					},
			// 					body: {
			// 						query: `${workspaceQuery}
			// 							| join kind=leftouter (ResourceContainers | where type =~ 'microsoft.resources/subscriptions' | project subscriptionId, subName = name) on subscriptionId
			// 							| sort by (tolower(tostring(name))) asc`,
			// 					},
			// 				},
			// 				output: {
			// 					postReceive: [
			// 						{
			// 							type: 'rootProperty',
			// 							properties: {
			// 								property: 'data',
			// 							},
			// 						},
			// 						{
			// 							type: 'setKeyValue',
			// 							properties: {
			// 								name: '={{$responseItem.subName}} ({{$responseItem.subscriptionId}})',
			// 								value: '={{$responseItem.subscriptionId}}',
			// 							},
			// 						},
			// 						{
			// 							type: 'sort',
			// 							properties: {
			// 								key: 'name',
			// 								unique: true,
			// 							},
			// 						},
			// 						// async function (
			// 						// 	this: IExecuteSingleFunctions,
			// 						// 	items: INodeExecutionData[],
			// 						// 	response: IN8nHttpFullResponse,
			// 						// ) {
			// 						// 	console.log('response', response);
			// 						// 	return items;
			// 						// },
			// 					],
			// 				},
			// 			},
			// 		},
			// 	},
			// 	// typeOptions: {
			// 	// 	loadOptionsMethod: 'getSubscriptions',
			// 	// },
			// 	placeholder: '00000000-0000-0000-0000-000000000000',
			// 	description:
			// 		'Subscription ID where the Sentinel workspace is located. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			// },
			// {
			// 	/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
			// 	displayName: 'Resource Group Name',
			// 	name: 'resourceGroupName',
			// 	type: 'string',
			// 	default: '',
			// 	// typeOptions: {
			// 	// 	loadOptionsMethod: 'getResourceGroups',
			// 	// 	loadOptionsDependsOn: ['sentinelInstance.subscriptionId'],
			// 	// },
			// 	placeholder: 'sentinel-rg',
			// 	description:
			// 		'Resource group name where the Sentinel workspace is located. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			// },
			// {
			// 	displayName: 'Workspace Name',
			// 	name: 'workspaceName',
			// 	type: 'string',
			// 	default: '',
			// 	// typeOptions: {
			// 	// 	loadOptionsMethod: 'getWorkspaceNames',
			// 	// 	loadOptionsDependsOn: [
			// 	// 		'sentinelInstance.subscriptionId',
			// 	// 		'sentinelInstance.resourceGroupName',
			// 	// 	],
			// 	// },
			// 	placeholder: 'sentinel',
			// 	description:
			// 		'Sentinel workspace name. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			// },
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
