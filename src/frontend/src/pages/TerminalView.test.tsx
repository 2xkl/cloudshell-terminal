import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, setAuthState, clearAuthState, mockAdminUser, mockViewerUser } from '../test/utils';
import { TerminalView } from './TerminalView';
import * as apiClient from '../api/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'terminal-1' }),
  };
});

vi.mock('../api/client');

const mockTerminal = {
  id: 'terminal-1',
  name: 'Test Terminal',
  status: 'RUNNING',
  workingDir: '/home/user',
  commands: [
    { command: 'ls', output: 'file1.txt  file2.txt', exitCode: 0 },
    { command: 'pwd', output: '/home/user', exitCode: 0 },
  ],
};

describe('TerminalView Component', () => {
  beforeEach(() => {
    clearAuthState();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(apiClient.getTerminal).mockReturnValue(new Promise(() => {}));

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    expect(screen.getByText('Loading terminal...')).toBeInTheDocument();
  });

  it('should show terminal not found when terminal is null', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(null as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Terminal not found')).toBeInTheDocument();
    });
  });

  it('should render terminal name and status', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Test Terminal')).toBeInTheDocument();
      expect(screen.getByText('RUNNING - /home/user')).toBeInTheDocument();
    });
  });

  it('should render welcome message', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Welcome to CloudShell/)
      ).toBeInTheDocument();
    });
  });

  it('should render command output', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText(/file1\.txt/)).toBeInTheDocument();
      expect(screen.getByText(/file2\.txt/)).toBeInTheDocument();
    });
  });

  it('should render Save Snapshot button for user with permission', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Save Snapshot')).toBeInTheDocument();
    });
  });

  it('should NOT render Save Snapshot button for viewer', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockViewerUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Test Terminal')).toBeInTheDocument();
    });

    expect(screen.queryByText('Save Snapshot')).not.toBeInTheDocument();
  });

  it('should render command input for user with execute permission', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });

  it('should NOT render command input for viewer', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockViewerUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Test Terminal')).toBeInTheDocument();
    });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should execute command on form submit', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);
    vi.mocked(apiClient.executeCommand).mockResolvedValueOnce({
      command: 'whoami',
      output: 'user',
      exitCode: 0,
    } as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'whoami' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(apiClient.executeCommand).toHaveBeenCalledWith('terminal-1', 'whoami');
    });
  });

  it('should navigate back when back button is clicked', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Test Terminal')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const backButton = buttons[0];
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/terminals');
  });

  it('should show snapshot form when Save Snapshot is clicked', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce(mockTerminal as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(screen.getByText('Save Snapshot')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Snapshot'));

    expect(screen.getByText('Create Snapshot')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Snapshot name...')).toBeInTheDocument();
  });

  it('should show message when terminal is stopped', async () => {
    vi.mocked(apiClient.getTerminal).mockResolvedValueOnce({
      ...mockTerminal,
      status: 'STOPPED',
    } as any);

    setAuthState(mockAdminUser);
    renderWithProviders(<TerminalView />);

    await waitFor(() => {
      expect(
        screen.getByText(/Terminal is stopped/)
      ).toBeInTheDocument();
    });
  });
});
