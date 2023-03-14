import type { INodeProperties } from 'n8n-workflow';

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
			// {
			// 	name: 'Add Tag',
			// 	value: 'addTag',
			// 	description: 'Add tag to incident',
			// 	action: 'Add tag to incident',
			// },
			{
				name: 'Alerts',
				value: 'alerts',
				description: 'Get alerts for an incident',
				action: 'Get alerts for an incident',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an incident',
				action: 'Create an incident',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an incident',
				action: 'Delete an incident',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an incident',
				action: 'Get an incident',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many incidents',
				action: 'Get many incidents',
			},
			// {
			// 	name: 'Remove Tag',
			// 	value: 'removeTag',
			// 	description: 'Remove tag from incident',
			// 	action: 'Remove tag from incident',
			// },
			{
				name: 'Update',
				value: 'update',
				description: 'Update an incident',
				action: 'Update an incident',
			},
		],
		default: 'getAll',
	},
];

export const incidentFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                        incident:create                                     */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Title',
		name: 'title',
		required: true,
		type: 'string',
		displayOptions: {
			show: {
				operation: ['create'],
				resource: ['incident'],
			},
		},
		default: '',
		description: 'Incident title as it will appear to the user in Microsoft Sentinel',
	},
	{
		displayName: 'Severity',
		name: 'severity',
		required: true,
		type: 'options',
		displayOptions: {
			show: {
				operation: ['create'],
				resource: ['incident'],
			},
		},
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
		default: 'Informational',
		description: 'Incident severity',
	},
	{
		displayName: 'Status',
		name: 'status',
		required: true,
		type: 'options',
		displayOptions: {
			show: {
				operation: ['create'],
				resource: ['incident'],
			},
		},
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
		default: 'New',
		description: 'Incident status',
	},

	/* -------------------------------------------------------------------------- */
	/*                        incident:update                                     */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		required: true,
		type: 'string',
		displayOptions: {
			show: {
				operation: ['update'],
				resource: ['incident'],
			},
		},
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'ID of the incident to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		placeholder: 'Add Field',
		description: 'Additional options to update',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				operation: ['update'],
				resource: ['incident'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Incident title as it will appear to the user in Microsoft Sentinel',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'options',
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
				default: 'Informational',
				description: 'Incident severity',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
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
				default: 'New',
				description: 'Incident status',
			},
			{
				displayName: 'Add Tags',
				name: 'addTags',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Tag',
				},
				default: '',
				description: 'Tags to add to the incident',
			},
			{
				displayName: 'Remove Tags',
				name: 'removeTags',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Remove Tag',
				},
				default: '',
				description: 'Tags to remove from the incident',
			},
			// // Would prefer this with arbitrary text input
			// {
			// 	displayName: 'Remove Tags',
			// 	name: 'removeTags',
			// 	type: 'multiOptions',
			// 	default: [],
			// 	description: 'Tags to remove from the incident',
			// },
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                        incident:create/update                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		description: 'Additional options to add',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				operation: ['create', 'update'],
				resource: ['incident'],
			},
		},
		options: [
			// Boolean option to simplify output
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
	// {
	// 	displayName: 'Options',
	// 	name: 'options',
	// 	type: 'collection',
	// 	displayOptions: {
	// 		show: {
	// 			operation: ['create'],
	// 			resource: ['incident'],
	// 		},
	// 	},
	// 	default: {},
	// 	placeholder: 'Add Field',
	// 	options: [
	// 		{
	// 			displayName: 'Description',
	// 			name: 'description',
	// 			type: 'string',
	// 			default: '',
	// 			description: 'Incident\'s description',
	// 		},
	// 		{
	// 			displayName: 'Type',
	// 			name: 'type',
	// 			type: 'options',
	// 			options: [
	// 				{
	// 					name: 'Private',
	// 					value: 'private',
	// 				},
	// 				{
	// 					name: 'Standard',
	// 					value: 'standard',
	// 				},
	// 			],
	// 			default: 'standard',
	// 			description: 'The type of the incident',
	// 		},
	// 	],
	// },

	/* -------------------------------------------------------------------------- */
	/*                                 incident:delete                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		required: true,
		type: 'string',
		// typeOptions: {
		// 	loadOptionsMethod: 'getIncidents',
		// },
		displayOptions: {
			show: {
				operation: ['delete'],
				resource: ['incident'],
			},
		},
		default: '',
		placeholder: '00000000-0000-0000-0000-000000000000',
		description: 'ID of the incident to delete',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 incident:get                               */
	/* -------------------------------------------------------------------------- */
	// {
	// 	displayName: 'Team Name or ID',
	// 	name: 'teamId',
	// 	required: true,
	// 	type: 'options',
	// 	description:
	// 		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
	// 	typeOptions: {
	// 		loadOptionsMethod: 'getTeams',
	// 	},
	// 	displayOptions: {
	// 		show: {
	// 			operation: ['get'],
	// 			resource: ['incident'],
	// 		},
	// 	},
	// 	default: '',
	// },
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		required: true,
		type: 'string',
		// typeOptions: {
		// 	loadOptionsMethod: 'getIncidents',
		// },
		displayOptions: {
			show: {
				operation: ['get'],
				resource: ['incident'],
			},
		},
		default: '',
		description: 'ID of the incident to retrieve',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 incident:getAll                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getAll'],
				resource: ['incident'],
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
				operation: ['getAll'],
				resource: ['incident'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		default: {},
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				operation: ['getAll'],
				resource: ['incident'],
			},
		},
		options: [
			{
				displayName: 'Create After',
				name: 'createdAfter',
				description: 'Incidente created after date',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Modified After',
				name: 'modifiedAfter',
				description: 'Incidents modified after date',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'multiOptions',
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
				default: [],
				description: 'Incident severity to filter for',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
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
				default: [],
				description: 'Incident status to filter for',
			},
			{
				displayName: 'Filter Query Parameter',
				name: 'filter',
				description:
					'<a href="https://learn.microsoft.com/en-us/graph/filter-query-parameter">Query parameter</a> to filter results by',
				type: 'string',
				default: '',
				placeholder: "properties/labels/any(i: i/labelName eq 'Benign')",
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		description: 'Additional options to add',
		type: 'collection',
		default: {},
		displayOptions: {
			show: {
				operation: ['get', 'getAll'],
				resource: ['incident'],
			},
		},
		options: [
			// Boolean option to simplify output
			{
				displayName: 'Simplify',
				name: 'simple',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
			},
			{
				displayName: 'Number of Images',
				name: 'n',
				default: 1,
				description: 'Number of images to generate',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				routing: {
					send: {
						type: 'body',
						property: 'n',
					},
				},
			},
			{
				displayName: 'Resolution',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '256x256',
						value: '256x256',
					},
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '1024x1024',
						value: '1024x1024',
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'size',
					},
				},
				default: '1024x1024',
			},
		],
	},
];
