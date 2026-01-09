<img src="https://raw.githubusercontent.com/pemontto/n8n-nodes-microsoft-sentinel/main/nodes/Microsoft/Sentinel/MicrosoftSentinel.svg" width="120" alt="Microsoft Sentinel Logo" />

# n8n-nodes-microsoft-sentinel

This is an n8n community node. It lets you interact with Microsoft Sentinel workspaces and resources.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Example Workflow](#example-workflow)
[Operations](#operations)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Install via **Settings > Community Nodes** in n8n and search for `n8n-nodes-microsoft-sentinel`.

See the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/installation/) for more details.

## Example Workflow

This workflow will get all available Sentinel instances and retrieve all `Active` and `New` High severity incidents.
![alt text](images/workflow.png)
<details>
<summary>Node settings</summary>

![alt text](images/node-settings.png)
</details>
<details>
<summary>Workflow JSON</summary>

_Copy and paste the following workflow JSON into your n8n editor to recreate the workflow:_
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        -500,
        -40
      ],
      "id": "3e2bb6a5-abd3-4b5e-bb8a-9d1d10595d1c",
      "name": "When clicking ‘Test workflow’"
    },
    {
      "parameters": {
        "resource": "instance",
        "requestOptions": {}
      },
      "type": "n8n-nodes-microsoft-sentinel.microsoftSentinel",
      "typeVersion": 1,
      "position": [
        -280,
        -40
      ],
      "id": "449fe0b6-5e4f-43be-bfec-777bb8693cab",
      "name": "Get Sentinel Instances",
      "credentials": {
        "microsoftSentinelOAuth2Api": {
          "id": "1",
          "name": "Your Sentinel Creds"
        }
      }
    },
    {
      "parameters": {
        "sentinelInstance": "={{ $json.sentinelInstance }}",
        "options": {
          "orderBy": "properties/lastModifiedTimeUtc",
          "sort": "desc"
        },
        "filters": {
          "severity": [
            "High"
          ],
          "status": [
            "Active",
            "New"
          ]
        },
        "requestOptions": {}
      },
      "type": "n8n-nodes-microsoft-sentinel.microsoftSentinel",
      "typeVersion": 1,
      "position": [
        -60,
        -40
      ],
      "id": "63353297-1aa9-468f-8357-717aa0ac009b",
      "name": "Get All High Open Incidents",
      "credentials": {
        "microsoftSentinelOAuth2Api": {
          "id": "1",
          "name": "Your Sentinel Creds"
        }
      }
    }
  ],
  "connections": {
    "When clicking ‘Test workflow’": {
      "main": [
        [
          {
            "node": "Get Sentinel Instances",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Sentinel Instances": {
      "main": [
        [
          {
            "node": "Get All High Open Incidents",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```
</details>

## **Operations**

**Instance:**
- **Get instances:** Retrieves a list of Sentinel workspaces available to your account

**Alert Rule:**
- **Create or Update:** Creates a new alert rule if it does not exist, or updates an existing alert rule
- **Delete:** Deletes an alert rule
- **Get:** Retrieves an alert rule
- **Get Many:** Retrieves multiple alert rules
- **Get Template:** Retrieves a template for creating an alert rule
- **Get Many Templates:** Retrieves multiple templates for creating alert rules

**Automation Rule:**
- **Create or Update:** Creates a new automation rule if it does not exist, or updates an existing automation rule
- **Delete:** Deletes an automation rule
- **Get:** Retrieves an automation rule
- **Get Many:** Retrieves multiple automation rules

**Incident:**
- **Create** _(v2+)_: Creates a new incident
- **Update** _(v2+)_: Updates an existing incident
- **Create or Update** _(v1)_: Creates a new incident if it does not exist, or updates an existing incident
- **Delete:** Deletes an incident
- **Get:** Retrieves an incident (with optional Include Alerts/Comments/Entities)
- **Get Many:** Retrieves multiple incidents (with optional Include Alerts/Comments/Entities)
- **Get Alerts:** Retrieves alerts associated with an incident
- **Get Entities:** Retrieves entities associated with an incident
- **Add Label** _(v2+)_: Adds labels to an incident
- **Remove Label** _(v2+)_: Removes labels from an incident
- **Create or Update Comment** _(v1/v2)_: Creates or updates a comment (use Incident Comment resource in v3)
- **Delete Comment** _(v1/v2)_: Deletes a comment (use Incident Comment resource in v3)
- **Get Comment** _(v1/v2)_: Retrieves a comment (use Incident Comment resource in v3)
- **Get Many Comments** _(v1/v2)_: Retrieves comments (use Incident Comment resource in v3)

**Incident Comment** _(v3+)_:
- **Create:** Creates a new comment on an incident
- **Update:** Updates an existing comment
- **Delete:** Deletes a comment
- **Get:** Retrieves a comment
- **Get Many:** Retrieves all comments for an incident

**Query:**
- **Run Query:** Runs a Kusto (KQL) query against a Sentinel workspace

## Compatibility

Tested with n8n v1.50.2

## Version History

### v3 (Current)
- **New "Incident Comment" resource** - Comment operations are now available as a separate resource for cleaner organization
- **Include related data options** - Incident Get and Get Many now support optional "Include Alerts", "Include Comments", and "Include Entities" toggles to fetch related data in parallel
- Comment operations under Incident resource are hidden in v3 (still available in v1/v2 for backward compatibility)

### v2
- Split "Create or Update" incident operation into separate "Create" and "Update" operations
- Added "Add Label" and "Remove Label" operations for incidents
- Enhanced incident update with classification and owner fields

### v1
- Initial release with Instance, Alert Rule, Automation Rule, Incident, and Query resources

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/pemontto/n8n-nodes-microsoft-sentinel)
