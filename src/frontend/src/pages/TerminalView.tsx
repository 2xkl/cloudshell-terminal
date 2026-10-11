import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTerminal, executeCommand, createSnapshot } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Camera, Send } from 'lucide-react';
import type { TerminalCommand } from '../types';

export function TerminalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  const { data: terminal, isLoading } = useQuery({
    queryKey: ['terminal', id],
    queryFn: () => getTerminal(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (terminal?.commands) {
      setHistory(terminal.commands);
    }
  }, [terminal]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const executeMutation = useMutation({
    mutationFn: (cmd: string) => executeCommand(id!, cmd),
    onSuccess: (result) => {
      setHistory((prev) => [
        ...prev,
        {
          command: result.command,
          output: result.output,
          exitCode: result.exitCode,
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['terminal', id] });
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: () => createSnapshot(snapshotName, id!),
    onSuccess: () => {
      setShowSnapshot(false);
      setSnapshotName('');
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    executeMutation.mutate(command);
    setCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commands = history.map((h) => h.command);
      if (historyIndex < commands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commands[commands.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commands = history.map((h) => h.command);
        setCommand(commands[commands.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const canExecute = hasPermission('terminals', 'execute');
  const canSnapshot = hasPermission('snapshots', 'create');

  if (isLoading) {
    return <div className="text-gray-400">Loading terminal...</div>;
  }

  if (!terminal) {
    return <div className="text-gray-400">Terminal not found</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/terminals')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{terminal.name}</h1>
            <p className="text-sm text-gray-400">
              {terminal.status} - {terminal.workingDir}
            </p>
          </div>
        </div>
        {canSnapshot && (
          <button
            onClick={() => setShowSnapshot(true)}
            className="flex items-center gap-2 bg-terminal-blue hover:bg-terminal-blue/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Camera size={20} />
            Save Snapshot
          </button>
        )}
      </div>

      {showSnapshot && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create Snapshot
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              snapshotMutation.mutate();
            }}
            className="flex gap-4"
          >
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-terminal-blue"
            />
            <button
              type="submit"
              disabled={!snapshotName || snapshotMutation.isPending}
              className="bg-terminal-green hover:bg-terminal-green/80 text-black px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowSnapshot(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div
        ref={outputRef}
        className="flex-1 bg-terminal-bg rounded-xl p-4 font-mono text-sm overflow-auto border border-gray-700"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-terminal-green mb-2">
          Welcome to CloudShell. Type 'help' for available commands.
        </div>

        {history.map((cmd, i) => (
          <div key={i} className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-terminal-green">user@cloudshell</span>
              <span className="text-terminal-blue">{terminal.workingDir}</span>
              <span className="text-white">$</span>
              <span className="text-terminal-text">{cmd.command}</span>
            </div>
            {cmd.output && (
              <div
                className={`terminal-output ${
                  cmd.exitCode !== 0 ? 'text-terminal-red' : 'text-terminal-text'
                }`}
              >
                {cmd.output}
              </div>
            )}
          </div>
        ))}

        {canExecute && terminal.status === 'RUNNING' && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-terminal-green">user@cloudshell</span>
            <span className="text-terminal-blue">{terminal.workingDir}</span>
            <span className="text-white">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={executeMutation.isPending}
              className="flex-1 bg-transparent text-terminal-text terminal-input"
              autoFocus
            />
            <button type="submit" className="text-terminal-blue p-1">
              <Send size={16} />
            </button>
          </form>
        )}

        {terminal.status !== 'RUNNING' && (
          <div className="text-terminal-yellow mt-4">
            Terminal is {terminal.status.toLowerCase()}. Start the terminal to execute commands.
          </div>
        )}
      </div>
    </div>
  );
}
