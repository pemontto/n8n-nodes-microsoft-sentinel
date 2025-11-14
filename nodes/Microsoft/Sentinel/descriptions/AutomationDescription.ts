// Create or Update: /automationRules/{automationRuleId}
// Delete: /automationRules/{automationRuleId}
// Get: /automationRules/{automationRuleId}
// Get Many: /automationRules
// Create or Update: /automationRules/{ruleId}
// Delete: /automationRules/{ruleId}
// Get: /automationRules/{ruleId}
// Get Many: /automationRules

import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { prepareOutput, upsertAutomationRule } from '../GenericFunctions';

export const automationRuleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['automationRule'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'upsert',
				action: 'Create or update an automation rule',
				routing: {
					request: {
						method: 'PUT',
						url: '/automationRules',
						// ignoreHttpStatusErrors: true,
						// returnFullResponse: true,
					},
					send: {
						preSend: [upsertAutomationRule],
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
				action: 'Delete an automation rule',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/automationRules/{{ $parameter.automationRuleId }}',
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
				action: 'Get an automation rule',
				routing: {
					request: {
						method: 'GET',
						url: '=/automationRules/{{ $parameter.automationRuleId }}',
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many automation rules',
				routing: {
					request: {
						method: 'GET',
						url: '/automationRules',
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
		],
		default: 'getAll',
	},
];

const getAutomationRuleFields: INodeProperties[] = [
	{
		displayName: 'Automation Rule ID',
		name: 'automationRuleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['get'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the automation rule',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['get', 'getAll'],
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

const deleteAutomationRuleFields: INodeProperties[] = [
	{
		displayName: 'Automation Rule ID',
		name: 'automationRuleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['delete'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the automation rule',
	},
];

const upsertautomationRuleFields: INodeProperties[] = [
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['upsert'],
			},
		},
		description: 'Whether this automation rule is enabled or disabled',
	},
	{
		displayName: 'Rule Name',
		name: 'displayName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['upsert'],
			},
		},
		description: 'The display name of the automation rule',
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'number',
		default: 1,
		required: true,
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
			numberStepSize: 1,
		},
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['upsert'],
			},
		},
		description: 'The order of execution of the automation rule, lower numbers run first',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['automationRule'],
				operation: ['upsert'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Automation Rule ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the automation rule',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description:
					'The automation rule JSON properties to create or update. Merged with existing fields.',
			},
			{
				displayName: 'Etag',
				name: 'etag',
				type: 'string',
				default: '',
				description: 'Etag of the azure automation rule',
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

export const automationRuleFields: INodeProperties[] = [
	...getAutomationRuleFields,
	...deleteAutomationRuleFields,
	...upsertautomationRuleFields,
];
