# Block Blast MVP (Prototype)

Simple web-based Block Blast style prototype:

- 8x8 fixed board
- Drag-and-drop placement only
- 3 generated pieces at a time
- Invisible-hand style weighted generation:
  - Shape weight = exposed perimeter edges + block count
  - Picks from currently placeable shape types
  - Simulates designated placements near the busiest quadrant corner
- Rows/columns clear simultaneously when full
- Score from line clears with multi-line bonus
- Best score persisted in `localStorage`
- Game over when no current piece can be placed
- Toggle: generator simulation can include or ignore line clears between pick 1/2/3
- Toggle: designated spot hover hint can be shown/hidden
- Hovering a tray piece can show its original designated generation spot on board
- Shape Bank modal:
  - View all available shapes
  - Toggle individual shapes on/off
  - Disabled shapes are never generated

## Run

Open `index.html` in a browser.

No build step is required.