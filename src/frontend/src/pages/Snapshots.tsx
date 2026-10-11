import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSnapshots, restoreSnapshot, deleteSnapshot } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Camera, RotateCcw, Trash2 } from 'lucide-react';
import type { Snapshot } from '../types';

export function Snapshots() {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['snapshots'],
    queryFn: getSnapshots,
  });

  const restoreMutation = useMutation({
    mutationFn: restoreSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });

  const canRestore = hasPermission('snapshots', 'restore');
  const canDelete = hasPermission('snapshots', 'delete');

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Snapshots</h1>

      {isLoading ? (
        <div className="text-gray-400">Loading snapshots...</div>
      ) : snapshots?.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <Camera size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No snapshots yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Create a snapshot from a terminal to save its state.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {snapshots?.map((snapshot: Snapshot) => (
            <div
              key={snapshot.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4"
            >
              <div className="p-3 rounded-lg bg-terminal-blue/20 text-terminal-blue">
                <Camera size={24} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-white">
                  {snapshot.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Terminal: {snapshot.terminal.name}</span>
                  <span>
                    {new Date(snapshot.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canRestore && (
                  <button
                    onClick={() => restoreMutation.mutate(snapshot.id)}
                    disabled={restoreMutation.isPending}
                    className="flex items-center gap-2 px-3 py-2 text-terminal-green hover:bg-gray-700 rounded-lg"
                    title="Restore"
                  >
                    <RotateCcw size={18} />
                    <span className="text-sm">Restore</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteMutation.mutate(snapshot.id)}
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
