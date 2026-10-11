export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: Permission[];
}

export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: {
    id: string;
    name: string;
    resource: string;
    action: string;
  }[];
}

export interface Terminal {
  id: string;
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'SUSPENDED';
  workingDir: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  commandCount?: number;
  snapshotCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TerminalCommand {
  command: string;
  output: string;
  exitCode: number;
  executedAt?: string;
}

export interface Snapshot {
  id: string;
  name: string;
  terminal: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CommandResult {
  command: string;
  output: string;
  exitCode: number;
  workingDir: string;
}
