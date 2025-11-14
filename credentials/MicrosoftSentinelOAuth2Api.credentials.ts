import type { Icon, ICredentialType, ICredentialTestRequest, INodeProperties } from 'n8n-workflow';

export class MicrosoftSentinelOAuth2Api implements ICredentialType {
	name = 'microsoftSentinelOAuth2Api';

	extends = ['microsoftOAuth2Api'];

	icon: Icon = 'file:../nodes/Microsoft/Sentinel/MicrosoftSentinel.svg';

	displayName = 'Microsoft Sentinel OAuth2 API';

	documentationUrl = 'https://learn.microsoft.com/rest/api/securityinsights';

	httpRequestNode = {
		name: 'Microsoft Sentinel',
		docsUrl: 'https://learn.microsoft.com/rest/api/securityinsights',
		apiBaseUrlPlaceholder: 'https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/{workspace}/providers/Microsoft.SecurityInsights',
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '=https://login.microsoftonline.com/{{$credentials.tenantId || "common"}}/oauth2/v2.0/token',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: '=grant_type=client_credentials&client_id={{$credentials.clientId}}&client_secret={{encodeURIComponent($credentials.clientSecret)}}&scope=https://management.azure.com/.default',
		},
	};

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
			description: 'The ID or domain of the tenant this client credential belongs to',
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
			// type: 'string',
			default:
				'=openid offline_access {{ $self["grantType"] === "clientCredentials" ? "https://management.azure.com/.default" : "https://management.azure.com/user_impersonation" }}',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
