// Get Many: /incidents  (paged)
// Get: /incidents/{incidentId}
// Delete: /incidents/{incidentId}
// Get Alerts: /incidents/{incidentId}/alerts
// Get Entities: /incidents/{incidentId}/entities
// Get Relations: /incidents/{incidentId}/relations (paged)
// Get Comments: /incidents/{incidentId}/bookmarks
// Create/Update Comment: /incidents/{incidentId}/bookmarks


// TODO later
// Get Tasks: /incidents/{incidentId}/tasks
// Get Task: /incidents/{incidentId}/tasks/{incidentTaskId}
// Delete Task: /incidents/{incidentId}/tasks/{incidentTaskId}
// Create or Update Task: /incidents/{incidentId}/tasks/{incidentTaskId}
// Get Boookmarks: /incidents/{incidentId}/bookmarks

import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	// IExecuteSingleFunctions,
	// IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import {
	// addUUID,
	buildFilterString,
	includeRelatedData,
	// mergeProperties,
	prepareOutput,
	upsertComment,
	upsertIncident,
	createIncident,
	updateIncident,
	addLabelsToIncident,
	removeLabelsFromIncident,
} from '../GenericFunctions';

export const incidentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['incident'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'upsert',
				action: 'Create or update an incident',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [upsertIncident],
					},
					output: {
						postReceive: [
							prepareOutput,
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json._status = response.statusCode === 201 ? 'Created' : 'Updated';
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an incident',
				displayOptions: {
					show: {
						'@version': [2, 3],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [createIncident],
					},
					output: {
						postReceive: [
							prepareOutput,
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json._status = response.statusCode === 201 ? 'Created' : 'Updated';
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an incident',
				displayOptions: {
					show: {
						'@version': [2, 3],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [updateIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Add Label',
				value: 'addLabel',
				action: 'Add labels to an incident',
				displayOptions: {
					show: {
						'@version': [2, 3],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [addLabelsToIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Remove Label',
				value: 'removeLabel',
				action: 'Remove labels from an incident',
				displayOptions: {
					show: {
						'@version': [2, 3],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [removeLabelsFromIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an incident',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/incidents/{{ $parameter.incidentId }}',
					},
					output: {
						postReceive: [
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json = { _status: response.statusCode === 200 ? 'Deleted' : 'Not Found' };
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an incident',
				routing: {
					request: {
						method: 'GET',
						url: '=/incidents/{{ $parameter.incidentId }}',
					},
					output: {
						postReceive: [prepareOutput, includeRelatedData],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many incidents',
				routing: {
					send: {
						preSend: [buildFilterString],
					},
					request: {
						method: 'GET',
						url: '/incidents',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'value',
								},
							},
							prepareOutput,
							includeRelatedData,
						],
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								continue: '={{ $parameter.returnAll && $response?.body?.nextLink !== undefined }}',
								request: {
									url: '={{ $response?.body?.nextLink.replace(/&?(api-version|\\$top)=.*?(&|$)/g, "") || "/incidents" }}',
								},
							},
						},
					},
				},
			},
			{
				name: 'Get Alerts',
				value: 'getAlerts',
				action: 'Gets all alerts for an incident',
				routing: {
					request: {
						method: 'POST',
						url: '=/incidents/{{ $parameter.incidentId }}/alerts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'value',
								},
							},
							prepareOutput,
						],
					},
				},
			},
			{
				name: 'Get Entities',
				value: 'getEntities',
				action: 'Gets all entities for an incident',
				routing: {
					request: {
						method: 'POST',
						url: '=/incidents/{{ $parameter.incidentId }}/entities',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'entities',
								},
							},
							prepareOutput,
						],
					},
				},
			},
			{
				name: 'Create or Update Comment',
				value: 'upsertComment',
				action: 'Create or update a comment on an incident',
				displayOptions: {
					show: {
						'@version': [1, 2],
					},
				},
				routing: {
					request: {
						method: 'PUT',
						url: '=/incidents/{{ $parameter.incidentId }}/comments',
					},
					send: {
						preSend: [upsertComment],
					},
					output: {
						postReceive: [
							prepareOutput,
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json._status = response.statusCode === 201 ? 'Created' : 'Updated';
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Delete Comment',
				value: 'deleteComment',
				action: 'Delete a comment on an incident',
				displayOptions: {
					show: {
						'@version': [1, 2],
					},
				},
				routing: {
					request: {
						method: 'DELETE',
						url: '=/incidents/{{ $parameter.incidentId }}/comments/{{ $parameter.commentId }}',
					},
					output: {
						postReceive: [
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json = { _status: response.statusCode === 200 ? 'Deleted' : 'Not Found' };
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Get Comment',
				value: 'getComment',
				action: 'Gets a comment on an incident',
				displayOptions: {
					show: {
						'@version': [1, 2],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/incidents/{{ $parameter.incidentId }}/comments/{{ $parameter.commentId }}',
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Get Many Comments',
				value: 'getComments',
				action: 'Gets all comments for an incident',
				displayOptions: {
					show: {
						'@version': [1, 2],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/incidents/{{ $parameter.incidentId }}/comments',
						qs: { '$top': 1000 },
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'value',
								},
							},
							prepareOutput,
						],
					},
					// operations: {
					// 	pagination: {
					// 		type: 'generic',
					// 		properties: {
					// 			continue: '={{ $response.body.values.length > 0 }}',
					// 			request: {
					// 				url: '={{ $response.body.nextLink }}',
					// 			},
					// 		},
					// 	},
					// },
				},
			},
		],
		default: 'getAll',
	},
];

const getAllFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		routing: {
			send: {
				paginate: true,
			},
			request: {
				qs: {
					// 'api-version': '2025-06-01',
					$top: 1000,
				},
			},
		},
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: '$top',
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Alerts',
				name: 'includeAlerts',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include related alerts for each incident',
			},
			{
				displayName: 'Include Comments',
				name: 'includeComments',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include comments for each incident',
			},
			{
				displayName: 'Include Entities',
				name: 'includeEntities',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include related entities (IPs, hosts, accounts, etc.) for each incident',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Sort By',
				name: 'orderBy',
				type: 'options',
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Created',
						value: 'properties/createdTimeUtc',
					},
					{
						name: 'Updated',
						value: 'properties/lastModifiedTimeUtc',
					},
					{
						name: 'Incident Number',
						value: 'properties/incidentNumber',
					},
					{
						name: 'Severity',
						value: 'properties/severity',
					},
					{
						name: 'Status',
						value: 'properties/status',
					},
					{
						name: 'Title',
						value: 'properties/title',
					},
					{
						name: 'Owner',
						value: 'properties/owner/assignedTo',
					},
					{
						name: 'Classification',
						value: 'properties/classification',
					},
					{
						name: 'Classification Reason',
						value: 'properties/classificationReason',
					},
				],
				default: 'properties/lastModifiedTimeUtc',
				routing: {
					send: {
						type: 'query',
						property: '$orderby',
						value: '={{$value}} {{ $parameter.options.sort || "asc"}}',
					},
				},
				description: 'Whether to order the results',
			},
			{
				displayName: 'Sort Order',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'asc',
				description: 'Sort the results in the ascending/descending order',
			},
		],
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: {},
		/* eslint-disable n8n-nodes-base/node-param-collection-type-unsorted-items */
		options: [
			{
				displayName: 'Created After',
				name: 'createdAfter',
				type: 'dateTime',
				default: '',
				description:
					'Filter incidents created after a given UTC date-time (YYYY-MM-DDTHH:mm:ss.SSSZ)',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAfter',
				type: 'dateTime',
				default: '',
				description:
					'Filter incidents modified after a given UTC date-time (YYYY-MM-DDTHH:mm:ss.SSSZ)',
			},
			{
				displayName: 'Incident Number',
				name: 'incidentId',
				type: 'number',
				default: '',
				description: 'Filter incidents matching the given incident number',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'multiOptions',
				default: [],
				options: [
					{
						name: 'Informational',
						value: 'Informational',
					},
					{
						name: 'Low',
						value: 'Low',
					},
					{
						name: 'Medium',
						value: 'Medium',
					},
					{
						name: 'High',
						value: 'High',
					},
				],
				description: 'Filter incidents matching the given severity or severities',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{
						name: 'Active',
						value: 'Active',
					},
					{
						name: 'Closed',
						value: 'Closed',
					},
					{
						name: 'New',
						value: 'New',
					},
				],
				description: 'Filter incidents matching the given status or statuses',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Filter incidents where title contains the given string (case-insensitive)',
			},
			{
				displayName: 'Filter Query Parameter',
				name: 'filter',
				description:
					'<a href="https://learn.microsoft.com/en-us/graph/filter-query-parameter">Raw ODate $filter parameter</a> to filter results by',
				type: 'string',
				default: '',
				placeholder: "properties/labels/any(item: contains(toLower(item/labelName), 'benign'))",
			},
		],
		/* eslint-enable n8n-nodes-base/node-param-collection-type-unsorted-items */
	},
];

const getIncidentFields: INodeProperties[] = [
	// Incident ID for non-comment operations (all versions)
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['get', 'getAlerts', 'getEntities'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	// Incident ID for comment operations (v1/v2 only)
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getComments', 'getComment'],
				'@version': [1, 2],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getComment'],
				'@version': [1, 2],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the comment',
	},
	// Options for non-comment operations (all versions)
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['get', 'getAlerts', 'getEntities'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Alerts',
				name: 'includeAlerts',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include related alerts for this incident',
			},
			{
				displayName: 'Include Comments',
				name: 'includeComments',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include comments for this incident',
			},
			{
				displayName: 'Include Entities',
				name: 'includeEntities',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include related entities (IPs, hosts, accounts, etc.) for this incident',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			// Add options for getAlerts and getEntities to split the results
			{
				displayName: 'Split Results',
				name: 'splitResults',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['getAlerts', 'getEntities'],
					},
				},
				description: 'Whether to split the results into individual items',
			},
		],
	},
	// Options for comment operations (v1/v2 only)
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getComments', 'getComment'],
				'@version': [1, 2],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Split Results',
				name: 'splitResults',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['getComments'],
					},
				},
				description: 'Whether to split the results into individual items',
			}
		],
	},
];

const deleteIncidentFields: INodeProperties[] = [
	// Delete incident (all versions)
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['delete'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	// Delete comment fields (v1/v2 only)
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['deleteComment'],
				'@version': [1, 2],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['deleteComment'],
				'@version': [1, 2],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the comment',
	},
];

const upsertIncidentFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsert'],
			},
		},
		description: 'The title of the incident',
		required: true,
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsert'],
			},
		},
		description: 'The description of the incident',
	},
	{
		displayName: 'Severity',
		name: 'severity',
		type: 'options',
		default: 'High',
		options: [
			{
				name: 'High',
				value: 'High',
			},
			{
				name: 'Medium',
				value: 'Medium',
			},
			{
				name: 'Low',
				value: 'Low',
			},
			{
				name: 'Informational',
				value: 'Informational',
			},
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsert'],
			},
		},
		description: 'The severity of the incident',
		required: true,
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: 'New',
		options: [
			{
				name: 'New',
				value: 'New',
			},
			{
				name: 'Active',
				value: 'Active',
			},
			{
				name: 'Closed',
				value: 'Closed',
			},
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsert'],
			},
		},
		description: 'The status of the incident',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsert'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Incident ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the incident',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description:
					'The incident JSON properties to create or update. Merged with existing fields.',
			},
			{
				displayName: 'Etag',
				name: 'etag',
				type: 'string',
				default: '',
				description: 'Etag of the azure alert rule',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];


const upsertCommentFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsertComment'],
				'@version': [1, 2],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsertComment'],
				'@version': [1, 2],
			},
		},
		description: 'The comment message',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['upsertComment'],
				'@version': [1, 2],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Comment ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the incident',
			},
			{
				displayName: 'Etag',
				name: 'etag',
				type: 'string',
				default: '',
				description: 'Etag of the azure alert rule',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V2 Create Incident Fields
const createIncidentFields: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
				'@version': [2, 3],
			},
		},
		description: 'The title of the incident',
		required: true,
	},
	{
		displayName: 'Severity',
		name: 'severity',
		type: 'options',
		default: 'High',
		options: [
			{ name: 'High', value: 'High' },
			{ name: 'Medium', value: 'Medium' },
			{ name: 'Low', value: 'Low' },
			{ name: 'Informational', value: 'Informational' },
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
				'@version': [2, 3],
			},
		},
		description: 'The severity of the incident',
		required: true,
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: 'New',
		options: [
			{ name: 'New', value: 'New' },
			{ name: 'Active', value: 'Active' },
			{ name: 'Closed', value: 'Closed' },
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
				'@version': [2, 3],
			},
		},
		description: 'The status of the incident',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'The description of the incident',
			},
			{
				displayName: 'First Activity Time (UTC)',
				name: 'firstActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The first activity time in UTC',
			},
			{
				displayName: 'Label Mode',
				name: 'labelMode',
				type: 'options',
				options: [
					{ name: 'Add to Existing', value: 'add' },
					{ name: 'Replace All', value: 'replace' },
				],
				default: 'add',
				description: 'Whether to add labels to existing ones or replace all',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated labels or JSON array: "label1, label2" or ["label1", "label2"]',
				placeholder: 'suspicious, malware',
			},
			{
				displayName: 'Last Activity Time (UTC)',
				name: 'lastActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The last activity time in UTC',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'The owner UPN/email address (e.g., user@domain.com)',
				placeholder: 'user@domain.com',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Incident ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the incident (if not provided, a new UUID will be generated)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description: 'Additional incident properties in JSON format. Merged with other fields.',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V2 Update Incident Fields
const updateIncidentFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
				'@version': [2, 3],
			},
		},
		description: 'The UUID of the incident to update',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Classification',
				name: 'classificationAndReason',
				type: 'options',
				displayOptions: {
					hide: {
						status: ['New', 'Active'],
					},
				},
				default: 'Undetermined',
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{ name: 'Undetermined', value: 'Undetermined' },
					{ name: 'True Positive - Suspicious Activity', value: 'TruePositive:SuspiciousActivity' },
					{ name: 'Benign Positive - Suspicious But Expected', value: 'BenignPositive:SuspiciousButExpected' },
					{ name: 'False Positive - Incorrect Alert Logic', value: 'FalsePositive:IncorrectAlertLogic' },
					{ name: 'False Positive - Inaccurate Data', value: 'FalsePositive:InaccurateData' },
				],
				description: 'The classification and reason for the incident (typically used when status is Closed)',
			},
			{
				displayName: 'Classification Comment',
				name: 'classificationComment',
				type: 'string',
				displayOptions: {
					hide: {
						status: ['New', 'Active'],
					},
				},
				default: '',
				description: 'Comment explaining the classification (typically used when status is Closed)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'The description of the incident',
			},
			{
				displayName: 'First Activity Time (UTC)',
				name: 'firstActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The first activity time in UTC',
			},
			{
				displayName: 'Label Mode',
				name: 'labelMode',
				type: 'options',
				options: [
					{ name: 'Add to Existing', value: 'add' },
					{ name: 'Replace All', value: 'replace' },
				],
				default: 'add',
				description: 'Whether to add labels to existing ones or replace all',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated labels or JSON array: "label1, label2" or ["label1", "label2"]',
				placeholder: 'suspicious, malware',
			},
			{
				displayName: 'Last Activity Time (UTC)',
				name: 'lastActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The last activity time in UTC',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'The owner UPN/email address (e.g., user@domain.com)',
				placeholder: 'user@domain.com',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'options',
				default: 'High',
				options: [
					{ name: 'High', value: 'High' },
					{ name: 'Medium', value: 'Medium' },
					{ name: 'Low', value: 'Low' },
					{ name: 'Informational', value: 'Informational' },
				],
				description: 'The severity of the incident',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'New',
				options: [
					{ name: 'New', value: 'New' },
					{ name: 'Active', value: 'Active' },
					{ name: 'Closed', value: 'Closed' },
				],
				description: 'The status of the incident',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the incident',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description: 'Additional incident properties in JSON format. Merged with other fields.',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V2 Add Label Fields
const addLabelFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
				'@version': [2, 3],
			},
		},
		description: 'The UUID of the incident',
		required: true,
	},
	{
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
				'@version': [2, 3],
			},
		},
		description: 'Comma-separated labels or JSON array to add: "label1, label2" or ["label1", "label2"]',
		placeholder: 'suspicious, malware',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V2 Remove Label Fields
const removeLabelFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
				'@version': [2, 3],
			},
		},
		description: 'The UUID of the incident',
		required: true,
	},
	{
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
				'@version': [2, 3],
			},
		},
		description: 'Comma-separated labels or JSON array to remove: "label1, label2" or ["label1", "label2"]',
		placeholder: 'suspicious, malware',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
				'@version': [2, 3],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];


export const incidentFields: INodeProperties[] = [
	...getIncidentFields,
	...getAllFields,
	...deleteIncidentFields,
	...upsertIncidentFields,
	...createIncidentFields,
	...updateIncidentFields,
	...addLabelFields,
	...removeLabelFields,
	...upsertCommentFields,
];

// =============================================================================
// V3-SPECIFIC EXPORTS (clean, no @version guards, no comment operations)
// =============================================================================

/**
 * V3 Incident Operations - excludes comment operations (separate resource in V3)
 * All @version displayOptions removed since version is handled by node class
 */
export const incidentOperationsV3: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['incident'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an incident',
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [createIncident],
					},
					output: {
						postReceive: [
							prepareOutput,
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json._status = response.statusCode === 201 ? 'Created' : 'Updated';
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an incident',
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [updateIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Add Label',
				value: 'addLabel',
				action: 'Add labels to an incident',
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [addLabelsToIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Remove Label',
				value: 'removeLabel',
				action: 'Remove labels from an incident',
				routing: {
					request: {
						method: 'PUT',
						url: '/incidents',
					},
					send: {
						preSend: [removeLabelsFromIncident],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an incident',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/incidents/{{ $parameter.incidentId }}',
					},
					output: {
						postReceive: [
							async function (
								this: IExecuteSingleFunctions,
								items: INodeExecutionData[],
								response: IN8nHttpFullResponse,
							) {
								for (const item of items) {
									item.json = { _status: response.statusCode === 200 ? 'Deleted' : 'Not Found' };
								}
								return items;
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an incident',
				routing: {
					request: {
						method: 'GET',
						url: '=/incidents/{{ $parameter.incidentId }}',
					},
					output: {
						postReceive: [prepareOutput, includeRelatedData],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many incidents',
				routing: {
					send: {
						preSend: [buildFilterString],
					},
					request: {
						method: 'GET',
						url: '/incidents',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'value',
								},
							},
							prepareOutput,
							includeRelatedData,
						],
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								continue: '={{ $parameter.returnAll && $response?.body?.nextLink !== undefined }}',
								request: {
									url: '={{ $response?.body?.nextLink.replace(/&?(api-version|\\$top)=.*?(&|$)/g, "") || "/incidents" }}',
								},
							},
						},
					},
				},
			},
			{
				name: 'Get Alerts',
				value: 'getAlerts',
				action: 'Gets all alerts for an incident',
				routing: {
					request: {
						method: 'POST',
						url: '=/incidents/{{ $parameter.incidentId }}/alerts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'value',
								},
							},
							prepareOutput,
						],
					},
				},
			},
			{
				name: 'Get Entities',
				value: 'getEntities',
				action: 'Gets all entities for an incident',
				routing: {
					request: {
						method: 'POST',
						url: '=/incidents/{{ $parameter.incidentId }}/entities',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'entities',
								},
							},
							prepareOutput,
						],
					},
				},
			},
		],
		default: 'getAll',
	},
];

/**
 * V3 Incident Fields - excludes comment-related fields (separate resource in V3)
 * All @version displayOptions removed since version is handled by node class
 */

// V3 Get Many fields (same structure, no @version guards)
const getAllFieldsV3: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		routing: {
			send: {
				paginate: true,
			},
			request: {
				qs: {
					$top: 1000,
				},
			},
		},
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: '$top',
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Alerts',
				name: 'includeAlerts',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include related alerts for each incident',
			},
			{
				displayName: 'Include Comments',
				name: 'includeComments',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include comments for each incident',
			},
			{
				displayName: 'Include Entities',
				name: 'includeEntities',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch and include related entities (IPs, hosts, accounts, etc.) for each incident',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Sort By',
				name: 'orderBy',
				type: 'options',
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{ name: 'Created', value: 'properties/createdTimeUtc' },
					{ name: 'Updated', value: 'properties/lastModifiedTimeUtc' },
					{ name: 'Incident Number', value: 'properties/incidentNumber' },
					{ name: 'Severity', value: 'properties/severity' },
					{ name: 'Status', value: 'properties/status' },
					{ name: 'Title', value: 'properties/title' },
					{ name: 'Owner', value: 'properties/owner/assignedTo' },
					{ name: 'Classification', value: 'properties/classification' },
					{ name: 'Classification Reason', value: 'properties/classificationReason' },
				],
				default: 'properties/lastModifiedTimeUtc',
				routing: {
					send: {
						type: 'query',
						property: '$orderby',
						value: '={{$value}} {{ $parameter.options.sort || "asc"}}',
					},
				},
				description: 'Whether to order the results',
			},
			{
				displayName: 'Sort Order',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'asc',
				description: 'Sort the results in the ascending/descending order',
			},
		],
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getAll'],
			},
		},
		default: {},
		/* eslint-disable n8n-nodes-base/node-param-collection-type-unsorted-items */
		options: [
			{
				displayName: 'Created After',
				name: 'createdAfter',
				type: 'dateTime',
				default: '',
				description:
					'Filter incidents created after a given UTC date-time (YYYY-MM-DDTHH:mm:ss.SSSZ)',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAfter',
				type: 'dateTime',
				default: '',
				description:
					'Filter incidents modified after a given UTC date-time (YYYY-MM-DDTHH:mm:ss.SSSZ)',
			},
			{
				displayName: 'Incident Number',
				name: 'incidentId',
				type: 'number',
				default: '',
				description: 'Filter incidents matching the given incident number',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Informational', value: 'Informational' },
					{ name: 'Low', value: 'Low' },
					{ name: 'Medium', value: 'Medium' },
					{ name: 'High', value: 'High' },
				],
				description: 'Filter incidents matching the given severity or severities',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Active', value: 'Active' },
					{ name: 'Closed', value: 'Closed' },
					{ name: 'New', value: 'New' },
				],
				description: 'Filter incidents matching the given status or statuses',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Filter incidents where title contains the given string (case-insensitive)',
			},
			{
				displayName: 'Filter Query Parameter',
				name: 'filter',
				description:
					'<a href="https://learn.microsoft.com/en-us/graph/filter-query-parameter">Raw ODate $filter parameter</a> to filter results by',
				type: 'string',
				default: '',
				placeholder: "properties/labels/any(item: contains(toLower(item/labelName), 'benign'))",
			},
		],
		/* eslint-enable n8n-nodes-base/node-param-collection-type-unsorted-items */
	},
];

// V3 Get Incident fields (no comment operations)
const getIncidentFieldsV3: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['get', 'getAlerts', 'getEntities'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['get', 'getAlerts', 'getEntities'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Include Alerts',
				name: 'includeAlerts',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include related alerts for this incident',
			},
			{
				displayName: 'Include Comments',
				name: 'includeComments',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include comments for this incident',
			},
			{
				displayName: 'Include Entities',
				name: 'includeEntities',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['get'],
					},
				},
				description: 'Whether to fetch and include related entities (IPs, hosts, accounts, etc.) for this incident',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Split Results',
				name: 'splitResults',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['getAlerts', 'getEntities'],
					},
				},
				description: 'Whether to split the results into individual items',
			},
		],
	},
];

// V3 Delete Incident fields (no comment operations)
const deleteIncidentFieldsV3: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['delete'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
	},
];

// V3 Create Incident Fields (no @version guards)
const createIncidentFieldsV3: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
			},
		},
		description: 'The title of the incident',
		required: true,
	},
	{
		displayName: 'Severity',
		name: 'severity',
		type: 'options',
		default: 'High',
		options: [
			{ name: 'High', value: 'High' },
			{ name: 'Medium', value: 'Medium' },
			{ name: 'Low', value: 'Low' },
			{ name: 'Informational', value: 'Informational' },
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
			},
		},
		description: 'The severity of the incident',
		required: true,
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: 'New',
		options: [
			{ name: 'New', value: 'New' },
			{ name: 'Active', value: 'Active' },
			{ name: 'Closed', value: 'Closed' },
		],
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
			},
		},
		description: 'The status of the incident',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'The description of the incident',
			},
			{
				displayName: 'First Activity Time (UTC)',
				name: 'firstActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The first activity time in UTC',
			},
			{
				displayName: 'Label Mode',
				name: 'labelMode',
				type: 'options',
				options: [
					{ name: 'Add to Existing', value: 'add' },
					{ name: 'Replace All', value: 'replace' },
				],
				default: 'add',
				description: 'Whether to add labels to existing ones or replace all',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated labels or JSON array: "label1, label2" or ["label1", "label2"]',
				placeholder: 'suspicious, malware',
			},
			{
				displayName: 'Last Activity Time (UTC)',
				name: 'lastActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The last activity time in UTC',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'The owner UPN/email address (e.g., user@domain.com)',
				placeholder: 'user@domain.com',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Incident ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the incident (if not provided, a new UUID will be generated)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description: 'Additional incident properties in JSON format. Merged with other fields.',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V3 Update Incident Fields (no @version guards)
const updateIncidentFieldsV3: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
		description: 'The UUID of the incident to update',
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Classification',
				name: 'classificationAndReason',
				type: 'options',
				displayOptions: {
					hide: {
						status: ['New', 'Active'],
					},
				},
				default: 'Undetermined',
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{ name: 'Undetermined', value: 'Undetermined' },
					{ name: 'True Positive - Suspicious Activity', value: 'TruePositive:SuspiciousActivity' },
					{ name: 'Benign Positive - Suspicious But Expected', value: 'BenignPositive:SuspiciousButExpected' },
					{ name: 'False Positive - Incorrect Alert Logic', value: 'FalsePositive:IncorrectAlertLogic' },
					{ name: 'False Positive - Inaccurate Data', value: 'FalsePositive:InaccurateData' },
				],
				description: 'The classification and reason for the incident (typically used when status is Closed)',
			},
			{
				displayName: 'Classification Comment',
				name: 'classificationComment',
				type: 'string',
				displayOptions: {
					hide: {
						status: ['New', 'Active'],
					},
				},
				default: '',
				description: 'Comment explaining the classification (typically used when status is Closed)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'The description of the incident',
			},
			{
				displayName: 'First Activity Time (UTC)',
				name: 'firstActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The first activity time in UTC',
			},
			{
				displayName: 'Label Mode',
				name: 'labelMode',
				type: 'options',
				options: [
					{ name: 'Add to Existing', value: 'add' },
					{ name: 'Replace All', value: 'replace' },
				],
				default: 'add',
				description: 'Whether to add labels to existing ones or replace all',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated labels or JSON array: "label1, label2" or ["label1", "label2"]',
				placeholder: 'suspicious, malware',
			},
			{
				displayName: 'Last Activity Time (UTC)',
				name: 'lastActivityTimeUtc',
				type: 'dateTime',
				default: '',
				description: 'The last activity time in UTC',
			},
			{
				displayName: 'Owner',
				name: 'owner',
				type: 'string',
				default: '',
				description: 'The owner UPN/email address (e.g., user@domain.com)',
				placeholder: 'user@domain.com',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'options',
				default: 'High',
				options: [
					{ name: 'High', value: 'High' },
					{ name: 'Medium', value: 'Medium' },
					{ name: 'Low', value: 'Low' },
					{ name: 'Informational', value: 'Informational' },
				],
				description: 'The severity of the incident',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'New',
				options: [
					{ name: 'New', value: 'New' },
					{ name: 'Active', value: 'Active' },
					{ name: 'Closed', value: 'Closed' },
				],
				description: 'The status of the incident',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'The title of the incident',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description: 'Additional incident properties in JSON format. Merged with other fields.',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V3 Add Label Fields (no @version guards)
const addLabelFieldsV3: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
			},
		},
		description: 'The UUID of the incident',
		required: true,
	},
	{
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
			},
		},
		description: 'Comma-separated labels or JSON array to add: "label1, label2" or ["label1", "label2"]',
		placeholder: 'suspicious, malware',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['addLabel'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

// V3 Remove Label Fields (no @version guards)
const removeLabelFieldsV3: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
			},
		},
		description: 'The UUID of the incident',
		required: true,
	},
	{
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
			},
		},
		description: 'Comma-separated labels or JSON array to remove: "label1, label2" or ["label1", "label2"]',
		placeholder: 'suspicious, malware',
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['removeLabel'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Force Update',
				name: 'forceUpdate',
				type: 'boolean',
				default: false,
				description: 'Whether to bypass etag validation and force the update',
			},
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
		],
	},
];

/**
 * Combined V3 Incident Fields export
 */
export const incidentFieldsV3: INodeProperties[] = [
	...getIncidentFieldsV3,
	...getAllFieldsV3,
	...deleteIncidentFieldsV3,
	...createIncidentFieldsV3,
	...updateIncidentFieldsV3,
	...addLabelFieldsV3,
	...removeLabelFieldsV3,
];
