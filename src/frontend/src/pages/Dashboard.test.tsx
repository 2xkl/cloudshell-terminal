import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, setAuthState, clearAuthState, mockAdminUser } from '../test/utils';
import { Dashboard } from './Dashboard';
import * as apiClient from '../api/client';

vi.mock('../api/client');

describe('Dashboard Component', () => {
  beforeEach(() => {
    clearAuthState();
    vi.clearAllMocks();
    vi.mocked(apiClient.getTerminals).mockResolvedValue([]);
    vi.mocked(apiClient.getSnapshots).mockResolvedValue([]);
  });

  it('should render dashboard title', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render welcome message with user name', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Welcome, Admin User')).toBeInTheDocument();
  });

  it('should render stats cards', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Terminals')).toBeInTheDocument();
    expect(screen.getByText('Snapshots')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('should display user role in stats', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('current role')).toBeInTheDocument();
  });

  it('should render quick actions section', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create a new terminal')).toBeInTheDocument();
    expect(screen.getByText('Execute commands (ls, cd, cat, etc.)')).toBeInTheDocument();
  });

  it('should render available commands section', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Available Commands')).toBeInTheDocument();
    expect(
      screen.getByText('ls, cd, pwd, cat, echo, env, export, whoami, date, mkdir, touch, rm, help, clear')
    ).toBeInTheDocument();
  });

  it('should render description text', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    expect(
      screen.getByText(/CloudShell provides a safe environment/)
    ).toBeInTheDocument();
  });

  it('should display terminal count from API', async () => {
    vi.mocked(apiClient.getTerminals).mockResolvedValueOnce([
      { id: '1', name: 'Terminal 1', status: 'RUNNING' },
      { id: '2', name: 'Terminal 2', status: 'STOPPED' },
      { id: '3', name: 'Terminal 3', status: 'RUNNING' },
    ] as any);
    vi.mocked(apiClient.getSnapshots).mockResolvedValueOnce([]);

    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2 running')).toBeInTheDocument();
    });
  });

  it('should display snapshot count from API', async () => {
    vi.mocked(apiClient.getTerminals).mockResolvedValueOnce([]);
    vi.mocked(apiClient.getSnapshots).mockResolvedValueOnce([
      { id: '1', name: 'Snapshot 1' },
      { id: '2', name: 'Snapshot 2' },
    ] as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('total saved')).toBeInTheDocument();
    });
  });

  it('should handle zero terminals gracefully', async () => {
    vi.mocked(apiClient.getTerminals).mockResolvedValueOnce([]);
    vi.mocked(apiClient.getSnapshots).mockResolvedValueOnce([]);

    setAuthState(mockAdminUser);
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('0 running')).toBeInTheDocument();
    });
  });
});
