import { WorkspaceModule } from '@prisma/client';

// designation -> module mapping used at signup time
export const DESIGNATION_MODULE_MAP: Record<string, WorkspaceModule> = {
  'Sales & CRM': WorkspaceModule.CRM,
  'Human Resources': WorkspaceModule.HR,
  'Finance & Accounts': WorkspaceModule.FINANCE,
  'Inventory & Operations': WorkspaceModule.INVENTORY,
};

export const AVAILABLE_DESIGNATIONS = Object.keys(DESIGNATION_MODULE_MAP);

export function resolveModulesForDesignations(designations: string[]): WorkspaceModule[] {
  const modules = new Set<WorkspaceModule>();
  for (const designation of designations) {
    const mod = DESIGNATION_MODULE_MAP[designation];
    if (mod) modules.add(mod);
  }
  return Array.from(modules);
}

// google oauth signup has no designation step, default to full access
export const ALL_MODULES: WorkspaceModule[] = Object.values(WorkspaceModule);