import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login, getMe } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('admin@cloudshell.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async (data) => {
      localStorage.setItem('token', data.token);
      const user = await getMe();
      setAuth(data.token, user);
      navigate('/');
    },
    onError: () => {
      setError('Invalid credentials');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">CloudShell Login</h1>
        <p className="text-gray-400 mb-6">Terminal Emulator System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-terminal-red/20 text-terminal-red p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-terminal-blue hover:bg-terminal-blue/80 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Demo accounts:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>admin@cloudshell.local / admin123</li>
            <li>operator@cloudshell.local / operator123</li>
            <li>viewer@cloudshell.local / viewer123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
