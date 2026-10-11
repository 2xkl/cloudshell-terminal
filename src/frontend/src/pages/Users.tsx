import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, getRoles, createUser, deleteUser } from '../api/client';
import { Users as UsersIcon, Plus, Trash2 } from 'lucide-react';
import type { Role } from '../types';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function Users() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roleId: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const createMutation = useMutation({
    mutationFn: () => createUser(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormData({ email: '', password: '', name: '', roleId: '' });
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-terminal-green hover:bg-terminal-green/80 text-black px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create New User
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select
                value={formData.roleId}
                onChange={(e) =>
                  setFormData({ ...formData, roleId: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
              >
                <option value="">Select role...</option>
                {roles?.map((role: Role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={
                  !formData.email ||
                  !formData.password ||
                  !formData.name ||
                  !formData.roleId ||
                  createMutation.isPending
                }
                className="bg-terminal-blue hover:bg-terminal-blue/80 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Created
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users?.map((user: UserData) => (
                <tr key={user.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-700">
                        <UsersIcon size={16} className="text-gray-400" />
                      </div>
                      <span className="text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-terminal-red/20 text-terminal-red'
                          : user.role === 'operator'
                          ? 'bg-terminal-yellow/20 text-terminal-yellow'
                          : 'bg-terminal-blue/20 text-terminal-blue'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMutation.mutate(user.id)}
                      className="p-2 text-terminal-red hover:bg-gray-700 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
