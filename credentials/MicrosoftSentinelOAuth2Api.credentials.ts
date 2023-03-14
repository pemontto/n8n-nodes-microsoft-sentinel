import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MicrosoftSentinelOAuth2Api implements ICredentialType {
	name = 'microsoftSentinelOAuth2Api';

	displayName = 'Microsoft Sentinel OAuth2 API';

	extends = ['microsoftOAuth2Api'];

	documentationUrl = 'https://learn.microsoft.com/en-gb/rest/api/securityinsights';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'options',
			options: [
				{
					name: 'Authorization Code',
					value: 'authorizationCode',
				},
				{
					name: 'Client Credentials',
					value: 'clientCredentials',
				},
			],
			default: 'clientCredentials',
		},
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			description: 'The ID of the tenant this client credential belongs to',
			// type: 'hidden',
			type: 'string',
			default: '',
			placeholder: '00000000-0000-0000-0000-000000000000',
			displayOptions: {
				show: {
					grantType: ['clientCredentials'],
				},
			},
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default:
				'=https://login.microsoftonline.com/{{ $self["tenantId"] ? $self["tenantId"] : "common" }}/oauth2/v2.0/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default:
				'=https://login.microsoftonline.com/{{ $self["tenantId"] ? $self["tenantId"] : "common" }}/oauth2/v2.0/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'https://management.azure.com/.default offline_access',
		},
		{
			displayName: 'Default Subscription ID',
			name: 'subscriptionId',
			type: 'string',
			default: '',
			placeholder: '00000000-0000-0000-0000-000000000000',
			description: 'Subscription ID where the default Sentinel workspace is located',
		},
		{
			displayName: 'Default Resource Group Name',
			name: 'resourceGroupName',
			type: 'string',
			default: '',
			placeholder: 'sentinel-rg',
			description: 'Resource group name where the default Sentinel workspace is located',
		},
		{
			displayName: 'Default Workspace Name',
			name: 'workspaceName',
			type: 'string',
			default: '',
			placeholder: 'sentinel',
			description: 'Default Sentinel workspace name',
		},
	];
}
