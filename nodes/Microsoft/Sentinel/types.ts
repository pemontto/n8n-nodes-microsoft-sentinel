/**
 * TypeScript type definitions for Microsoft Sentinel node
 */

/**
 * Represents an Azure workspace resource returned from Azure Resource Graph API
 */
export interface AzureWorkspaceResource {
	/** The workspace name */
	name: string;
	/** The subscription name for display */
	subscriptionName: string;
	/** The resource group name */
	resourceGroup: string;
	/** The full resource path (subscriptionId/resourceGroup/workspaceName) */
	path: string;
	/** The subscription ID (GUID) */
	subscriptionId: string;
}

/**
 * Represents a column definition in a KQL query result
 */
export interface KQLColumn {
	/** The name of the column */
	ColumnName: string;
	/** The data type of the column (optional) */
	DataType?: string;
	/** The column type (optional) */
	ColumnType?: string;
}

/**
 * Filter options for incident queries
 */
export interface IncidentFilters {
	/** Filter incidents created after this date/time */
	createdAfter?: string;
	/** Filter incidents modified after this date/time */
	modifiedAfter?: string;
	/** Filter by specific incident ID */
	incidentId?: string;
	/** Filter by incident title (case-insensitive partial match) */
	title?: string;
	/** Filter by severity level(s) */
	severity?: string[] | string;
	/** Filter by incident status(es) */
	status?: string[] | string;
	/** Custom OData filter string */
	filter?: string;
}
