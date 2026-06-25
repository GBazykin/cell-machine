# Cell Machine Design

This document preserves the current game design from the existing conversation only. It is intentionally conservative: unresolved details are listed as open questions rather than silently decided.

## 1. Game Concept

### Confirmed Design Decisions

Cell Machine is an educational biology puzzle game for high school students. The original inspiration is *The Incredible Machine*: the player assembles interacting biological parts, runs the simulation, and observes whether the cellular mechanism works.

The game currently has at least two distinct units:

- Unit 1: membrane transport, membrane potential, and action potential dynamics.
- Unit 2: adrenaline signaling in a liver cell, ending in glycogen breakdown.

The first unit aims to build toward an action potential starting from Na+ outside the cell and K+ inside the cell, using explicit membrane potential rather than a vague “charge” or “gradient” concept.

The second unit aims to assemble the adrenaline cascade in a liver cell so that glycogen is broken down into glucose.

### Inferred Assumptions

The game is a browser-based static web app because that was the easiest target during development and because standalone folders with `index.html`, `styles.css`, and `game.js` were repeatedly prepared.

The educational priority is visual mechanistic understanding over biochemical completeness.

### Open Questions

The exact target age, curriculum alignment, and classroom use model are not yet specified.

Whether this remains a standalone static web app or later becomes a hosted/private web app is still unresolved.

## 2. Core Loop

### Confirmed Design Decisions

The player:

1. Reads the level goal and available parts.
2. Places biological parts onto the cell/membrane/workspace.
3. Presses Run to simulate.
4. Watches molecules, voltage, gradients, ATP, or cascade intermediates change.
5. Uses Reset to restore the initial molecular setup without removing parts.
6. Uses Clear all to remove all parts.
7. Revises the assembly and reruns until the target is achieved.

Runs should generally last at least a few seconds so the student can see the mechanism.

After a target is achieved, the simulation should not stop instantly; there should be a small pause so visual feedback and color changes can complete.

At all levels, pressing Run should be allowed even when no parts are installed.

After a target is achieved, pressing Run again should allow the simulation to continue.

### Inferred Assumptions

The game is puzzle-like rather than score-attack-like. The reward is satisfying the biological target and seeing the mechanism work.

Most levels are meant to introduce one or two concepts, then later combine them.

### Open Questions

There is no confirmed scoring system beyond target completion.

There is no confirmed fail-state design beyond timeout or feedback that the setup did not work.

## 3. Player Controls

### Confirmed Design Decisions

The player can drag parts from the Parts panel onto the board.

The player can press Run to start the simulation.

The Pause button should change to Unpause when paused and should be used to resume.

Reset restores the molecular/cellular setup to the initial state while keeping installed parts.

Clear all removes all installed parts.

Selected parts can be removed with the Delete key. The separate Remove button was explicitly removed.

The left and right level navigation buttons wrap:

- On the first playable level of Unit 1, the left arrow goes to the final level.
- On the last level, the right arrow returns to the first level.

Hovering over parts in the Parts panel should show explanations of each part’s behavior.

### Inferred Assumptions

Part placement is mouse/touch driven, but exact mobile interaction details are not specified.

Selection is needed because Delete removes the selected part.

### Open Questions

Keyboard accessibility beyond Delete and button activation has not been specified.

Undo/redo has not been specified.

## 4. Game Objects / Entities

### Confirmed Design Decisions

Unit 1 includes or discusses:

- O2 molecules.
- Glucose molecules.
- H+ ions.
- Na+ ions.
- K+ ions.
- ACh molecules.
- Simple diffusion through the membrane.
- Channels.
- Leak channels.
- Receptors.
- ACh receptor/channel behavior.
- Voltage-dependent Na+ gates.
- Delayed K+ gates.
- Proton pumps.
- ATP synthase.
- Na+/K+ pumps.
- Myelin.
- Nodes of Ranvier.
- Explicit lanes for spatial signal propagation in selected levels.

Na+/K+ pumps should transport 3 Na+ ions per 2 K+ ions and should visibly show slots for these ions.

Pumps should not teleport ions from far away. They should activate only when the required ions physically reach the transporter.

All channels/gates should use consistent definitions for local attraction, actual reach to the pore, visual activation, and conductivity.

Voltage-gated channels should be potential-dependent, with no arbitrary delay.

Unit 2 includes or discusses:

- Adrenaline.
- Beta-adrenergic receptor.
- G-protein with three subunits.
- G-alpha subunit.
- Adenylyl cyclase.
- ATP as an actual molecule made of adenosine plus three phosphate groups.
- cAMP.
- PKA with two regulatory and two catalytic subunits.
- Phosphorylase kinase.
- Glycogen phosphorylase.
- Glycogen chains.
- Glucose produced from glycogen.
- ADP, phosphate, and pyrophosphate as phosphorylation/cyclase products where relevant.

G-protein should visibly connect to a receptor when placed nearby.

When receptor activation occurs, one G-protein subunit should disconnect, travel through the membrane, and connect to adenylyl cyclase.

Adenylyl cyclase should have a socket for the G-protein subunit.

PKA should have four cAMP slots, with cAMP binding only to regulatory subunits, two cAMP per regulatory subunit.

When all four cAMP molecules are attached, PKA catalytic subunits separate and travel as triangular mobile subunits to phosphorylase kinase.

Mobile protein subunits should remain triangular while traveling and attaching.

Activated proteins should have explicit triangular docking sockets/holes, not just labels or symbols drawn on top.

Glycogen should be a long chain of circles. Glycogen phosphorylase should remove circles from chain ends one by one at an active center and convert them to glucose.

### Inferred Assumptions

Molecules are represented as moving particles with simplified physics.

Proteins are larger, placed objects with visible sockets, slots, or docking regions.

“Substrates” fill slots, while mobile protein subunits attach like shaped pieces and keep their form.

#### YB ADDED MANUALLY

It is strongly preferred that the behaviour of parts, cell components and elements should be consistent between levels and units, so that the user gets a stable engineering “feel” of how a part works. 

When protein subunits are present, one subunit should have a socket matching in shape the other subunit. Preferably, the socket should be such that a part of one subunit fits into the other like a puzzle piece, rather than awkwardly hanging off its side.

### Open Questions

Exact molecule counts, kinetic rates, and physical constants are level-specific and not fully specified in the conversation.

The precise behavior of glucose leaving liver cells was discussed conceptually, but no confirmed game mechanic for glucose export was requested.

## 5. Rules and Scoring

### Confirmed Design Decisions

Levels have explicit targets. Examples discussed include:

- Equilibrating O2 across the membrane.
- Establishing or using molecule-specific gradients.
- Reaching a target membrane potential.
- Producing ATP.
- Completing phases of an action potential.
- Triggering the rightmost lane in propagation levels.
- Breaking down glycogen into glucose in the adrenaline cascade unit.

The “Charge” counter was considered confusing and removed.

The “Gradient” counter should be molecule-specific and level-dependent.

Membrane potential should be explicit in Unit 1 when relevant.

If membrane potential is 0 mV, charge should be balanced across compartments.

The color of compartments should reflect electric potential or relevant charge balance, and colors should become the same when charge equalizes.

### Inferred Assumptions

Success is binary per level: the setup either achieves the target or does not.

Targets are educational summaries of the underlying simulation state, not abstract score totals.

### Open Questions

There is no confirmed point score, star rating, time bonus, penalty, or leaderboard.

Exact target wording for every level has been repeatedly adjusted and remains a known area needing careful review.

## 6. Progression / Difficulty Curve

### Confirmed Design Decisions

A tutorial should appear before the first level. It should be step-by-step, highlight the part of the screen being discussed, and grey out the rest.

Unit 1 starts with simpler membrane mechanics and builds toward action potentials:

- Simple diffusion through the membrane with no parts.
- Molecule-specific gradient concepts.
- Proton gradients and ATP-related mechanics.
- Membrane potential.
- ACh-triggered depolarization.
- Voltage-dependent Na+ and delayed K+ gates.
- Multi-phase action potential.
- Repolarization using the Na+/K+ pump.
- Signal propagation along the membrane.
- Myelinated propagation with three nodes of Ranvier.

The initial trigger of the action potential should use an external ACh event in selected levels. ACh should be jetted into the outside compartment rather than appearing instantly, and an ACh molecule should bind to the receptor rather than merely touching it.

For propagation levels, ACh may enter from the left and the signal should propagate left to right.

For spatial propagation levels, lanes should be explicit and lane colors should reflect lane-specific potential. In non-spatial levels, compartments remain global.

For myelinated propagation, there should be three unsheathed regions: left, middle, and right. Lanes should match the nodes of Ranvier.

No parts should be placeable in myelinated regions.

Unit 2 builds the adrenaline cascade:

- Receptor activation.
- G-protein coupling and activation.
- Adenylyl cyclase.
- ATP to cAMP.
- PKA activation by cAMP.
- PKA activation of phosphorylase kinase using ATP.
- Phosphorylase kinase activation of glycogen phosphorylase.
- Glycogen breakdown into glucose.

### Inferred Assumptions

Difficulty increases by adding more required intermediates, stricter spatial constraints, and more sequential dependencies.

Later levels may combine mechanics from earlier levels, but only combinations already discussed should be considered part of the preserved design.

### Open Questions

The exact level list and numbering may have shifted during development.

The final count of levels per unit is not fixed in the conversation.

## 7. Visual Style

### Confirmed Design Decisions

The style should be coherent across units.

The membrane should look more realistic than a single line. It should have two layers with schematic lipid molecules, smaller and denser heads, and tails that touch the heads.

Channels and pumps should visibly activate by changing their own appearance or flashing locally, rather than flashing the whole cell.

The whole-cell flash for transport events was explicitly replaced with local flashing of the active pump/receptor/channel.

Channels that are active should be visibly distinguishable from inactive ones.

Compartment colors should reflect charge or potential where relevant.

Unit 2 should move the membrane upward to leave more space for cascade proteins.

Glycogen should be drawn as long chains of circles, not separate floating circles.

Proteins in Unit 2 should not rely only on text labels on the protein bodies. For example, text on PhK was explicitly rejected.

### Inferred Assumptions

Visual clarity is more important than photorealism.

The art style is schematic, colorful, and mechanistic.

### Open Questions

No final color palette specification exists.

No accessibility requirements for color-blind users have been specified.

## 8. UI / Menus

### Confirmed Design Decisions

The app layout includes:

- A left mission/status panel.
- A central simulation board/canvas.
- A right Parts panel.
- Level navigation controls.
- Run, Pause/Unpause, Reset, and Clear all buttons.
- Feedback/status text.
- Meters/counters relevant to the current level.
- An action-potential plot in Unit 1 where relevant.

The action-potential plot and membrane-potential counter should be removed at levels where it is irrelevant, including Unit 2.

The label should say “Unit 2 Level 1” rather than continuing as “Level 21/26”.

The game should fit a standard browser screen.

The black focus/frame outline when clicking elsewhere in the game window was explicitly rejected.

The button text should be “Clear all”, not “Clear”.

### Inferred Assumptions

The app is meant to be usable without a build step.

The Parts panel is both a palette and an explanatory reference through hover text.

### Open Questions

No main menu, save system, settings menu, or level-select menu has been specified.

No confirmed publication/testing UI exists beyond sharing the static app or GitHub repository.

## 9. Sound / Music

### Confirmed Design Decisions

No sound or music was specified in the conversation.

### Inferred Assumptions

The current design is silent.

### Open Questions

Whether there should be sound effects for binding, transport, phosphorylation, success, or failure is unspecified.

Whether classroom use should default to muted is unspecified.

## 10. Things Explicitly Rejected Or Out Of Scope

### Confirmed Design Decisions

The following were explicitly rejected or removed:

- A global whole-cell flash for molecule movement through pumps/receptors/channels.
- A separate Remove button after Delete-key removal was added.
- The confusing “Charge” counter.
- Generic, non-molecule-specific gradient counters.
- Teleporting ions or molecules from far away into channels or pumps.
- Initial clustering of ions around gates at the beginning of a run.
- Neighbor-propagation terms that cause spontaneous potential changes between lanes.
- Restricting ions from moving sideways between lanes was tried and then explicitly reverted.
- Allowing any part placement in myelinated regions.
- Membrane-potential counter and plot in the adrenaline cascade unit.
- Vertical activation lines for adrenaline cascade proteins.
- Text instructions written directly on proteins.
- Glycogen as separate floating circles.
- Glycogen phosphorylase covering glycogen during processing.
- Switching the GP active center between sides.

### Inferred Assumptions

The project should avoid hidden mechanics that produce unexplained changes in voltage, molecule counts, or activation state.

### Open Questions

It is unclear whether some rejected mechanics may still exist accidentally as implementation bugs.

## 11. Open Questions / Uncertain Points

### Confirmed Design Decisions

Ambiguities should not be silently resolved. When in doubt, ask.

### Inferred Assumptions

The design is still evolving, especially around biological realism and level solvability.

### Open Questions

How biologically broad should the ACh-triggered action-potential model be? It is plausible for some biological contexts, but the exact educational framing is not locked.

How should glucose leave the liver cell after glycogen breakdown, if this becomes part of gameplay?

How detailed should ATP chemistry be beyond visible adenosine plus three phosphate groups and visible phosphorylation?

How should the game handle exact rates, molecule counts, and stochastic behavior while keeping levels reliably solvable?

Should there be a private web deployment for testers, GitHub Pages, or only local standalone folders?

Should collaborators edit the readable source directly, and how should the GitHub upload workaround be replaced?

## 12. Current Known Problems

### Confirmed Design Decisions

Known problems and recently reported issues from the conversation include:

- The left panel/action-potential plot recently shuddered between visible and hidden states across levels. A fix was attempted by moving visibility updates out of the animation loop, but it still needs user visual confirmation.
- Browser automation had difficulty with direct `file://` access, requiring localhost workarounds for inspection.
- Local `git`, `gh`, `node`, and Python availability was inconsistent or missing in the working environment.
- The GitHub repository upload used a compressed bundle workaround for `game.js`, which is not ideal for code editing.
- A standalone editable directory was later recreated with the readable files.
- Level 14 was reported as unsolvable and the Na/K gradient there was suspected buggy.
- Level 19 had reported mismatch between visible ion densities and potential, especially in lane/myelin contexts.
- Several prior issues involved teleporting or grabbing behavior by channels/gates/pumps; fixes were requested, but consistency across all levels should remain a watch item.
- Target formulations were repeatedly reported as confusing or incorrect and need ongoing review.

### Inferred Assumptions

The highest-risk areas are physics consistency across levels, target wording, lane-specific voltage behavior, and multi-instance protein behavior in Unit 2.

### Open Questions

Which of the listed known problems are fully fixed versus still present should be confirmed by systematic playtesting.

The current authoritative version for publication may need to be clarified: working folder, standalone folder, or GitHub repository.
