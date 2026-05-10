// libs/shared/domain/src/lib/lead.model.ts

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  assignedTo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum LeadStatus {
  New = 'new',
  Contacted = 'contacted',
  Qualified = 'qualified',
  Proposal = 'proposal',
  Won = 'won',
  Lost = 'lost',
}

export interface CreateLeadDto {
  name: string;
  email: string;
  phone?: string;
  assignedTo: string;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  status?: LeadStatus;
}
