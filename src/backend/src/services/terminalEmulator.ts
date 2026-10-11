interface FileSystem {
  [path: string]: {
    type: 'file' | 'directory';
    content?: string;
    children?: string[];
  };
}

interface TerminalState {
  workingDir: string;
  environment: Record<string, string>;
  fileSystem: FileSystem;
  user: string;
}

interface CommandResult {
  output: string;
  exitCode: number;
  newState?: Partial<TerminalState>;
}

const DEFAULT_FILE_SYSTEM: FileSystem = {
  '/': { type: 'directory', children: ['home', 'etc', 'var', 'tmp'] },
  '/home': { type: 'directory', children: ['user'] },
  '/home/user': { type: 'directory', children: ['.bashrc', 'documents'] },
  '/home/user/.bashrc': { type: 'file', content: '# .bashrc\nexport PATH=/usr/bin:/bin\nexport HOME=/home/user' },
  '/home/user/documents': { type: 'directory', children: ['readme.txt'] },
  '/home/user/documents/readme.txt': { type: 'file', content: 'Welcome to CloudShell!\n\nType "help" to see available commands.' },
  '/etc': { type: 'directory', children: ['passwd', 'hosts'] },
  '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash' },
  '/etc/hosts': { type: 'file', content: '127.0.0.1 localhost\n::1 localhost' },
  '/var': { type: 'directory', children: ['log'] },
  '/var/log': { type: 'directory', children: ['system.log'] },
  '/var/log/system.log': { type: 'file', content: '[INFO] System started\n[INFO] Terminal emulator initialized' },
  '/tmp': { type: 'directory', children: [] },
};

const DEFAULT_ENVIRONMENT: Record<string, string> = {
  PATH: '/usr/bin:/bin',
  HOME: '/home/user',
  USER: 'user',
  SHELL: '/bin/bash',
  TERM: 'xterm-256color',
  LANG: 'en_US.UTF-8',
};

export function getDefaultState(): TerminalState {
  return {
    workingDir: '/home/user',
    environment: { ...DEFAULT_ENVIRONMENT },
    fileSystem: JSON.parse(JSON.stringify(DEFAULT_FILE_SYSTEM)),
    user: 'user',
  };
}

export function executeCommand(
  command: string,
  state: TerminalState
): CommandResult {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const commands: Record<string, (args: string[], state: TerminalState) => CommandResult> = {
    help: cmdHelp,
    ls: cmdLs,
    pwd: cmdPwd,
    cd: cmdCd,
    cat: cmdCat,
    echo: cmdEcho,
    env: cmdEnv,
    export: cmdExport,
    whoami: cmdWhoami,
    date: cmdDate,
    mkdir: cmdMkdir,
    touch: cmdTouch,
    rm: cmdRm,
    clear: cmdClear,
    history: cmdHistory,
  };

  if (!cmd) {
    return { output: '', exitCode: 0 };
  }

  const handler = commands[cmd];
  if (!handler) {
    return {
      output: `bash: ${cmd}: command not found`,
      exitCode: 127,
    };
  }

  return handler(args, state);
}

function cmdHelp(): CommandResult {
  const helpText = `Available commands:
  help      - Show this help message
  ls        - List directory contents
  pwd       - Print working directory
  cd        - Change directory
  cat       - Display file contents
  echo      - Print text
  env       - Show environment variables
  export    - Set environment variable
  whoami    - Print current user
  date      - Print current date/time
  mkdir     - Create directory
  touch     - Create empty file
  rm        - Remove file or directory
  clear     - Clear terminal
  history   - Show command history`;

  return { output: helpText, exitCode: 0 };
}

function cmdLs(args: string[], state: TerminalState): CommandResult {
  const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
  const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');

  const pathArg = args.find(a => !a.startsWith('-'));
  const targetPath = pathArg
    ? resolvePath(pathArg, state.workingDir)
    : state.workingDir;

  const entry = state.fileSystem[targetPath];

  if (!entry) {
    return { output: `ls: cannot access '${pathArg || targetPath}': No such file or directory`, exitCode: 2 };
  }

  if (entry.type === 'file') {
    return { output: pathArg || targetPath.split('/').pop() || '', exitCode: 0 };
  }

  let children = entry.children || [];
  if (!showHidden) {
    children = children.filter(c => !c.startsWith('.'));
  }

  if (longFormat) {
    const lines = children.map(child => {
      const childPath = targetPath === '/' ? `/${child}` : `${targetPath}/${child}`;
      const childEntry = state.fileSystem[childPath];
      const type = childEntry?.type === 'directory' ? 'd' : '-';
      const perms = childEntry?.type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--';
      return `${type}${perms} 1 user user    0 Oct 11 12:00 ${child}`;
    });
    return { output: lines.join('\n'), exitCode: 0 };
  }

  return { output: children.join('  '), exitCode: 0 };
}

function cmdPwd(args: string[], state: TerminalState): CommandResult {
  return { output: state.workingDir, exitCode: 0 };
}

function cmdCd(args: string[], state: TerminalState): CommandResult {
  const target = args[0] || state.environment.HOME || '/home/user';

  let newPath: string;
  if (target === '-') {
    newPath = state.environment.OLDPWD || state.workingDir;
  } else if (target === '~') {
    newPath = state.environment.HOME || '/home/user';
  } else {
    newPath = resolvePath(target, state.workingDir);
  }

  const entry = state.fileSystem[newPath];

  if (!entry) {
    return { output: `bash: cd: ${target}: No such file or directory`, exitCode: 1 };
  }

  if (entry.type !== 'directory') {
    return { output: `bash: cd: ${target}: Not a directory`, exitCode: 1 };
  }

  return {
    output: '',
    exitCode: 0,
    newState: {
      workingDir: newPath,
      environment: {
        ...state.environment,
        OLDPWD: state.workingDir,
        PWD: newPath,
      },
    },
  };
}

function cmdCat(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return { output: 'cat: missing file operand', exitCode: 1 };
  }

  const outputs: string[] = [];

  for (const arg of args) {
    const path = resolvePath(arg, state.workingDir);
    const entry = state.fileSystem[path];

    if (!entry) {
      return { output: `cat: ${arg}: No such file or directory`, exitCode: 1 };
    }

    if (entry.type === 'directory') {
      return { output: `cat: ${arg}: Is a directory`, exitCode: 1 };
    }

    outputs.push(entry.content || '');
  }

  return { output: outputs.join('\n'), exitCode: 0 };
}

function cmdEcho(args: string[], state: TerminalState): CommandResult {
  let output = args.join(' ');

  // Simple variable expansion
  output = output.replace(/\$(\w+)/g, (_, name) => state.environment[name] || '');
  output = output.replace(/\$\{(\w+)\}/g, (_, name) => state.environment[name] || '');

  return { output, exitCode: 0 };
}

function cmdEnv(args: string[], state: TerminalState): CommandResult {
  const lines = Object.entries(state.environment)
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  return { output: lines.join('\n'), exitCode: 0 };
}

function cmdExport(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return cmdEnv(args, state);
  }

  const newEnv = { ...state.environment };

  for (const arg of args) {
    const match = arg.match(/^(\w+)=(.*)$/);
    if (match) {
      newEnv[match[1]] = match[2];
    }
  }

  return {
    output: '',
    exitCode: 0,
    newState: { environment: newEnv },
  };
}

function cmdWhoami(args: string[], state: TerminalState): CommandResult {
  return { output: state.user, exitCode: 0 };
}

function cmdDate(): CommandResult {
  return { output: new Date().toString(), exitCode: 0 };
}

function cmdMkdir(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return { output: 'mkdir: missing operand', exitCode: 1 };
  }

  const newFs = { ...state.fileSystem };

  for (const arg of args.filter(a => !a.startsWith('-'))) {
    const path = resolvePath(arg, state.workingDir);

    if (newFs[path]) {
      return { output: `mkdir: cannot create directory '${arg}': File exists`, exitCode: 1 };
    }

    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = newFs[parentPath];

    if (!parent || parent.type !== 'directory') {
      return { output: `mkdir: cannot create directory '${arg}': No such file or directory`, exitCode: 1 };
    }

    const name = path.split('/').pop()!;
    newFs[path] = { type: 'directory', children: [] };
    newFs[parentPath] = {
      ...parent,
      children: [...(parent.children || []), name],
    };
  }

  return {
    output: '',
    exitCode: 0,
    newState: { fileSystem: newFs },
  };
}

function cmdTouch(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return { output: 'touch: missing file operand', exitCode: 1 };
  }

  const newFs = { ...state.fileSystem };

  for (const arg of args) {
    const path = resolvePath(arg, state.workingDir);

    if (newFs[path]) {
      continue; // File exists, just update timestamp (we don't track timestamps)
    }

    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = newFs[parentPath];

    if (!parent || parent.type !== 'directory') {
      return { output: `touch: cannot touch '${arg}': No such file or directory`, exitCode: 1 };
    }

    const name = path.split('/').pop()!;
    newFs[path] = { type: 'file', content: '' };
    newFs[parentPath] = {
      ...parent,
      children: [...(parent.children || []), name],
    };
  }

  return {
    output: '',
    exitCode: 0,
    newState: { fileSystem: newFs },
  };
}

function cmdRm(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return { output: 'rm: missing operand', exitCode: 1 };
  }

  const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
  const newFs = { ...state.fileSystem };

  for (const arg of args.filter(a => !a.startsWith('-'))) {
    const path = resolvePath(arg, state.workingDir);
    const entry = newFs[path];

    if (!entry) {
      return { output: `rm: cannot remove '${arg}': No such file or directory`, exitCode: 1 };
    }

    if (entry.type === 'directory' && !recursive) {
      return { output: `rm: cannot remove '${arg}': Is a directory`, exitCode: 1 };
    }

    // Remove from parent
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = newFs[parentPath];
    const name = path.split('/').pop()!;

    if (parent && parent.type === 'directory') {
      newFs[parentPath] = {
        ...parent,
        children: (parent.children || []).filter(c => c !== name),
      };
    }

    // Remove entry and children
    delete newFs[path];
    if (entry.type === 'directory') {
      Object.keys(newFs).forEach(key => {
        if (key.startsWith(path + '/')) {
          delete newFs[key];
        }
      });
    }
  }

  return {
    output: '',
    exitCode: 0,
    newState: { fileSystem: newFs },
  };
}

function cmdClear(): CommandResult {
  return { output: '\x1b[2J\x1b[H', exitCode: 0 };
}

function cmdHistory(): CommandResult {
  return { output: '(history is managed by the terminal)', exitCode: 0 };
}

function resolvePath(path: string, workingDir: string): string {
  if (path.startsWith('/')) {
    return normalizePath(path);
  }

  return normalizePath(`${workingDir}/${path}`);
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const result: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.') {
      result.push(part);
    }
  }

  return '/' + result.join('/');
}

export function getTerminalState(
  workingDir: string,
  environment: Record<string, string>,
  fileSystem: FileSystem
): TerminalState {
  return {
    workingDir,
    environment,
    fileSystem,
    user: environment.USER || 'user',
  };
}
