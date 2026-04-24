# portkill

> Kill whatever is running on a port. One command, cross-platform, zero dependencies.

No more googling `lsof` flags. No more `netstat -ano | findstr` on Windows. Just run it.

```sh
npx portkill 3000
```

```
✓ Port 3000 freed — killed node (PID 18423)
```

---

## Install

```sh
# Use without installing (recommended)
npx portkill 3000

# Or install globally
npm install -g portkill
```

---

## CLI Usage

```sh
# Free a single port
portkill 3000
fp 3000

# Free multiple ports at once
portkill 3000 8080 9000
fp 3000 8080 9000

# Force kill — SIGKILL, no graceful shutdown
fp 3000 --force

# Preview what would be killed without killing it
fp 3000 --dry-run

# List all processes currently listening on ports
fp --list
```

### Demo output

```
$ fp 3000 8080 --dry-run
~ Port 3000 — would kill node (PID 18423)
~ Port 8080 — would kill python (PID 22910)

$ fp 3000 8080
✓ Port 3000 freed — killed node (PID 18423)
✓ Port 8080 freed — killed python (PID 22910)

$ fp --list

  Listening processes:

  PORT    PID     NAME
  ────────────────────────────────
  3000    18423   node
  5432    891     postgres
  6379    1042    redis
  8080    22910   python
```

---

## Programmatic API

```ts
import { freePort, freePorts, findProcess, findAllListening } from "portkill";

// Free a port
const result = await freePort(3000);
// { port: 3000, freed: true, process: { pid: 18423, name: "node" } }

// Free multiple ports
const results = await freePorts([3000, 8080, 9000]);

// Dry run — see what would be killed
const preview = await freePort(3000, { dryRun: true });

// Force kill (SIGKILL)
await freePort(3000, { signal: "SIGKILL" });

// Find what process is on a port
const info = findProcess(3000);
// { pid: 18423, port: 3000, name: "node" } | null

// List all listening processes
const all = findAllListening();
```

### TypeScript types

```ts
interface FreePortResult {
  port: number;
  freed: boolean;
  dryRun: boolean;
  process?: { pid: number; name: string };
  error?: string;
}

type KillSignal = "SIGTERM" | "SIGKILL";
```

---

## Cross-platform

| Platform | Detection     | Kill              |
|----------|---------------|-------------------|
| macOS    | `lsof`        | `kill -15 / -9`   |
| Linux    | `lsof`        | `kill -15 / -9`   |
| Windows  | `netstat`     | `taskkill [/F]`   |

**Zero runtime dependencies.**

---

## Options

| Flag        | Alias | Description                              |
|-------------|-------|------------------------------------------|
| `--force`   | `-f`  | SIGKILL — immediate, no graceful cleanup |
| `--dry-run` |       | Show what would be killed, don't kill    |
| `--list`    | `-l`  | List all processes listening on ports    |
| `--help`    | `-h`  | Show help                                |

---

## Why portkill?

- **`fkill`** — requires interactive prompts, heavier install
- **`kill-port`** — no `--list`, no dry-run, unmaintained
- **`portkill`** — CLI + programmatic API, cross-platform, zero deps, `fp` shorthand

---

## Contributing

```sh
git clone https://github.com/The-ARJ/port-free
cd port-free
npm install
npm run dev   # watch mode
npm test      # run tests
```

---

## License

MIT © [Aayush Raj Joshi](https://github.com/The-ARJ)
