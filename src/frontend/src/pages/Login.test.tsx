import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, clearAuthState } from '../test/utils';
import { Login } from './Login';
import * as apiClient from '../api/client';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/client');

describe('Login Component', () => {
  beforeEach(() => {
    clearAuthState();
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render login form with title', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText('CloudShell Login')).toBeInTheDocument();
    expect(screen.getByText('Terminal Emulator System')).toBeInTheDocument();
  });

  it('should render email and password inputs', () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByDisplayValue('admin@cloudshell.local');
    const passwordInput = screen.getByDisplayValue('admin123');

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('should render sign in button', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render demo accounts info', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText('Demo accounts:')).toBeInTheDocument();
    expect(screen.getByText('admin@cloudshell.local / admin123')).toBeInTheDocument();
    expect(screen.getByText('operator@cloudshell.local / operator123')).toBeInTheDocument();
    expect(screen.getByText('viewer@cloudshell.local / viewer123')).toBeInTheDocument();
  });

  it('should have default values in inputs', () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByDisplayValue('admin@cloudshell.local') as HTMLInputElement;
    const passwordInput = screen.getByDisplayValue('admin123') as HTMLInputElement;

    expect(emailInput.value).toBe('admin@cloudshell.local');
    expect(passwordInput.value).toBe('admin123');
  });

  it('should update email input on change', () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByDisplayValue('admin@cloudshell.local') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

    expect(emailInput.value).toBe('test@test.com');
  });

  it('should update password input on change', () => {
    renderWithProviders(<Login />);

    const passwordInput = screen.getByDisplayValue('admin123') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(passwordInput.value).toBe('newpassword');
  });

  it('should call login when form is submitted', async () => {
    vi.mocked(apiClient.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith('admin@cloudshell.local', 'admin123');
    });
  });

  it('should display error message on login failure', async () => {
    vi.mocked(apiClient.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    vi.mocked(apiClient.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });
  });
});
