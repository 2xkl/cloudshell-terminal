import { useQuery } from '@tanstack/react-query';
import { getTerminals, getSnapshots } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { Terminal, Camera, Shield } from 'lucide-react';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: terminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: getTerminals,
  });

  const { data: snapshots } = useQuery({
    queryKey: ['snapshots'],
    queryFn: getSnapshots,
  });

  const runningTerminals = terminals?.filter(
    (t: { status: string }) => t.status === 'RUNNING'
  ).length || 0;

  const stats = [
    {
      label: 'Terminals',
      value: terminals?.length || 0,
      sub: `${runningTerminals} running`,
      icon: Terminal,
      color: 'text-terminal-green',
    },
    {
      label: 'Snapshots',
      value: snapshots?.length || 0,
      sub: 'total saved',
      icon: Camera,
      color: 'text-terminal-blue',
    },
    {
      label: 'Role',
      value: user?.role || 'unknown',
      sub: 'current role',
      icon: Shield,
      color: 'text-terminal-yellow',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gray-700 ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Welcome, {user?.name}
        </h2>
        <p className="text-gray-400 mb-4">
          CloudShell provides a safe environment for practicing
          Linux commands. Create terminals, execute commands, and save snapshots
          of your work.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-2">Quick Actions</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>Create a new terminal</li>
              <li>Execute commands (ls, cd, cat, etc.)</li>
              <li>Save terminal state as snapshot</li>
              <li>Restore from previous snapshot</li>
            </ul>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-2">Available Commands</h3>
            <p className="text-sm text-gray-400 font-mono">
              ls, cd, pwd, cat, echo, env, export, whoami, date, mkdir, touch, rm, help, clear
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
