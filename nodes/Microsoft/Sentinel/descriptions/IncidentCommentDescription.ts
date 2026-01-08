/**
 * Incident Comment Resource Description
 *
 * This resource is only visible in node version 3+.
 * For v1/v2, comment operations are under the Incident resource.
 *
 * API Endpoints:
 * - GET /incidents/{incidentId}/comments - Get all comments
 * - GET /incidents/{incidentId}/comments/{commentId} - Get single comment
 * - PUT /incidents/{incidentId}/comments/{commentId} - Create or update comment
 * - DELETE /incidents/{incidentId}/comments/{commentId} - Delete comment
 *
 * Note: Microsoft Sentinel has a hard limit of 100 comments per incident.
 */

import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { prepareOutput, upsertComment, updateComment } from '../GenericFunctions';

export const incidentCommentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['incidentComment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a comment on an incident',
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
				name: 'Delete',
				value: 'delete',
				action: 'Delete a comment from an incident',
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
				name: 'Get',
				value: 'get',
				action: 'Get a comment from an incident',
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
				name: 'Get Many',
				value: 'getMany',
				action: 'Get all comments for an incident',
				routing: {
					request: {
						method: 'GET',
						url: '=/incidents/{{ $parameter.incidentId }}/comments',
						qs: { $top: 100 }, // API hard limit is 100 comments per incident
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
				name: 'Update',
				value: 'update',
				action: 'Update a comment on an incident',
				routing: {
					request: {
						method: 'PUT',
						url: '=/incidents/{{ $parameter.incidentId }}/comments/{{ $parameter.commentId }}',
					},
					send: {
						preSend: [updateComment],
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
		],
		default: 'getMany',
	},
];

// Fields for Create operation
const createFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		description: 'The comment message (max 30,000 characters)',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Comment ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the comment (if not provided, a new UUID will be generated)',
			},
			{
				displayName: 'Etag',
				name: 'etag',
				type: 'string',
				default: '',
				description: 'Etag for optimistic concurrency control',
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

// Fields for Update operation
const updateFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the comment to update',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		description: 'The updated comment message (max 30,000 characters)',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Etag',
				name: 'etag',
				type: 'string',
				default: '',
				description: 'Etag for optimistic concurrency control',
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

// Fields for Delete operation
const deleteFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['delete'],
			},
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the comment to delete',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['delete'],
			},
		},
	},
];

// Fields for Get operation
const getFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the comment to retrieve',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['get'],
			},
		},
		options: [
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

// Fields for Get Many operation
const getManyFields: INodeProperties[] = [
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the incident',
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['getMany'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['incidentComment'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Split Results',
				name: 'splitResults',
				type: 'boolean',
				default: false,
				description: 'Whether to split the results into individual items',
			},
		],
	},
];

export const incidentCommentFields: INodeProperties[] = [
	...createFields,
	...updateFields,
	...deleteFields,
	...getFields,
	...getManyFields,
];
