import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, setAuthState, clearAuthState, mockAdminUser, mockOperatorUser, mockViewerUser } from '../test/utils';
import { Layout } from './Layout';
import { useAuthStore } from '../stores/authStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout Component', () => {
  beforeEach(() => {
    clearAuthState();
    mockNavigate.mockClear();
  });

  it('should render CloudShell title', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    expect(screen.getByText('CloudShell')).toBeInTheDocument();
    expect(screen.getByText('Terminal Emulator')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /terminals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /snapshots/i })).toBeInTheDocument();
  });

  it('should display user name and role', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should show Users link for admin role', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
  });

  it('should NOT show Users link for operator role', () => {
    setAuthState(mockOperatorUser);
    renderWithProviders(<Layout />);

    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
  });

  it('should NOT show Users link for viewer role', () => {
    setAuthState(mockViewerUser);
    renderWithProviders(<Layout />);

    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
  });

  it('should render logout button', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should call logout and navigate on logout click', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button');
    fireEvent.click(logoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should clear auth state on logout', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />);

    const logoutButton = screen.getByRole('button');
    fireEvent.click(logoutButton);

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should highlight active navigation link', () => {
    setAuthState(mockAdminUser);
    renderWithProviders(<Layout />, { initialRoute: '/terminals' });

    const terminalsLink = screen.getByRole('link', { name: /terminals/i });
    expect(terminalsLink).toHaveClass('bg-terminal-blue/20');
  });

  it('should display operator user correctly', () => {
    setAuthState(mockOperatorUser);
    renderWithProviders(<Layout />);

    expect(screen.getByText('Operator User')).toBeInTheDocument();
    expect(screen.getByText('operator')).toBeInTheDocument();
  });

  it('should display viewer user correctly', () => {
    setAuthState(mockViewerUser);
    renderWithProviders(<Layout />);

    expect(screen.getByText('Viewer User')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });
});
