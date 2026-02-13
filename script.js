const BOARD_SIZE = 8;
const TRAY_CELL_SIZE = 22;
const STORAGE_KEY = "block-blast-mvp-best-score";
const SCORE_PER_LINE = 100;
const MULTI_LINE_BONUS_PER_EXTRA = 50;

const SHAPES = [
  { id: "single", cells: [[0, 0]] },
  { id: "domino_h", cells: [[0, 0], [1, 0]] },
  { id: "domino_v", cells: [[0, 0], [0, 1]] },
  { id: "line3_h", cells: [[0, 0], [1, 0], [2, 0]] },
  { id: "line3_v", cells: [[0, 0], [0, 1], [0, 2]] },
  { id: "line4_h", cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { id: "line4_v", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: "line5_h", cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { id: "line5_v", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: "square2", cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { id: "corner3_1", cells: [[0, 0], [1, 0], [0, 1]] },
  { id: "corner3_2", cells: [[0, 0], [1, 0], [1, 1]] },
  { id: "corner3_3", cells: [[0, 0], [0, 1], [1, 1]] },
  { id: "corner3_4", cells: [[1, 0], [0, 1], [1, 1]] },
  { id: "l4_1", cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  { id: "l4_2", cells: [[1, 0], [1, 1], [1, 2], [0, 2]] },
  { id: "l4_3", cells: [[0, 0], [1, 0], [2, 0], [0, 1]] },
  { id: "l4_4", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: "t4_up", cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { id: "t4_down", cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "t4_left", cells: [[1, 0], [0, 1], [1, 1], [1, 2]] },
  { id: "t4_right", cells: [[0, 0], [0, 1], [1, 1], [0, 2]] },
  { id: "z4_h", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { id: "s4_h", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { id: "plus5", cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
  { id: "u5", cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "v5", cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  { id: "zig5", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] }
];

const boardEl = document.getElementById("board");
const trayEl = document.getElementById("tray");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const restartBtn = document.getElementById("restart-btn");
const overlayEl = document.getElementById("overlay");
const finalScoreTextEl = document.getElementById("final-score-text");
const playAgainBtn = document.getElementById("play-again-btn");

let board = createEmptyBoard();
let boardCells = [];
let pieces = [];
let score = 0;
let bestScore = loadBestScore();
let pieceIdCounter = 0;
let isGameOver = false;
let dragState = null;

init();

function init() {
  buildBoardUi();
  bindControls();
  startNewGame();
}

function bindControls() {
  restartBtn.addEventListener("click", startNewGame);
  playAgainBtn.addEventListener("click", startNewGame);
}

function buildBoardUi() {
  boardEl.innerHTML = "";
  boardCells = [];

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i += 1) {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    boardCells.push(cell);
    boardEl.appendChild(cell);
  }
}

function startNewGame() {
  stopDrag();
  board = createEmptyBoard();
  score = 0;
  isGameOver = false;
  overlayEl.classList.add("hidden");
  spawnNewBatch();
  render();
}

function endGame() {
  isGameOver = true;
  stopDrag();
  finalScoreTextEl.textContent = `Final Score: ${score}`;
  overlayEl.classList.remove("hidden");
  render();
}

function spawnNewBatch() {
  const next = generateBatch(board);
  pieces = next;

  if (pieces.length === 0) {
    endGame();
    return;
  }

  if (!hasAnyMoves(board, pieces)) {
    endGame();
  }
}

function render() {
  renderBoard();
  renderTray();
  renderScore();
}

function renderScore() {
  scoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);
}

function renderBoard() {
  for (let i = 0; i < boardCells.length; i += 1) {
    const cell = boardCells[i];
    cell.className = "board-cell";
    if (board[i]) {
      cell.classList.add("occupied");
    }
  }

  if (!dragState) {
    return;
  }

  if (dragState.valid) {
    const rows = new Set(dragState.previewLines.rows);
    const cols = new Set(dragState.previewLines.cols);

    rows.forEach((row) => {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        boardCells[toIndex(x, row)].classList.add("clear-hint");
      }
    });

    cols.forEach((col) => {
      for (let y = 0; y < BOARD_SIZE; y += 1) {
        boardCells[toIndex(col, y)].classList.add("clear-hint");
      }
    });
  }

  dragState.previewCells.forEach((cell) => {
    if (!isInsideBoard(cell.x, cell.y)) {
      return;
    }
    boardCells[toIndex(cell.x, cell.y)].classList.add(
      cell.valid ? "preview-valid" : "preview-invalid"
    );
  });
}

function renderTray() {
  trayEl.innerHTML = "";

  pieces.forEach((piece) => {
    const slot = document.createElement("div");
    slot.className = "piece-slot";

    if (piece.used || isGameOver) {
      slot.classList.add("used");
    }

    const pieceEl = createPieceElement(piece.cells, TRAY_CELL_SIZE, "piece");
    slot.appendChild(pieceEl);

    if (!piece.used && !isGameOver) {
      slot.addEventListener("pointerdown", (event) => {
        beginDrag(event, piece);
      });
    }

    trayEl.appendChild(slot);
  });
}

function beginDrag(event, piece) {
  if (isGameOver || piece.used || dragState) {
    return;
  }

  event.preventDefault();

  const boardCellSize = getBoardCellSize();
  const dragCellSize = Math.max(28, boardCellSize - 8);
  const bounds = getShapeBounds(piece.cells);
  const anchor = {
    x: Math.floor(bounds.width / 2),
    y: Math.floor(bounds.height / 2)
  };

  const avatar = document.createElement("div");
  avatar.className = "drag-avatar";
  avatar.appendChild(createPieceElement(piece.cells, dragCellSize, "piece"));
  document.body.appendChild(avatar);

  dragState = {
    pointerId: event.pointerId,
    pieceId: piece.id,
    pieceCells: piece.cells,
    anchor,
    avatar,
    col: -1,
    row: -1,
    valid: false,
    previewCells: [],
    previewLines: { rows: [], cols: [] }
  };

  updateDragPosition(event.clientX, event.clientY);

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }
  updateDragPosition(event.clientX, event.clientY);
}

function onPointerUp(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) {
    return;
  }

  if (dragState.valid) {
    placeActivePiece();
  }

  stopDrag();
  render();
}

function stopDrag() {
  if (!dragState) {
    return;
  }

  if (dragState.avatar && dragState.avatar.parentNode) {
    dragState.avatar.parentNode.removeChild(dragState.avatar);
  }

  dragState = null;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
}

function updateDragPosition(clientX, clientY) {
  if (!dragState) {
    return;
  }

  dragState.avatar.style.transform = `translate(${clientX + 10}px, ${clientY + 10}px)`;

  const boardRect = boardEl.getBoundingClientRect();
  const boardCellSize = getBoardCellSize();

  const pointerInBoard =
    clientX >= boardRect.left &&
    clientX <= boardRect.right &&
    clientY >= boardRect.top &&
    clientY <= boardRect.bottom;

  if (!pointerInBoard) {
    dragState.valid = false;
    dragState.previewCells = [];
    dragState.previewLines = { rows: [], cols: [] };
    renderBoard();
    return;
  }

  const col = Math.floor((clientX - boardRect.left) / boardCellSize) - dragState.anchor.x;
  const row = Math.floor((clientY - boardRect.top) / boardCellSize) - dragState.anchor.y;

  dragState.col = col;
  dragState.row = row;

  const absoluteCells = dragState.pieceCells.map(([dx, dy]) => ({
    x: col + dx,
    y: row + dy
  }));

  const fits = canPlace(board, dragState.pieceCells, col, row);
  dragState.valid = fits;
  dragState.previewCells = absoluteCells
    .filter((cell) => isInsideBoard(cell.x, cell.y))
    .map((cell) => ({ ...cell, valid: fits }));

  if (fits) {
    const { completed } = simulatePlacement(board, dragState.pieceCells, col, row);
    dragState.previewLines = completed;
  } else {
    dragState.previewLines = { rows: [], cols: [] };
  }

  renderBoard();
}

function placeActivePiece() {
  if (!dragState) {
    return;
  }

  const piece = pieces.find((entry) => entry.id === dragState.pieceId);
  if (!piece) {
    return;
  }

  const { nextBoard, lineCount } = simulatePlacement(
    board,
    piece.cells,
    dragState.col,
    dragState.row
  );

  board = nextBoard;
  piece.used = true;

  if (lineCount > 0) {
    score += calculateLineScore(lineCount);
  }

  if (score > bestScore) {
    bestScore = score;
    saveBestScore(bestScore);
  }

  const allPlaced = pieces.every((entry) => entry.used);
  if (allPlaced) {
    spawnNewBatch();
    return;
  }

  if (!hasAnyMoves(board, pieces)) {
    endGame();
  }
}

function calculateLineScore(lineCount) {
  return (
    lineCount * SCORE_PER_LINE +
    Math.max(0, lineCount - 1) * MULTI_LINE_BONUS_PER_EXTRA
  );
}

function hasAnyMoves(currentBoard, activePieces) {
  return activePieces.some((piece) => !piece.used && hasPlacement(currentBoard, piece.cells));
}

function generateBatch(currentBoard) {
  const placeableShapes = analyzeShapeAvailability(currentBoard);
  if (placeableShapes.length === 0) {
    return [];
  }

  let fallbackShapes = null;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = buildBatchCandidate(placeableShapes, currentBoard);
    if (!fallbackShapes) {
      fallbackShapes = candidate;
    }

    if (isBatchSolvable(currentBoard, candidate)) {
      return candidate.map((shape) => ({
        id: nextPieceId(),
        used: false,
        cells: shape.cells
      }));
    }
  }

  return fallbackShapes.map((shape) => ({
    id: nextPieceId(),
    used: false,
    cells: shape.cells
  }));
}

function buildBatchCandidate(placeableShapes, currentBoard) {
  const filled = currentBoard.reduce((acc, cell) => acc + cell, 0);
  const occupancy = filled / (BOARD_SIZE * BOARD_SIZE);
  const chosen = [];

  for (let slot = 0; slot < 3; slot += 1) {
    let pool = placeableShapes;
    if (slot === 0) {
      const clearFriendly = placeableShapes.filter((shape) => shape.clearPlacements > 0);
      if (clearFriendly.length > 0 && Math.random() < 0.65) {
        pool = clearFriendly;
      }
    }
    chosen.push(pickWeightedShape(pool, occupancy, chosen));
  }

  const hasLineFriendly = chosen.some((shape) => shape.clearPlacements > 0);
  const availableFriendly = placeableShapes.filter((shape) => shape.clearPlacements > 0);
  if (!hasLineFriendly && availableFriendly.length > 0) {
    chosen[0] = pickWeightedShape(availableFriendly, occupancy, []);
  }

  return chosen;
}

function pickWeightedShape(pool, occupancy, alreadyChosen) {
  const weights = pool.map((shape) => {
    const sizeScore = occupancy > 0.6 ? (6 - shape.cells.length) * 1.35 : (6 - shape.cells.length) * 0.65;
    const clearScore = shape.clearPlacements > 0 ? 2.5 : 0;
    const duplicateCount = alreadyChosen.filter((picked) => picked.id === shape.id).length;
    const duplicatePenalty = duplicateCount > 0 ? Math.pow(0.55, duplicateCount) : 1;

    const rawWeight = 1 + sizeScore + clearScore;
    return Math.max(0.1, rawWeight) * duplicatePenalty;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      return pool[i];
    }
  }

  return pool[pool.length - 1];
}

function analyzeShapeAvailability(currentBoard) {
  return SHAPES.map((shape) => {
    const placements = listPlacements(currentBoard, shape.cells);
    let clearPlacements = 0;
    for (let i = 0; i < placements.length; i += 1) {
      if (placements[i].clears > 0) {
        clearPlacements += 1;
      }
    }

    return {
      id: shape.id,
      cells: shape.cells,
      placements,
      clearPlacements
    };
  }).filter((shape) => shape.placements.length > 0);
}

function isBatchSolvable(currentBoard, batchShapes) {
  const cache = new Map();
  const remaining = [0, 1, 2];

  return depthFirstSolve(currentBoard, batchShapes, remaining, cache);
}

function depthFirstSolve(currentBoard, batchShapes, remaining, cache) {
  if (remaining.length === 0) {
    return true;
  }

  const key = `${currentBoard.join("")}:${remaining.join(",")}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  for (let i = 0; i < remaining.length; i += 1) {
    const pieceIndex = remaining[i];
    const shape = batchShapes[pieceIndex];
    const placements = listPlacements(currentBoard, shape.cells).sort(
      (a, b) => b.clears - a.clears
    );

    const limitedPlacements = placements.slice(0, 28);
    for (let j = 0; j < limitedPlacements.length; j += 1) {
      const placement = limitedPlacements[j];
      const { nextBoard } = simulatePlacement(
        currentBoard,
        shape.cells,
        placement.col,
        placement.row
      );

      const nextRemaining = remaining.filter((idx) => idx !== pieceIndex);
      if (depthFirstSolve(nextBoard, batchShapes, nextRemaining, cache)) {
        cache.set(key, true);
        return true;
      }
    }
  }

  cache.set(key, false);
  return false;
}

function createPieceElement(cells, cellSize, className) {
  const pieceEl = document.createElement("div");
  pieceEl.className = className;

  const bounds = getShapeBounds(cells);
  pieceEl.style.width = `${bounds.width * cellSize}px`;
  pieceEl.style.height = `${bounds.height * cellSize}px`;

  cells.forEach(([x, y]) => {
    const square = document.createElement("div");
    square.className = "piece-cell";
    square.style.width = `${cellSize - 2}px`;
    square.style.height = `${cellSize - 2}px`;
    square.style.left = `${x * cellSize}px`;
    square.style.top = `${y * cellSize}px`;
    pieceEl.appendChild(square);
  });

  return pieceEl;
}

function createEmptyBoard() {
  return new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
}

function toIndex(x, y) {
  return y * BOARD_SIZE + x;
}

function isInsideBoard(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getShapeBounds(cells) {
  let maxX = 0;
  let maxY = 0;

  cells.forEach(([x, y]) => {
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  });

  return { width: maxX + 1, height: maxY + 1 };
}

function hasPlacement(currentBoard, cells) {
  const bounds = getShapeBounds(cells);
  const maxCol = BOARD_SIZE - bounds.width;
  const maxRow = BOARD_SIZE - bounds.height;

  if (maxCol < 0 || maxRow < 0) {
    return false;
  }

  for (let row = 0; row <= maxRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      if (canPlace(currentBoard, cells, col, row)) {
        return true;
      }
    }
  }

  return false;
}

function listPlacements(currentBoard, cells) {
  const bounds = getShapeBounds(cells);
  const maxCol = BOARD_SIZE - bounds.width;
  const maxRow = BOARD_SIZE - bounds.height;
  const placements = [];

  if (maxCol < 0 || maxRow < 0) {
    return placements;
  }

  for (let row = 0; row <= maxRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      if (!canPlace(currentBoard, cells, col, row)) {
        continue;
      }

      const { lineCount } = simulatePlacement(currentBoard, cells, col, row);
      placements.push({
        col,
        row,
        clears: lineCount
      });
    }
  }

  return placements;
}

function canPlace(currentBoard, cells, col, row) {
  for (let i = 0; i < cells.length; i += 1) {
    const [dx, dy] = cells[i];
    const x = col + dx;
    const y = row + dy;

    if (!isInsideBoard(x, y)) {
      return false;
    }

    if (currentBoard[toIndex(x, y)] !== 0) {
      return false;
    }
  }

  return true;
}

function simulatePlacement(currentBoard, cells, col, row) {
  const nextBoard = currentBoard.slice();

  for (let i = 0; i < cells.length; i += 1) {
    const [dx, dy] = cells[i];
    const x = col + dx;
    const y = row + dy;
    nextBoard[toIndex(x, y)] = 1;
  }

  const completed = getCompletedLines(nextBoard);
  const lineCount = completed.rows.length + completed.cols.length;

  if (lineCount > 0) {
    clearLines(nextBoard, completed.rows, completed.cols);
  }

  return { nextBoard, completed, lineCount };
}

function getCompletedLines(currentBoard) {
  const rows = [];
  const cols = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    let full = true;
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (currentBoard[toIndex(x, y)] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      rows.push(y);
    }
  }

  for (let x = 0; x < BOARD_SIZE; x += 1) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      if (currentBoard[toIndex(x, y)] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      cols.push(x);
    }
  }

  return { rows, cols };
}

function clearLines(currentBoard, rows, cols) {
  rows.forEach((y) => {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      currentBoard[toIndex(x, y)] = 0;
    }
  });

  cols.forEach((x) => {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      currentBoard[toIndex(x, y)] = 0;
    }
  });
}

function getBoardCellSize() {
  return boardEl.getBoundingClientRect().width / BOARD_SIZE;
}

function loadBestScore() {
  const value = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function saveBestScore(value) {
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

function nextPieceId() {
  pieceIdCounter += 1;
  return `piece-${pieceIdCounter}`;
}
