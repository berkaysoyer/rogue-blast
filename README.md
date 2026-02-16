# Block Blast MVP (Prototype)

Simple web-based Block Blast style prototype:

- 8x8 fixed board
- Drag-and-drop placement only
- 3 generated pieces at a time
- Invisible-hand style weighted generation:
  - Shape weight = exposed perimeter edges + block count
  - Picks from currently placeable shape types
  - Adds low-occupancy size boost so bigger shapes are favored early game
  - Adds extra near-empty-board boost for larger shapes (6+ cells)
  - Simulates designated placements near the busiest quadrant corner
- Rows/columns clear simultaneously when full
- Score from line clears with multi-line bonus
- Best score persisted in `localStorage`
- Game over when no current piece can be placed
- Toggle: generator simulation can include or ignore line clears between pick 1/2/3
- Toggle: designated spot hover hint can be shown/hidden
- Hovering a tray piece can show its original designated generation spot on board
- Roguelite prototype layer:
  - Token gem can appear on newly placed surviving blocks when a new bank is generated (10% chance, 1 token per bank roll)
  - Clearing a block with token collects it
  - Progress bar above pieces tracks milestone progress (3, 5, 7, 9, ...)
  - Milestone opens perk-pick overlay (3 options + free reshuffle RV button)
  - Picked perks are removed from future offerings
  - Dummy perk effects for now (names/icons/stars only)
- Dragging over a valid clearing move now:
  - draws one rectangular outline over the full clear area
  - flashes blocks that will be cleared (board blocks + dragged blocks on clearing lines)
- Perfect Fit generation mode (configurable):
  - Per-piece chance to attempt perfect-fit placement (default `0.5`)
  - Toggle for board source:
    - ON (default): evaluate perfect fit from current board view
    - OFF: evaluate perfect fit from simulated board view
  - `minimumPerfectFitPercentage` default `0.7`
  - `minimumCellsFilledPercentage` default `0.3`
  - Per-edge-segment scoring
  - `perfectFitPercentage = touchingEdges / totalEdges`
  - `cellsFilledPercentage = touchingBlockEdges / totalEdges`
  - Falls back to weighted generation (based on original visible board) when no perfect-fit placement is found
  - In simulated mode, perfect-fit picks are simulated sequentially without simulating clears
  - Weighted picks are not simulated when determining perfect-fit picks
  - Labels:
    - `Perfect Fit` (current-board mode)
    - `Perfect Fit (Simulated)` (simulated mode)
    - `Weighted`
- Shape Bank modal:
  - View all available shapes
  - Includes larger blocks like `2x3`, `3x2`, and `3x3`
  - Toggle individual shapes on/off
  - Disabled shapes are never generated
- Clearing rows/columns spawns gravity debris particles with quick random lifetime (`0.4s`-`1.0s`)

## Run

Open `index.html` in a browser.

No build step is required.