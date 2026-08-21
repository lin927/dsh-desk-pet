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

### Via `dsh plugin add` (git) — one command

This package is a **dsh bundle** (`dsh.bundle` + `cordis.patch.yml`), so
`dsh plugin add` installs it and adds it to the profile's bundle layer
automatically — no manual `cordis.patch.yml` edit needed:

```bash
dsh plugin --profile web add git+https://github.com/lin927/dsh-desk-pet.git
dsh web   # restart
```

`dsh plugin add` links the package into the profile's `node_modules` and, because
the package declares `dsh.bundle`, adds it to `dsh.profile.bundles`. On restart
the profile's bundle layer inserts the `desk-pet` row, the web app's
`clientModules` discovers its `dsh.client` declaration, and the pet loads.

### Manual copy (no git)

1. Copy this directory (the committed `lib/client.js` is prebuilt; no build needed).
2. Add it as a bundle to the profile (equivalent of what `dsh plugin add` does):
   ```bash
   mkdir -p ~/.dsh/profiles/web/node_modules/@deepseek-ai
   ln -s /path/to/dsh-desk-pet ~/.dsh/profiles/web/node_modules/@deepseek-ai/dsh-desk-pet
   ```
   and add `"@deepseek-ai/dsh-desk-pet": "link:/path/to/dsh-desk-pet"` to
   `~/.dsh/profiles/web/package.json` `dependencies` and
   `"@deepseek-ai/dsh-desk-pet"` to its `dsh.profile.bundles`.
3. Restart `dsh web`.

> Two important facts about web **client** plugins:
> - The built `lib/client.js` must be present and the package must be declared
>   by a loaded manifest (profile/bundle `package.json` dependencies); a bare
>   `node_modules` symlink plus a `cordis.patch.yml` row is **not** enough —
>   "a row whose package no manifest declares fails to import."
> - The web app serves the client bundle at `/plugins/<id>/client.js`; the
>   browser-side loader provides the `@deepseek-ai/*` externals at runtime, so
>   the package itself declares no `@deepseek-ai` dependencies.

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
