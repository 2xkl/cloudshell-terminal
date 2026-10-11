import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  withRouter?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', withRouter = true, ...options }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {withRouter ? (
          <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

export function setAuthState(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: { resource: string; action: string }[];
}) {
  useAuthStore.setState({
    token: 'test-token',
    user,
  });
}

export function clearAuthState() {
  useAuthStore.setState({
    token: null,
    user: null,
  });
}

export const mockAdminUser = {
  id: '1',
  email: 'admin@cloudshell.local',
  name: 'Admin User',
  role: 'admin',
  permissions: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'delete' },
    { resource: 'terminals', action: 'read' },
    { resource: 'terminals', action: 'create' },
    { resource: 'terminals', action: 'execute' },
    { resource: 'snapshots', action: 'read' },
    { resource: 'snapshots', action: 'create' },
    { resource: 'snapshots', action: 'restore' },
  ],
};

export const mockOperatorUser = {
  id: '2',
  email: 'operator@cloudshell.local',
  name: 'Operator User',
  role: 'operator',
  permissions: [
    { resource: 'terminals', action: 'read' },
    { resource: 'terminals', action: 'create' },
    { resource: 'terminals', action: 'execute' },
    { resource: 'snapshots', action: 'read' },
    { resource: 'snapshots', action: 'create' },
  ],
};

export const mockViewerUser = {
  id: '3',
  email: 'viewer@cloudshell.local',
  name: 'Viewer User',
  role: 'viewer',
  permissions: [
    { resource: 'terminals', action: 'read' },
    { resource: 'snapshots', action: 'read' },
  ],
};
