/**
 * Microsoft Sentinel Node - VersionedNodeType Wrapper
 *
 * This wrapper manages multiple node versions:
 * - Version 1: Original implementation with combined Create/Update (upsert)
 * - Version 2: Split Create/Update operations, Add/Remove Label operations
 * - Version 3: Clean implementation with Incident Comment as separate resource
 *
 * New workflows default to version 3 for a cleaner UI.
 * Existing workflows continue using their saved version.
 */

import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { MicrosoftSentinelV1V2 } from './v1v2/MicrosoftSentinelV1V2.node';
import { MicrosoftSentinelV3 } from './v3/MicrosoftSentinelV3.node';

export class MicrosoftSentinel extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Microsoft Sentinel',
			name: 'microsoftSentinel',
			icon: 'file:MicrosoftSentinel.svg',
			group: ['transform'],
			description: 'Consume the Sentinel API',
			defaultVersion: 3,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new MicrosoftSentinelV1V2(baseDescription),
			2: new MicrosoftSentinelV1V2(baseDescription),
			3: new MicrosoftSentinelV3(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
