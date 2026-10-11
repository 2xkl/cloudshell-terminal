# CloudShell Terminal Command Skill

## Description
Skill for adding new terminal emulator commands to the CloudShell system. Use when implementing new shell commands like `grep`, `cp`, `mv`, `head`, `tail`, etc.

## Activation
- "add terminal command"
- "implement command"
- "new shell command"

## Workflow

1. **Analyze Request** - Understand what the command should do
2. **Check Existing Commands** - Review `src/backend/src/services/terminalEmulator.ts`
3. **Implement Command** - Add handler in switch statement
4. **Add Tests** - Create tests in `src/backend/src/__tests__/terminalEmulator.test.ts`
5. **Update Help** - Add command to help output
6. **Verify** - Run tests to ensure everything works

## Implementation Pattern

Commands follow this pattern in `terminalEmulator.ts`:

```typescript
case 'commandname':
  return handleCommandName(args, state);

function handleCommandName(args: string[], state: TerminalState): CommandResult {
  // Parse flags from args
  // Validate input
  // Execute logic
  // Return { output, exitCode, newState? }
}
```

## Testing Pattern

Tests follow this pattern:

```typescript
describe('commandname command', () => {
  it('should do basic operation', () => {
    const result = executeCommand('commandname arg', state);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('expected');
  });

  it('should handle edge cases', () => {
    // Test error conditions
  });
});
```

## Existing Commands Reference

| Command | Flags | Description |
|---------|-------|-------------|
| ls | -l, -a, -la | List directory contents |
| cd | - | Change directory |
| pwd | - | Print working directory |
| cat | - | Display file contents |
| echo | - | Print text (supports $VAR) |
| env | - | Show environment variables |
| export | - | Set environment variable |
| mkdir | - | Create directory |
| touch | - | Create empty file |
| rm | -r | Remove file/directory |
| whoami | - | Show current user |
| date | - | Show current date |
| help | - | Show available commands |
| clear | - | Clear terminal |

## Output

After implementation:
- Modified `terminalEmulator.ts` with new command
- New tests in `terminalEmulator.test.ts`
- All tests passing
