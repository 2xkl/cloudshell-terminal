import { describe, it, expect } from 'vitest';
import { executeCommand, getDefaultState, getTerminalState } from '../services/terminalEmulator.js';

describe('Terminal Emulator', () => {
  describe('getDefaultState', () => {
    it('should return default state with /home/user as working directory', () => {
      const state = getDefaultState();
      expect(state.workingDir).toBe('/home/user');
      expect(state.user).toBe('user');
      expect(state.environment.HOME).toBe('/home/user');
    });

    it('should have default file system structure', () => {
      const state = getDefaultState();
      expect(state.fileSystem['/']).toBeDefined();
      expect(state.fileSystem['/home']).toBeDefined();
      expect(state.fileSystem['/home/user']).toBeDefined();
    });
  });

  describe('executeCommand', () => {
    describe('help command', () => {
      it('should return available commands', () => {
        const state = getDefaultState();
        const result = executeCommand('help', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('ls');
        expect(result.output).toContain('cd');
        expect(result.output).toContain('cat');
      });
    });

    describe('pwd command', () => {
      it('should return current working directory', () => {
        const state = getDefaultState();
        const result = executeCommand('pwd', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toBe('/home/user');
      });
    });

    describe('ls command', () => {
      it('should list directory contents', () => {
        const state = getDefaultState();
        const result = executeCommand('ls', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('documents');
      });

      it('should show hidden files with -a flag', () => {
        const state = getDefaultState();
        const result = executeCommand('ls -a', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('.bashrc');
      });

      it('should show long format with -l flag', () => {
        const state = getDefaultState();
        const result = executeCommand('ls -l', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('drwx');
      });

      it('should return error for non-existent directory', () => {
        const state = getDefaultState();
        const result = executeCommand('ls /nonexistent', state);
        expect(result.exitCode).toBe(2);
        expect(result.output).toContain('No such file or directory');
      });
    });

    describe('cd command', () => {
      it('should change to directory', () => {
        const state = getDefaultState();
        const result = executeCommand('cd documents', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.workingDir).toBe('/home/user/documents');
      });

      it('should change to home with cd alone', () => {
        const state = getTerminalState('/tmp', { HOME: '/home/user' }, getDefaultState().fileSystem);
        const result = executeCommand('cd', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.workingDir).toBe('/home/user');
      });

      it('should handle .. properly', () => {
        const state = getTerminalState('/home/user/documents', getDefaultState().environment, getDefaultState().fileSystem);
        const result = executeCommand('cd ..', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.workingDir).toBe('/home/user');
      });

      it('should return error for non-existent directory', () => {
        const state = getDefaultState();
        const result = executeCommand('cd nonexistent', state);
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('No such file or directory');
      });
    });

    describe('cat command', () => {
      it('should display file contents', () => {
        const state = getTerminalState('/home/user/documents', getDefaultState().environment, getDefaultState().fileSystem);
        const result = executeCommand('cat readme.txt', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('Welcome to CloudShell');
      });

      it('should return error for directory', () => {
        const state = getDefaultState();
        const result = executeCommand('cat documents', state);
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('Is a directory');
      });

      it('should return error for non-existent file', () => {
        const state = getDefaultState();
        const result = executeCommand('cat nonexistent.txt', state);
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('No such file or directory');
      });
    });

    describe('echo command', () => {
      it('should print text', () => {
        const state = getDefaultState();
        const result = executeCommand('echo hello world', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toBe('hello world');
      });

      it('should expand variables', () => {
        const state = getDefaultState();
        const result = executeCommand('echo $HOME', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toBe('/home/user');
      });
    });

    describe('whoami command', () => {
      it('should return current user', () => {
        const state = getDefaultState();
        const result = executeCommand('whoami', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toBe('user');
      });
    });

    describe('env command', () => {
      it('should show environment variables', () => {
        const state = getDefaultState();
        const result = executeCommand('env', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('HOME=/home/user');
        expect(result.output).toContain('USER=user');
      });
    });

    describe('export command', () => {
      it('should set environment variable', () => {
        const state = getDefaultState();
        const result = executeCommand('export MYVAR=test', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.environment?.MYVAR).toBe('test');
      });
    });

    describe('mkdir command', () => {
      it('should create directory', () => {
        const state = getDefaultState();
        const result = executeCommand('mkdir testdir', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.fileSystem?.['/home/user/testdir']).toBeDefined();
      });

      it('should return error if directory exists', () => {
        const state = getDefaultState();
        const result = executeCommand('mkdir documents', state);
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('File exists');
      });
    });

    describe('touch command', () => {
      it('should create empty file', () => {
        const state = getDefaultState();
        const result = executeCommand('touch newfile.txt', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.fileSystem?.['/home/user/newfile.txt']).toBeDefined();
      });
    });

    describe('rm command', () => {
      it('should remove file', () => {
        const state = getTerminalState('/home/user/documents', getDefaultState().environment, getDefaultState().fileSystem);
        const result = executeCommand('rm readme.txt', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.fileSystem?.['/home/user/documents/readme.txt']).toBeUndefined();
      });

      it('should require -r for directories', () => {
        const state = getDefaultState();
        const result = executeCommand('rm documents', state);
        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('Is a directory');
      });

      it('should remove directory with -r flag', () => {
        const state = getDefaultState();
        const result = executeCommand('rm -r documents', state);
        expect(result.exitCode).toBe(0);
        expect(result.newState?.fileSystem?.['/home/user/documents']).toBeUndefined();
      });
    });

    describe('unknown command', () => {
      it('should return command not found', () => {
        const state = getDefaultState();
        const result = executeCommand('unknowncmd', state);
        expect(result.exitCode).toBe(127);
        expect(result.output).toContain('command not found');
      });
    });

    describe('empty command', () => {
      it('should return empty output', () => {
        const state = getDefaultState();
        const result = executeCommand('', state);
        expect(result.exitCode).toBe(0);
        expect(result.output).toBe('');
      });
    });
  });
});
