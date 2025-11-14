// Create or Update: /alertRules/{ruleId}
// Delete: /alertRules/{ruleId}
// Get: /alertRules/{ruleId}
// Get Many: /alertRules

import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { prepareOutput, upsertAlertRule } from '../GenericFunctions';

export const alertRuleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'upsert',
				action: 'Create or update an alert rule',
				routing: {
					request: {
						method: 'PUT',
						url: '/alertRules',
						// ignoreHttpStatusErrors: true,
						// returnFullResponse: true,
					},
					send: {
						preSend: [upsertAlertRule],
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
				action: 'Delete an alert rule',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/alertRules/{{ $parameter.alertRuleId }}',
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
				action: 'Get an alert rule',
				routing: {
					request: {
						method: 'GET',
						url: '=/alertRules/{{ $parameter.alertRuleId }}',
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				// eslint-disable-next-line
				name: 'Get Many Rules',
				value: 'getAll',
				action: 'Get many alert rules',
				routing: {
					request: {
						method: 'GET',
						url: '/alertRules',
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
				name: 'Get Template',
				value: 'getTemplate',
				action: 'Get an alert rule template',
				routing: {
					request: {
						method: 'GET',
						url: '=/alertRuleTemplates/{{ $parameter.alertRuleId }}',
					},
					output: {
						postReceive: [prepareOutput],
					},
				},
			},
			{
				name: 'Get Many Templates',
				value: 'getAllTemplates',
				action: 'Get all alert rule templates',
				routing: {
					request: {
						method: 'GET',
						url: '/alertRuleTemplates',
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

const getAlertRuleFields: INodeProperties[] = [
	{
		displayName: 'Alert Rule ID',
		name: 'alertRuleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['get', 'getTemplate'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the alert rule',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['get', 'getAll', 'getTemplate', 'getAllTemplates'],
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

const deleteAlertRuleFields: INodeProperties[] = [
	{
		displayName: 'Alert Rule ID',
		name: 'alertRuleId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['delete'],
			},
		},
		required: true,
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'The UUID of the alert rule',
	},
];

const scheduledRuleFields: INodeProperties[] = [
	{
		displayName: 'Severity',
		name: 'severity',
		type: 'options',
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
		default: 'Informational',
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled', 'NRT'],
			},
		},
		description: 'The severity for alerts created by this alert rule',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		placeholder: 'SecurityAlert | where Severity == "High"',
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled', 'NRT'],
			},
		},
		description: 'The query that creates alerts for this rule',
	},
	{
		displayName: 'Query Frequency',
		name: 'queryFrequency',
		type: 'string',
		default: '',
		placeholder: 'PT1H',
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled'],
			},
		},
		description: 'The frequency (in ISO 8601 duration format) for this alert rule to run',
	},
	{
		displayName: 'Query Period',
		name: 'queryPeriod',
		type: 'string',
		default: '',
		placeholder: 'PT1H',
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled'],
			},
		},
		description: 'The period (in ISO 8601 duration format) that this alert rule looks at',
	},
	{
		displayName: 'Trigger Operator',
		name: 'triggerOperator',
		default: 'greaterThan',
		type: 'options',
		options: [
			{
				name: 'Equal',
				value: 'equal',
			},
			{
				name: 'GreaterThan',
				value: 'greaterThan',
			},
			{
				name: 'LessThan',
				value: 'lessThan',
			},
			{
				name: 'NotEqual',
				value: 'notEqual',
			},
		],
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled'],
			},
		},
		description: 'The operation against the threshold that triggers alert rule',
	},
	{
		displayName: 'Trigger Threshold',
		name: 'triggerThreshold',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled'],
			},
		},
		description: 'The threshold that triggers this alert rule',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled', 'NRT'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Alert Details Override',
				name: 'alertDetailsOverride',
				type: 'collection',
				placeholder: 'Add Alert Detail Override',
				default: {},
				description: 'The alert details override settings',
				options: [
					{
						displayName: 'Alert Description Format',
						name: 'alertDescriptionFormat',
						type: 'string',
						default: '',
						description: 'The format containing column name(s) to override the alert description',
					},
					{
						displayName: 'Alert Display Name Format',
						name: 'alertDisplayNameFormat',
						type: 'string',
						default: '',
						description: 'The format containing column name(s) to override the alert name',
					},
					{
						displayName: 'Alert Dynamic Properties',
						name: 'alertDynamicProperties',
						type: 'collection',
						placeholder: 'Add Alert Dynamic Property',
						default: {},
						description: 'List of additional dynamic properties to override',
						options: [
							{
								displayName: 'Property Name',
								name: 'propertyName',
								type: 'string',
								default: '',
								description: 'The name of the dynamic property',
							},
							{
								displayName: 'Column Name',
								name: 'columnName',
								type: 'string',
								default: '',
								description: 'The column name to override the dynamic property',
							},
						],
					},
					{
						displayName: 'Alert Severity Column Name',
						name: 'alertSeverityColumnName',
						type: 'string',
						default: '',
						description: 'The column name to take the alert severity from',
					},
					{
						displayName: 'Alert Tactics Column Name',
						name: 'alertTacticsColumnName',
						type: 'string',
						default: '',
						description: 'The column name to take the alert tactics from',
					},
				],
			},
			{
				displayName: 'Alert Rule Template Name',
				name: 'alertRuleTemplateName',
				type: 'string',
				default: '',
				description: 'The Name of the alert rule template used to create this rule',
			},
			{
				displayName: 'Custom Details',
				name: 'customDetails',
				type: 'string',
				default: '',
				description: 'Dictionary of string key-value pairs of columns to be attached to the alert',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'The description of the alert rule',
			},
			{
				displayName: 'Entity Mappings',
				name: 'entityMappings',
				type: 'string',
				default: '',
				description: 'Array of the entity mappings of the alert rule',
			},
			{
				displayName: 'Event Grouping Settings',
				name: 'eventGroupingSettings',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Incident Configuration',
				name: 'incidentConfiguration',
				type: 'string',
				default: '',
				description:
					'The settings of the incidents that created from alerts triggered by this analytics rule',
			},
			{
				displayName: 'Sentinel Entities Mappings',
				name: 'sentinelEntitiesMappings',
				type: 'string',
				default: '',
				description: 'Array of the sentinel entity mappings of the alert rule',
			},
			{
				displayName: 'Suppression Duration',
				name: 'suppressionDuration',
				type: 'string',
				default: 'PT5H',
				description:
					'The suppression (in ISO 8601 duration format) to wait since last time this alert rule been triggered',
			},
			{
				displayName: 'Suppression Enabled',
				name: 'suppressionEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether the suppression for this alert rule is enabled or disabled',
			},
			{
				displayName: 'Tactics',
				name: 'tactics',
				type: 'string',
				default: '',
				description: 'The tactics of the alert rule',
			},
			{
				displayName: 'Techniques',
				name: 'techniques',
				type: 'string',
				default: '',
				description: 'The techniques of the alert rule',
			},
			{
				displayName: 'Template Version',
				name: 'templateVersion',
				type: 'string',
				default: '',
				description: 'The version of the alert rule template used to create this rule',
			},
		],
	},
];

const upsertAlertRuleFields: INodeProperties[] = [
	{
		displayName: 'Rule Type',
		name: 'ruleType',
		type: 'options',
		default: 'Scheduled',
		options: [
			{
				name: 'Fusion',
				value: 'Fusion',
			},
			{
				name: 'Microsoft Security Incident Creation',
				value: 'MicrosoftSecurityIncidentCreation',
			},
			{
				name: 'ML Behavior Analytics',
				value: 'MLBehaviorAnalytics',
			},
			{
				name: 'Near-Real-Time (NRT)',
				value: 'NRT',
			},
			{
				name: 'Scheduled',
				value: 'Scheduled',
			},
			{
				name: 'Threat Intelligence',
				value: 'ThreatIntelligence',
			},
		],
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
			},
		},
		description: 'The UUID of the incident',
	},
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
			},
		},
		description: 'Whether this alert rule is enabled or disabled',
	},
	{
		displayName: 'Rule Name',
		name: 'displayName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Scheduled', 'NRT', 'MicrosoftSecurityIncidentCreation'],
			},
		},
		description: 'The display name for alerts created by this alert rule',
	},
	...scheduledRuleFields,
	{
		displayName: 'Alert Rule Template Name',
		name: 'alertRuleTemplateName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
				ruleType: ['Fusion', 'MLBehaviorAnalytics', 'ThreatIntelligence'],
			},
		},
		description: 'The Name of the alert rule template used to create this rule',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['alertRule'],
				operation: ['upsert'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Alert Rule ID',
				name: 'objectId',
				type: 'string',
				default: '',
				placeholder: '00000000-0000-0000-0000-000000000000',
				description: 'The UUID of the alert rule',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'json',
				default: '',
				description:
					'The alert rule JSON properties to create or update. Merged with existing fields.',
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

export const alertRuleFields: INodeProperties[] = [
	...getAlertRuleFields,
	...deleteAlertRuleFields,
	...upsertAlertRuleFields,
];
