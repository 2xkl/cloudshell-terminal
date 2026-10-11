import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    localStorage.clear();
  });

  describe('setAuth', () => {
    it('should set token and user', () => {
      const token = 'test-token';
      const user = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin',
        permissions: [{ resource: 'users', action: 'read' }],
      };

      useAuthStore.getState().setAuth(token, user);

      expect(useAuthStore.getState().token).toBe(token);
      expect(useAuthStore.getState().user).toEqual(user);
      expect(localStorage.getItem('token')).toBe(token);
    });
  });

  describe('logout', () => {
    it('should clear token and user', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' },
      });
      localStorage.setItem('token', 'test-token');

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: 'admin',
          permissions: [
            { resource: 'users', action: 'read' },
            { resource: 'terminals', action: 'create' },
          ],
        },
      });

      expect(useAuthStore.getState().hasPermission('users', 'read')).toBe(true);
      expect(useAuthStore.getState().hasPermission('terminals', 'create')).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: 'viewer',
          permissions: [{ resource: 'terminals', action: 'read' }],
        },
      });

      expect(useAuthStore.getState().hasPermission('users', 'create')).toBe(false);
      expect(useAuthStore.getState().hasPermission('terminals', 'delete')).toBe(false);
    });

    it('should return false when user has no permissions', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: 'viewer',
        },
      });

      expect(useAuthStore.getState().hasPermission('users', 'read')).toBe(false);
    });
  });
});
