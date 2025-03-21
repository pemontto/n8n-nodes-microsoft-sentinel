# n8n-nodes-microsoft-sentinel

This is an n8n community node. It lets you interact with Microsoft Sentinel workspaces and resources.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Instance
    - Get instances: retreives a list of Sentinel workspaces available to your account
- Alert Rule
    - Create or Update: creates a new alert rule if it does not exist, or updates an existing alert rule
    - Delete: deletes an alert rule
    - Get: retrieves an alert rule
    - Get Many: retrieves multiple alert rules
    - Get Template: retrieves a template for creating an alert rule
    - Get Many Templates: retrieves multiple templates for creating alert rules
- Automation Rule
    - Create or Update: creates a new automation rule if it does not exist, or updates an existing automation rule
    - Delete: deletes an automation rule
    - Get: retrieves an automation rule
    - Get Many: retrieves multiple automation rules
- Incident
    - Create or Update: creates a new incident if it does not exist, or updates an existing incident
    - Delete: deletes an incident
    - Get: retrieves an incident
    - Get Many: retrieves multiple incidents
    - Get Alerts: retrieves alerts associated with an incident
    - Get Entities: retrieves entities associated with an incident
- Query
    - Run Query: runs a Kusto (KQL) query against a Sentinel workspace

## Compatibility

Tested with n8n v1.50.2

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
