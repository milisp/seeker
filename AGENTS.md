# Agents

### Project tech
- Package manager: bun
- Framework: React + shadcn + tailwindcss + TypeScript + Tauri v2
- Don't use emit_all, use emit
- UI: shadcn UI components
- Zustand: for state management with persistence
- When consuming Zustand stores prefer destructuring the store return (e.g. `const { foo } = useStore();`) instead of manually selecting each state/action via `(state) => state.foo`.

## Common Commands
- `bunx tsc --noEmit` - every time when frontend code change, don't ask me

## Project Structure
- `src/components/` - React components
- `src/hooks/` - Custom hooks and stores
- use `@/hooks` `@/types` etc.

```ts
import { invoke } from "@tauri-apps/api/core";
  const { cwd } = useWorkspaceStore() // cwd is current working dir
```
