export type ContractEvent = string;
export type WebhookTopic  = string;

export interface WebhookMapping {
  event: ContractEvent;
  topic: WebhookTopic;
  version: string;
  compatible: boolean;
}

export const eventWebhookMappings: WebhookMapping[] = [
  { event: "OutageRegistered",       topic: "outage.created",    version: "v1", compatible: true },
  { event: "SlaCalculated",          topic: "sla.calculated",    version: "v1", compatible: true },
  { event: "ConfigUpdated",          topic: "config.changed",    version: "v1", compatible: true },
  { event: "GovernanceActionEmitted",topic: "governance.action", version: "v1", compatible: true },
  { event: "PayoutInitiated",        topic: "payment.initiated", version: "v1", compatible: true },
];

export function validateMapping(event: ContractEvent): WebhookMapping | undefined {
  return eventWebhookMappings.find((m) => m.event === event);
}

export function incompatibleMappings(): WebhookMapping[] {
  return eventWebhookMappings.filter((m) => !m.compatible);
}
