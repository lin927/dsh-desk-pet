# DSH Desk Pet

A desktop pet for the **DeepSeek Harness (DSH) web GUI**: a chibi **Kaito Kid**
(from the [awesome-codex-pet](https://github.com/legeling/awesome-codex-pet)
`kid--chenxin-dlut` spritesheet) that sits at the bottom-right corner and reacts
to the agent's working state — running while a turn is active, jumping with a
「老大，搞定~」bubble and a Web Audio chime when a task completes, and doing
ambient waving/jumping while idle. It is draggable and remembers its position.

This is a **static DSH web client plugin** (`dsh.client` package). It is
client-only: the pet reads the active session's running state from the browser
session snapshot, and its assets are embedded as data URLs, so it needs **no
host half, no RPC, and no network**.

## How it works

- Registers into the `shell.overlay` slot → a floating pet at the frame's
  bottom-right corner.
- Uses `useSessions` (the slot's standard hook) to read the current session's
  `running` / completed state.
- Actions: `idle`, `running`, `waving`, `jumping` (on completion), `failed`.
- Ambient waving/jumping every 7–13s while idle.
- Completion chime via Web Audio (no audio file).
- Drag anywhere in the viewport; position persisted to `localStorage`.

## Layout

```
package.json          # @deepseek-ai/dsh-desk-pet, dsh.client manifest
tsconfig.json
tsdown.config.ts
src/
  index.ts            # node half (no-op; the pet is client-side)
  invariant.ts        # package invariant companion
  client/
    index.ts          # registers shell.overlay
    DeskPet.tsx       # the pet component
    assets.ts         # embedded animated WebP data URLs (generated)
assets/*.webp         # source animations (generated)
scripts/generate-assets.py
lib/                  # built artifacts (lib/client.js etc.)
```

## Install & enable

DSH loads web plugins by adding a loader row to a profile's
`cordis.patch.yml` and making the package resolvable from that profile's
`node_modules`.

### Via `dsh plugin add` (git)

```bash
# 1. Install the package into a profile (resolves + links it):
dsh plugin --profile web add git+https://github.com/lin927/dsh-desk-pet.git

# 2. Declare the row in ~/.dsh/profiles/web/cordis.patch.yml:
#    - id: desk-pet
#      name: '@deepseek-ai/dsh-desk-pet'

# 3. Restart dsh web
```

Git-hosted plugins build on install via their `prepare` script (tsdown), which
pnpm blocks until allowed — add the exact key pnpm prints under `allowBuilds`
in `~/.dsh/profiles/web/pnpm-workspace.yaml`, then re-run.

### Manual copy (no git)

1. Build the package on a machine with the DSH harness (`pnpm --filter @deepseek-ai/dsh-desk-pet bundle`) so `lib/client.js` exists — the committed `lib/` is already built.
2. Copy this directory to the target machine.
3. Make it resolvable from the profile's `node_modules`, e.g.:
   ```bash
   mkdir -p ~/.dsh/profiles/web/node_modules/@deepseek-ai
   ln -s /path/to/dsh-desk-pet ~/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-desk-pet
   ```
4. Add the row to `~/.dsh/profiles/web/cordis.patch.yml`:
   ```yaml
   - id: desk-pet
     name: '@deepseek-ai/dsh-desk-pet'
   ```
5. Restart `dsh web`.

> Because this is a web **client** plugin, the built `lib/client.js` must be
> present and the package must be resolvable from the profile the web app boots
> with; the web app serves it at `/plugins/<id>/client.js`. A bare directory
> copy alone is not enough — the package must be linked into the profile's
> `node_modules` (step 3).

## Rebuilding

Inside the DSH harness workspace (this package's peer deps are
`@deepseek-ai/*` workspace packages):

```bash
pnpm exec tsc -p packages/extensions/desk-pet/tsconfig.json   # emits lib/types
pnpm --filter @deepseek-ai/dsh-desk-pet bundle                 # emits lib/*.js
```

To regenerate the animations from a fresh spritesheet:

```bash
python3 scripts/generate-assets.py /path/to/spritesheet.webp
```

## Assets

The pet character is **Kaito Kid** from
[awesome-codex-pet](https://github.com/legeling/awesome-codex-pet)
(`pets/kid--chenxin-dlut`). Please honor its
[ASSETS-LICENSE.md](https://github.com/legeling/awesome-codex-pet/blob/main/ASSETS-LICENSE.md).
