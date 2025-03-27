// Get Many: /incidents  (paged)
// Get: /incidents/{incidentId}
// Delete: /incidents/{incidentId}
// Get Alerts: /incidents/{incidentId}/alerts
// Get Entities: /incidents/{incidentId}/entities
// Get Relations: /incidents/{incidentId}/relations (paged)

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
	// mergeProperties,
	prepareOutput,
	upsertIncident,
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
								// @ts-ignore
								console.log('items', items);
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
						postReceive: [prepareOutput],
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
					'api-version': '2023-09-01-preview',
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
				displayName: 'Incident ID',
				name: 'incidentId',
				type: 'number',
				default: '',
				description: 'Filter incidents matching the given incident ID',
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
	},
];

const getIncidentFields: INodeProperties[] = [
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

const deleteIncidentFields: INodeProperties[] = [
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

export const incidentFields: INodeProperties[] = [
	...getIncidentFields,
	...getAllFields,
	...deleteIncidentFields,
	...upsertIncidentFields,
];
