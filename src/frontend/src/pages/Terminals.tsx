import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTerminals, createTerminal, deleteTerminal, startTerminal, stopTerminal } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Terminal, Plus, Play, Square, Trash2 } from 'lucide-react';
import type { Terminal as TerminalType } from '../types';

export function Terminals() {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: terminals, isLoading } = useQuery({
    queryKey: ['terminals'],
    queryFn: getTerminals,
  });

  const createMutation = useMutation({
    mutationFn: () => createTerminal(newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      setNewName('');
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: startTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });

  const canCreate = hasPermission('terminals', 'create');
  const canExecute = hasPermission('terminals', 'execute');
  const canDelete = hasPermission('terminals', 'delete');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Terminals</h1>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-terminal-green hover:bg-terminal-green/80 text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            New Terminal
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create New Terminal
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="flex gap-4"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Terminal name..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
            />
            <button
              type="submit"
              disabled={!newName || createMutation.isPending}
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
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-400">Loading terminals...</div>
      ) : terminals?.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <Terminal size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No terminals yet.</p>
          {canCreate && (
            <p className="text-gray-500 text-sm mt-2">
              Create your first terminal to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {terminals?.map((terminal: TerminalType) => (
            <div
              key={terminal.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4"
            >
              <div
                className={`p-3 rounded-lg ${
                  terminal.status === 'RUNNING'
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                <Terminal size={24} />
              </div>

              <div className="flex-1">
                <Link
                  to={`/terminals/${terminal.id}`}
                  className="text-lg font-medium text-white hover:text-terminal-blue"
                >
                  {terminal.name}
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span
                    className={
                      terminal.status === 'RUNNING'
                        ? 'text-terminal-green'
                        : 'text-gray-500'
                    }
                  >
                    {terminal.status}
                  </span>
                  <span>{terminal.workingDir}</span>
                  <span>{terminal.commandCount} commands</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canExecute && terminal.status === 'STOPPED' && (
                  <button
                    onClick={() => startMutation.mutate(terminal.id)}
                    className="p-2 text-terminal-green hover:bg-gray-700 rounded-lg"
                    title="Start"
                  >
                    <Play size={20} />
                  </button>
                )}
                {canExecute && terminal.status === 'RUNNING' && (
                  <button
                    onClick={() => stopMutation.mutate(terminal.id)}
                    className="p-2 text-terminal-yellow hover:bg-gray-700 rounded-lg"
                    title="Stop"
                  >
                    <Square size={20} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteMutation.mutate(terminal.id)}
                    className="p-2 text-terminal-red hover:bg-gray-700 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
