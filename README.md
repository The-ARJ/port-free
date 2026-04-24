# port-free

[![npm version](https://img.shields.io/npm/v/port-free?color=crimson&style=flat-square)](https://www.npmjs.com/package/port-free)
[![npm downloads](https://img.shields.io/npm/dm/port-free?style=flat-square)](https://www.npmjs.com/package/port-free)
[![CI](https://img.shields.io/github/actions/workflow/status/The-ARJ/port-free/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/The-ARJ/port-free/actions)
[![license](https://img.shields.io/npm/l/port-free?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/port-free?style=flat-square)](package.json)
[![zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](#)

> Kill whatever is running on a port. One command, cross-platform, zero dependencies.

No more googling `lsof` flags. No more `netstat -ano | findstr` on Windows. Just run it.

```sh
npx port-free 3000
```

```
✓ Port 3000 freed — killed node (PID 18423)
```

---

## Install

```sh
# Use without installing (recommended)
npx port-free 3000

# Or install globally
npm install -g port-free
```

---

## CLI Usage

```sh
# Free a single port
port-free 3000

# Free multiple ports at once
port-free 3000 8080 9000

# Force kill — SIGKILL, no graceful shutdown
port-free 3000 --force

# Preview what would be killed without killing it
port-free 3000 --dry-run

# List all processes currently listening on ports
port-free --list
```

### Demo output

```
$ port-free 3000 8080 --dry-run
~ Port 3000 — would kill node (PID 18423)
~ Port 8080 — would kill python (PID 22910)

$ port-free 3000 8080
✓ Port 3000 freed — killed node (PID 18423)
✓ Port 8080 freed — killed python (PID 22910)

$ port-free --list

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

Use `port-free` as a library inside your own scripts or tools:

```ts
import { freePort, freePorts, findProcess, findAllListening } from "port-free";

// Free a port
const result = await freePort(3000);
// { port: 3000, freed: true, process: { pid: 18423, name: "node" } }

// Free multiple ports
const results = await freePorts([3000, 8080, 9000]);

// Dry run — see what would be killed
const preview = await freePort(3000, { dryRun: true });
// { port: 3000, freed: false, dryRun: true, process: { pid: 18423, name: "node" } }

// Force kill (SIGKILL)
await freePort(3000, { signal: "SIGKILL" });

// Find what process is on a port
const info = findProcess(3000);
// { pid: 18423, port: 3000, name: "node" } | null

// List all listening processes
const all = findAllListening();
// [{ port: 3000, pid: 18423, name: "node" }, ...]
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

interface ProcessInfo {
  pid: number;
  port: number;
  name: string;
}

type KillSignal = "SIGTERM" | "SIGKILL";
```

---

## Cross-platform

Works out of the box on all major platforms — no extra tools needed.

| Platform | How it finds the process | How it kills |
|----------|--------------------------|--------------|
| macOS    | `lsof -ti tcp:<port>`    | `kill -15 / -9` |
| Linux    | `lsof -ti tcp:<port>`    | `kill -15 / -9` |
| Windows  | `netstat -ano`           | `taskkill [/F] /PID` |

**Zero runtime dependencies.** Only Node.js built-ins (`child_process`).

---

## Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--force` | `-f` | Use SIGKILL instead of SIGTERM (immediate) |
| `--dry-run` | | Show what would be killed without doing it |
| `--list` | `-l` | List all processes listening on ports |
| `--help` | `-h` | Show help |

---

## Why port-free?

- **`fkill`** — requires interactive prompts, heavier install
- **`kill-port`** — no `--list`, no dry-run, unmaintained
- **`port-free`** — CLI + programmatic API, cross-platform, zero deps, actively maintained

---

## Contributing

```sh
git clone https://github.com/The-ARJ/port-free
cd port-free
npm install
npm run dev      # watch mode
npm test         # run tests
```

---

## License

MIT © [Aayush Raj Joshi](https://github.com/The-ARJ)
