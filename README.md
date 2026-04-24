# port-free

> Kill whatever is running on a port. One command, cross-platform.

```sh
npx port-free 3000
```

No installs. No googling `lsof` flags at 2am. Just works.

---

## Install

```sh
npm install -g port-free
# or use without installing
npx port-free 3000
```

## Usage

```sh
# Free a single port
port-free 3000

# Free multiple ports at once
port-free 3000 8080 9000

# Force kill (SIGKILL — immediate, no graceful shutdown)
port-free 3000 --force

# See what would be killed without killing it
port-free 3000 --dry-run

# List all processes listening on ports
port-free --list
```

## Programmatic API

```ts
import { freePort, freePorts, findProcess, findAllListening } from "port-free";

// Free a port
const result = await freePort(3000);
console.log(result);
// { port: 3000, freed: true, process: { pid: 12345, name: "node" } }

// Free multiple ports
const results = await freePorts([3000, 8080]);

// Dry run
const dryResult = await freePort(3000, { dryRun: true });

// Force kill
await freePort(3000, { signal: "SIGKILL" });

// Find what's on a port
const info = findProcess(3000);
// { pid: 12345, port: 3000, name: "node" } | null

// List all listening processes
const all = findAllListening();
// [{ port: 3000, pid: 12345, name: "node" }, ...]
```

## Cross-platform

| Platform | Detection | Kill |
|----------|-----------|------|
| macOS    | `lsof`    | `kill` |
| Linux    | `lsof`    | `kill` |
| Windows  | `netstat` | `taskkill` |

Zero runtime dependencies.

## License

MIT
