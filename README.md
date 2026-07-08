# Cell Machine

Cell Machine is a browser-based biology puzzle game for high-school students. It asks players to assemble cellular machinery and then run a simple simulation to see whether the mechanism works.

The current prototype has two units:

- **Unit 1: Cell Membrane Mechanics** - diffusion, transporters, pumps, membrane potential, action potentials, and signal propagation.
- **Unit 2: Adrenaline Cascade** - adrenaline reception in a liver cell, G-protein signaling, adenylyl cyclase, cAMP, PKA, phosphorylase kinase, glycogen phosphorylase, and glycogen breakdown.

## Play Locally

Open `index.html` in a modern browser.

No build step is required. The game is a static web app made from:

- `index.html`
- `styles.css`
- `game.js`

## How To Play

1. Use the tutorial to learn the layout.
2. Drag parts from the right panel onto the cell board.
3. Press **Run** to test the assembly.
4. Use **Pause**, **Reset**, **Remove**, or **Clear all** to revise the setup.
5. Select a placed part and press **Remove**, **Del**, or **Backspace** to remove it.
6. Hover over parts in the parts panel to read what they do.

## How To Edit

Most game content is in `game.js`.

Useful places to start:

- `partTypes` defines available cell parts and their descriptions.
- `levels` defines tutorial text, level prompts, allowed parts, targets, molecule setup, and timing.
- `update(...)`, `moveMolecules(...)`, and `runPartEffects(...)` control simulation behavior.
- Drawing functions near the bottom of `game.js` control the visual appearance of membranes, molecules, proteins, sockets, and tutorial callouts.

After editing `game.js`, check syntax with:

```powershell
node --check game.js
```

If a browser appears to show an old version, update the cache query strings in `index.html`, for example from `game.js?v=130` to `game.js?v=131`.

## Publishing Privately On GitHub

Recommended repository name:

```text
GBazykin/cell-machine
```

Recommended visibility:

```text
Private
```

Suggested first commit contents:

- `index.html`
- `styles.css`
- `game.js`
- `README.md`
- `.gitignore`

For controlled play-testing, keep the repository private and invite collaborators or testers through GitHub access settings.

For public classroom deployment later, GitHub Pages can serve this as a static site, but only after you are ready for the game to be publicly accessible.
