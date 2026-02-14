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
- Dragging over a valid clearing move now:
  - draws one rectangular outline over the full clear area
  - flashes blocks that will be cleared (board blocks + dragged blocks on clearing lines)
- Perfect Fit generation mode (configurable):
  - Per-piece chance to attempt perfect-fit placement (default `0.5`)
  - `minimumPerfectFitPercentage` default `0.7`
  - `minimumCellsFilledPercentage` default `0.3`
  - Macro-side scoring (4 sides: top/right/bottom/left)
  - `perfectFitPercentage = touchingSides / 4`
  - `cellsFilledPercentage = touchingBlockSides / 4`
  - Falls back to weighted generation (based on original visible board) when no perfect-fit placement is found
  - Perfect-fit picks are simulated sequentially without simulating clears
  - Weighted picks are not simulated when determining perfect-fit picks
  - Each generated piece is labeled `Perfect Fit (Simulated)` or `Weighted`
- Shape Bank modal:
  - View all available shapes
  - Includes larger blocks like `2x3`, `3x2`, and `3x3`
  - Toggle individual shapes on/off
  - Disabled shapes are never generated
- Clearing rows/columns spawns gravity debris particles with quick random lifetime (`0.4s`-`1.0s`)

## Run

Open `index.html` in a browser.

No build step is required.