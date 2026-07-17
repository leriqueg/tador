/** Route paths for Hogar vs PRO namespaces (Sprint 07 US0/US5). */
export type AppNamespace = 'hogar' | 'pro';

export interface NamespacePaths {
  dashboard: string;
  entries: string;
  entriesNew: string;
  entriesManual: string;
  finances: string;
  financesPyg: string;
  financesBalance: string;
  financesApuntes: string;
  accounts: string;
  entities: string;
  settings: string;
  editApunte: (id: string) => string;
}

export function namespacePaths(namespace: AppNamespace): NamespacePaths {
  const base = `/${namespace}`;
  return {
    dashboard: `${base}/dashboard`,
    entries: `${base}/entries`,
    entriesNew: `${base}/entries/new`,
    entriesManual: `${base}/entries/manual`,
    finances: `${base}/finances`,
    financesPyg: `${base}/finances/pyg`,
    financesBalance: `${base}/finances/balance`,
    financesApuntes: `${base}/finances/apuntes`,
    accounts: `${base}/accounts`,
    entities: `${base}/entities`,
    settings: `${base}/settings`,
    editApunte: (id: string) => `${base}/entries/new?edit=${id}`,
  };
}
