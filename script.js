const BOARD_SIZE = 8;
const TRAY_CELL_SIZE = 22;
const SHAPE_BANK_CELL_SIZE = 13;
const STORAGE_KEY = "block-blast-mvp-best-score";
const GENERATOR_CLEARS_STORAGE_KEY = "block-blast-mvp-generator-clears";
const SHAPE_BANK_STORAGE_KEY = "block-blast-mvp-shape-bank-disabled";
const DESIGNATED_SPOT_STORAGE_KEY = "block-blast-mvp-designated-spot";
const PERFECT_FIT_SETTINGS_STORAGE_KEY = "block-blast-mvp-perfect-fit-settings";
const SCORE_PER_LINE = 100;
const MULTI_LINE_BONUS_PER_EXTRA = 50;
const BATCH_SIZE = 3;
const DEFAULT_PERFECT_FIT_CHANCE = 0.5;
const DEFAULT_MIN_PERFECT_FIT_PERCENTAGE = 0.7;
const DEFAULT_MIN_CELLS_FILLED_PERCENTAGE = 0.3;

const SHAPES = [
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
].map((shape) => {
  const perimeterEdges = calculatePerimeterEdges(shape.cells);
  return {
    ...shape,
    localCellLookup: new Set(shape.cells.map(([x, y]) => `${x},${y}`)),
    perimeterEdges,
    score: perimeterEdges + shape.cells.length
  };
});
const SHAPE_ID_BY_KEY = new Map(
  SHAPES.map((shape) => [shapeCellsKey(shape.cells), shape.id])
);

const boardEl = document.getElementById("board");
const trayEl = document.getElementById("tray");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const plannerClearsToggleEl = document.getElementById("planner-clears-toggle");
const designatedSpotToggleEl = document.getElementById("designated-spot-toggle");
const perfectFitChanceInputEl = document.getElementById("perfect-fit-chance-input");
const minPerfectFitInputEl = document.getElementById("min-perfect-fit-input");
const minCellsFilledInputEl = document.getElementById("min-cells-filled-input");
const shapeBankBtnEl = document.getElementById("shape-bank-btn");
const shapeBankModalEl = document.getElementById("shape-bank-modal");
const shapeBankCloseBtnEl = document.getElementById("shape-bank-close-btn");
const shapeBankGridEl = document.getElementById("shape-bank-grid");
const restartBtn = document.getElementById("restart-btn");
const overlayEl = document.getElementById("overlay");
const finalScoreTextEl = document.getElementById("final-score-text");
const playAgainBtn = document.getElementById("play-again-btn");

let board = createEmptyBoard();
let boardCells = [];
let pieces = [];
let score = 0;
let bestScore = loadBestScore();
let generationConfig = {
  simulateLineClearsBetweenPicks: loadGenerationClearsSetting(),
  showDesignatedSpotOnHover: loadDesignatedSpotSetting(),
  ...loadPerfectFitSettings()
};
let disabledShapeIds = loadDisabledShapeIds();
let pieceIdCounter = 0;
let isGameOver = false;
let dragState = null;
let hoveredPieceId = null;

init();

function init() {
  buildBoardUi();
  bindControls();
  startNewGame();
}

function bindControls() {
  restartBtn.addEventListener("click", startNewGame);
  playAgainBtn.addEventListener("click", startNewGame);

  plannerClearsToggleEl.checked = generationConfig.simulateLineClearsBetweenPicks;
  plannerClearsToggleEl.addEventListener("change", () => {
    generationConfig.simulateLineClearsBetweenPicks = plannerClearsToggleEl.checked;
    saveGenerationClearsSetting(generationConfig.simulateLineClearsBetweenPicks);
  });
  designatedSpotToggleEl.checked = generationConfig.showDesignatedSpotOnHover;
  designatedSpotToggleEl.addEventListener("change", () => {
    generationConfig.showDesignatedSpotOnHover = designatedSpotToggleEl.checked;
    saveDesignatedSpotSetting(generationConfig.showDesignatedSpotOnHover);
    if (!generationConfig.showDesignatedSpotOnHover) {
      hoveredPieceId = null;
    }
    renderBoard();
  });

  perfectFitChanceInputEl.value = String(generationConfig.perfectFitChance);
  minPerfectFitInputEl.value = String(generationConfig.minimumPerfectFitPercentage);
  minCellsFilledInputEl.value = String(generationConfig.minimumCellsFilledPercentage);

  perfectFitChanceInputEl.addEventListener("change", () => {
    generationConfig.perfectFitChance = parseDecimalSetting(
      perfectFitChanceInputEl.value,
      generationConfig.perfectFitChance
    );
    perfectFitChanceInputEl.value = formatDecimal(generationConfig.perfectFitChance);
    savePerfectFitSettings(generationConfig);
  });

  minPerfectFitInputEl.addEventListener("change", () => {
    generationConfig.minimumPerfectFitPercentage = parseDecimalSetting(
      minPerfectFitInputEl.value,
      generationConfig.minimumPerfectFitPercentage
    );
    minPerfectFitInputEl.value = formatDecimal(
      generationConfig.minimumPerfectFitPercentage
    );
    savePerfectFitSettings(generationConfig);
  });

  minCellsFilledInputEl.addEventListener("change", () => {
    generationConfig.minimumCellsFilledPercentage = parseDecimalSetting(
      minCellsFilledInputEl.value,
      generationConfig.minimumCellsFilledPercentage
    );
    minCellsFilledInputEl.value = formatDecimal(
      generationConfig.minimumCellsFilledPercentage
    );
    savePerfectFitSettings(generationConfig);
  });

  shapeBankBtnEl.addEventListener("click", openShapeBankModal);
  shapeBankCloseBtnEl.addEventListener("click", closeShapeBankModal);
  shapeBankModalEl.addEventListener("click", (event) => {
    if (event.target === shapeBankModalEl) {
      closeShapeBankModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !shapeBankModalEl.classList.contains("hidden")) {
      closeShapeBankModal();
    }
  });

  renderShapeBankPanel();
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
  hoveredPieceId = null;
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
  hoveredPieceId = null;
  finalScoreTextEl.textContent = `Final Score: ${score}`;
  overlayEl.classList.remove("hidden");
  render();
}

function spawnNewBatch() {
  hoveredPieceId = null;
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
  shapeBankBtnEl.textContent = `Shape Bank (${getEnabledShapes().length})`;
}

function renderBoard() {
  for (let i = 0; i < boardCells.length; i += 1) {
    const cell = boardCells[i];
    cell.className = "board-cell";
    if (board[i]) {
      cell.classList.add("occupied");
    }
  }

  if (!dragState && generationConfig.showDesignatedSpotOnHover) {
    renderDesignatedSpotHint();
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

function renderDesignatedSpotHint() {
  const piece = getHoveredPiece();
  if (!piece || !piece.designatedPlacement) {
    return;
  }

  const { col, row } = piece.designatedPlacement;
  for (let i = 0; i < piece.cells.length; i += 1) {
    const x = col + piece.cells[i][0];
    const y = row + piece.cells[i][1];
    if (!isInsideBoard(x, y)) {
      continue;
    }
    boardCells[toIndex(x, y)].classList.add("designated-hint");
  }
}

function openShapeBankModal() {
  renderShapeBankPanel();
  shapeBankModalEl.classList.remove("hidden");
}

function closeShapeBankModal() {
  shapeBankModalEl.classList.add("hidden");
}

function renderShapeBankPanel() {
  shapeBankGridEl.innerHTML = "";

  SHAPES.forEach((shape) => {
    const card = document.createElement("div");
    card.className = "shape-bank-item";

    const enabled = isShapeEnabled(shape.id);
    if (!enabled) {
      card.classList.add("off");
    }

    const topRow = document.createElement("div");
    topRow.className = "shape-bank-item-top";

    const nameEl = document.createElement("span");
    nameEl.className = "shape-bank-item-name";
    nameEl.textContent = shape.id;

    const toggleEl = document.createElement("input");
    toggleEl.className = "shape-bank-switch";
    toggleEl.type = "checkbox";
    toggleEl.checked = enabled;
    toggleEl.setAttribute("aria-label", `Toggle ${shape.id}`);
    toggleEl.addEventListener("change", () => {
      setShapeEnabled(shape.id, toggleEl.checked);
    });

    topRow.appendChild(nameEl);
    topRow.appendChild(toggleEl);

    const previewWrap = document.createElement("div");
    previewWrap.className = "shape-bank-preview-wrap";
    previewWrap.appendChild(
      createPieceElement(shape.cells, SHAPE_BANK_CELL_SIZE, "piece shape-bank-piece")
    );

    const scoreElLocal = document.createElement("div");
    scoreElLocal.className = "shape-bank-item-score";
    scoreElLocal.textContent = `Score: ${shape.score}`;

    card.appendChild(topRow);
    card.appendChild(previewWrap);
    card.appendChild(scoreElLocal);
    shapeBankGridEl.appendChild(card);
  });
}

function setShapeEnabled(shapeId, isEnabled) {
  hoveredPieceId = null;

  if (isEnabled) {
    disabledShapeIds.delete(shapeId);
  } else {
    disabledShapeIds.add(shapeId);
  }

  saveDisabledShapeIds(disabledShapeIds);
  syncCurrentTrayWithShapeBank();
  renderShapeBankPanel();
  render();
}

function syncCurrentTrayWithShapeBank() {
  if (pieces.length === 0) {
    return;
  }

  const hasDisabledVisiblePiece = pieces.some(
    (piece) => !piece.used && !isShapeEnabled(getPieceShapeId(piece))
  );

  if (!hasDisabledVisiblePiece) {
    return;
  }

  pieces = generateBatch(board);
  if (pieces.length === 0) {
    endGame();
    return;
  }

  if (!hasAnyMoves(board, pieces)) {
    endGame();
  }
}

function isShapeEnabled(shapeId) {
  return !disabledShapeIds.has(shapeId);
}

function getEnabledShapes() {
  return SHAPES.filter((shape) => isShapeEnabled(shape.id));
}

function getPieceShapeId(piece) {
  if (piece.shapeId) {
    return piece.shapeId;
  }
  return getShapeIdForCells(piece.cells);
}

function getShapeIdForCells(cells) {
  return SHAPE_ID_BY_KEY.get(shapeCellsKey(cells)) || "";
}

function getHoveredPiece() {
  if (!hoveredPieceId) {
    return null;
  }

  const piece = pieces.find((entry) => entry.id === hoveredPieceId);
  if (!piece || piece.used) {
    hoveredPieceId = null;
    return null;
  }

  return piece;
}

function setHoveredPiece(pieceId) {
  if (!generationConfig.showDesignatedSpotOnHover || dragState) {
    return;
  }
  if (hoveredPieceId === pieceId) {
    return;
  }
  hoveredPieceId = pieceId;
  renderBoard();
}

function clearHoveredPiece(pieceId) {
  if (!hoveredPieceId || hoveredPieceId !== pieceId) {
    return;
  }
  hoveredPieceId = null;
  renderBoard();
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

    const generationLabelEl = document.createElement("div");
    generationLabelEl.className = "piece-generation-label";
    if (piece.generationType === "perfect_fit") {
      generationLabelEl.classList.add("perfect");
      generationLabelEl.textContent = "Perfect Fit";
    } else {
      generationLabelEl.classList.add("weighted");
      generationLabelEl.textContent = "Weighted";
    }
    slot.appendChild(generationLabelEl);

    if (piece.generationType === "perfect_fit" && piece.perfectFitMetrics) {
      const detailEl = document.createElement("div");
      detailEl.className = "piece-generation-detail";
      detailEl.textContent =
        `${piece.perfectFitMetrics.touchingEdges}/${piece.perfectFitMetrics.totalEdges} • ` +
        `${piece.perfectFitMetrics.touchingBlockEdges}/${piece.perfectFitMetrics.totalEdges}`;
      slot.appendChild(detailEl);
    }

    if (!piece.used && !isGameOver) {
      slot.addEventListener("pointerenter", () => {
        setHoveredPiece(piece.id);
      });
      slot.addEventListener("pointerleave", () => {
        clearHoveredPiece(piece.id);
      });
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
  hoveredPieceId = null;

  const { cellSize } = getBoardMetrics();
  const dragCellSize = Math.max(28, cellSize - 8);
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
  const { cellSize, gap, paddingLeft, paddingTop, gridSize } = getBoardMetrics();
  const localX = clientX - boardRect.left - paddingLeft;
  const localY = clientY - boardRect.top - paddingTop;
  const pointerInGrid =
    localX >= 0 && localX <= gridSize && localY >= 0 && localY <= gridSize;

  if (!pointerInGrid) {
    dragState.valid = false;
    dragState.previewCells = [];
    dragState.previewLines = { rows: [], cols: [] };
    renderBoard();
    return;
  }

  const step = cellSize + gap;
  const col = Math.floor(localX / step) - dragState.anchor.x;
  const row = Math.floor(localY / step) - dragState.anchor.y;

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
  const enabledShapes = getEnabledShapes();
  if (enabledShapes.length === 0) {
    return [];
  }

  let bestAttempt = [];

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidate = generateBatchAttempt(currentBoard, enabledShapes);
    if (candidate.length === BATCH_SIZE) {
      return candidate.map((entry) => toGeneratedPiece(entry));
    }
    if (candidate.length > bestAttempt.length) {
      bestAttempt = candidate;
    }
  }

  if (bestAttempt.length > 0 && bestAttempt.length < BATCH_SIZE) {
    let planningBoard = applyGenerationEntries(currentBoard, bestAttempt);
    while (bestAttempt.length < BATCH_SIZE) {
      const placeableShapes = enabledShapes.filter((shape) =>
        hasPlacement(planningBoard, shape.cells)
      );
      if (placeableShapes.length === 0) {
        break;
      }

      const weightedSelection = pickWeightedGenerationOption(
        planningBoard,
        placeableShapes
      );
      if (!weightedSelection) {
        break;
      }

      bestAttempt.push(weightedSelection);
      planningBoard = applyGenerationPlacement(
        planningBoard,
        weightedSelection.shape.cells,
        weightedSelection.designatedPlacement.col,
        weightedSelection.designatedPlacement.row
      );
    }
  }

  return bestAttempt.map((entry) => toGeneratedPiece(entry));
}

function generateBatchAttempt(currentBoard, shapePool) {
  const selected = [];
  let planningBoard = currentBoard.slice();

  for (let slot = 0; slot < BATCH_SIZE; slot += 1) {
    const placeableShapes = shapePool.filter((shape) =>
      hasPlacement(planningBoard, shape.cells)
    );
    if (placeableShapes.length === 0) {
      break;
    }

    const chosenSelection = pickGenerationOption(
      planningBoard,
      placeableShapes
    );
    if (!chosenSelection) {
      break;
    }

    selected.push(chosenSelection);

    planningBoard = applyGenerationPlacement(
      planningBoard,
      chosenSelection.shape.cells,
      chosenSelection.designatedPlacement.col,
      chosenSelection.designatedPlacement.row
    );
  }

  return selected;
}

function toGeneratedPiece(entry) {
  return {
    id: nextPieceId(),
    shapeId: entry.shape.id,
    used: false,
    cells: entry.shape.cells,
    designatedPlacement: {
      col: entry.designatedPlacement.col,
      row: entry.designatedPlacement.row
    },
    generationType: entry.generationType,
    perfectFitMetrics: entry.perfectFitMetrics || null
  };
}

function applyGenerationEntries(startBoard, entries) {
  return entries.reduce((currentBoard, entry) => {
    return applyGenerationPlacement(
      currentBoard,
      entry.shape.cells,
      entry.designatedPlacement.col,
      entry.designatedPlacement.row
    );
  }, startBoard.slice());
}

function pickGenerationOption(currentBoard, placeableShapes) {
  const shouldTryPerfectFit =
    Math.random() < generationConfig.perfectFitChance;

  if (shouldTryPerfectFit) {
    const perfectFitSelection = pickPerfectFitGenerationOption(
      currentBoard,
      placeableShapes
    );
    if (perfectFitSelection) {
      return perfectFitSelection;
    }
  }

  return pickWeightedGenerationOption(currentBoard, placeableShapes);
}

function pickWeightedGenerationOption(currentBoard, placeableShapes) {
  const chosenShape = pickShapeByScoreWeight(placeableShapes);
  const designatedPlacement = findDesignatedPlacement(currentBoard, chosenShape);
  if (!designatedPlacement) {
    return null;
  }

  return {
    shape: chosenShape,
    designatedPlacement,
    generationType: "weighted",
    perfectFitMetrics: null
  };
}

function pickPerfectFitGenerationOption(currentBoard, placeableShapes) {
  const targetCorner = getBusiestQuadrantCorner(currentBoard);
  const shapeOptions = [];

  for (let i = 0; i < placeableShapes.length; i += 1) {
    const shape = placeableShapes[i];
    const perfectPlacements = findPerfectFitPlacements(
      currentBoard,
      shape,
      targetCorner
    );
    if (perfectPlacements.length > 0) {
      shapeOptions.push({ shape, perfectPlacements });
    }
  }

  if (shapeOptions.length === 0) {
    return null;
  }

  const chosenShape = pickShapeByScoreWeight(
    shapeOptions.map((option) => option.shape)
  );
  const chosenOption = shapeOptions.find(
    (option) => option.shape.id === chosenShape.id
  );
  if (!chosenOption) {
    return null;
  }

  const bestPlacement = chosenOption.perfectPlacements.reduce((best, current) => {
    if (!best) {
      return current;
    }
    return comparePerfectFitCandidates(current, best) < 0 ? current : best;
  }, null);

  if (!bestPlacement) {
    return null;
  }

  return {
    shape: chosenShape,
    designatedPlacement: {
      col: bestPlacement.col,
      row: bestPlacement.row
    },
    generationType: "perfect_fit",
    perfectFitMetrics: {
      perfectFitPercentage: bestPlacement.perfectFitPercentage,
      cellsFilledPercentage: bestPlacement.cellsFilledPercentage,
      touchingEdges: bestPlacement.touchingEdges,
      touchingBlockEdges: bestPlacement.touchingBlockEdges,
      totalEdges: bestPlacement.totalEdges
    }
  };
}

function findPerfectFitPlacements(currentBoard, shape, targetCorner) {
  const placements = listPlacements(currentBoard, shape.cells);
  const perfectPlacements = [];

  for (let i = 0; i < placements.length; i += 1) {
    const placement = placements[i];
    const fitMetrics = calculatePerfectFitMetrics(
      currentBoard,
      shape,
      placement.col,
      placement.row
    );
    if (!passesPerfectFitThresholds(fitMetrics)) {
      continue;
    }

    const { nextBoard, lineCount } = simulatePlacement(
      currentBoard,
      shape.cells,
      placement.col,
      placement.row
    );

    perfectPlacements.push({
      col: placement.col,
      row: placement.row,
      distance: getPlacementDistanceToCorner(
        shape.cells,
        placement.col,
        placement.row,
        targetCorner
      ),
      immediateClears: lineCount,
      occupiedAfterMove: countOccupied(nextBoard),
      ...fitMetrics
    });
  }

  return perfectPlacements;
}

function calculatePerfectFitMetrics(currentBoard, shape, col, row) {
  let touchingEdges = 0;
  let touchingBlockEdges = 0;
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let i = 0; i < shape.cells.length; i += 1) {
    const [x, y] = shape.cells[i];
    for (let j = 0; j < directions.length; j += 1) {
      const [dx, dy] = directions[j];
      const neighborKey = `${x + dx},${y + dy}`;
      if (shape.localCellLookup.has(neighborKey)) {
        continue;
      }

      const boardX = col + x + dx;
      const boardY = row + y + dy;
      if (!isInsideBoard(boardX, boardY)) {
        touchingEdges += 1;
        continue;
      }

      if (currentBoard[toIndex(boardX, boardY)] === 1) {
        touchingEdges += 1;
        touchingBlockEdges += 1;
      }
    }
  }

  const totalEdges = shape.perimeterEdges;
  return {
    touchingEdges,
    touchingBlockEdges,
    totalEdges,
    perfectFitPercentage: touchingEdges / totalEdges,
    cellsFilledPercentage: touchingBlockEdges / totalEdges
  };
}

function passesPerfectFitThresholds(metrics) {
  return (
    metrics.perfectFitPercentage >= generationConfig.minimumPerfectFitPercentage &&
    metrics.cellsFilledPercentage >= generationConfig.minimumCellsFilledPercentage
  );
}

function comparePerfectFitCandidates(a, b) {
  if (a.perfectFitPercentage !== b.perfectFitPercentage) {
    return b.perfectFitPercentage - a.perfectFitPercentage;
  }
  if (a.cellsFilledPercentage !== b.cellsFilledPercentage) {
    return b.cellsFilledPercentage - a.cellsFilledPercentage;
  }
  return comparePlacementCandidates(a, b);
}

function pickShapeByScoreWeight(pool) {
  const totalScore = pool.reduce((sum, shape) => sum + shape.score, 0);
  let roll = Math.random() * totalScore;

  for (let i = 0; i < pool.length; i += 1) {
    roll -= pool[i].score;
    if (roll <= 0) {
      return pool[i];
    }
  }

  return pool[pool.length - 1];
}

function findDesignatedPlacement(currentBoard, shape) {
  const placements = listPlacements(currentBoard, shape.cells);
  if (placements.length === 0) {
    return null;
  }

  const targetCorner = getBusiestQuadrantCorner(currentBoard);
  let bestPlacement = null;

  for (let i = 0; i < placements.length; i += 1) {
    const placement = placements[i];
    const { nextBoard, lineCount } = simulatePlacement(
      currentBoard,
      shape.cells,
      placement.col,
      placement.row
    );
    const candidate = {
      col: placement.col,
      row: placement.row,
      distance: getPlacementDistanceToCorner(
        shape.cells,
        placement.col,
        placement.row,
        targetCorner
      ),
      immediateClears: lineCount,
      occupiedAfterMove: countOccupied(nextBoard)
    };

    if (
      !bestPlacement ||
      comparePlacementCandidates(candidate, bestPlacement) < 0
    ) {
      bestPlacement = candidate;
    }
  }

  return bestPlacement;
}

function comparePlacementCandidates(a, b) {
  if (a.distance !== b.distance) {
    return a.distance - b.distance;
  }
  if (a.immediateClears !== b.immediateClears) {
    return b.immediateClears - a.immediateClears;
  }
  if (a.occupiedAfterMove !== b.occupiedAfterMove) {
    return a.occupiedAfterMove - b.occupiedAfterMove;
  }
  if (a.row !== b.row) {
    return a.row - b.row;
  }
  return a.col - b.col;
}

function getPlacementDistanceToCorner(cells, col, row, corner) {
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < cells.length; i += 1) {
    const x = col + cells[i][0];
    const y = row + cells[i][1];
    const distance = Math.abs(x - corner.x) + Math.abs(y - corner.y);
    if (distance < bestDistance) {
      bestDistance = distance;
    }
  }

  return bestDistance;
}

function countOccupied(currentBoard) {
  return currentBoard.reduce((sum, cell) => sum + cell, 0);
}

function getBusiestQuadrantCorner(currentBoard) {
  const quadrants = [
    {
      id: "top-left",
      count: countBlocksInQuadrant(currentBoard, 0, 3, 0, 3),
      corner: { x: 0, y: 0 }
    },
    {
      id: "top-right",
      count: countBlocksInQuadrant(currentBoard, 4, 7, 0, 3),
      corner: { x: 7, y: 0 }
    },
    {
      id: "bottom-left",
      count: countBlocksInQuadrant(currentBoard, 0, 3, 4, 7),
      corner: { x: 0, y: 7 }
    },
    {
      id: "bottom-right",
      count: countBlocksInQuadrant(currentBoard, 4, 7, 4, 7),
      corner: { x: 7, y: 7 }
    }
  ];

  let maxCount = quadrants[0].count;
  for (let i = 1; i < quadrants.length; i += 1) {
    if (quadrants[i].count > maxCount) {
      maxCount = quadrants[i].count;
    }
  }

  const busiest = quadrants.filter((quadrant) => quadrant.count === maxCount);
  const pick = busiest[Math.floor(Math.random() * busiest.length)];
  return pick.corner;
}

function countBlocksInQuadrant(currentBoard, minX, maxX, minY, maxY) {
  let count = 0;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      count += currentBoard[toIndex(x, y)];
    }
  }
  return count;
}

function applyGenerationPlacement(currentBoard, cells, col, row) {
  if (generationConfig.simulateLineClearsBetweenPicks) {
    return simulatePlacement(currentBoard, cells, col, row).nextBoard;
  }

  const nextBoard = currentBoard.slice();
  for (let i = 0; i < cells.length; i += 1) {
    const [dx, dy] = cells[i];
    nextBoard[toIndex(col + dx, row + dy)] = 1;
  }
  return nextBoard;
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

function shapeCellsKey(cells) {
  return cells
    .slice()
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([x, y]) => `${x},${y}`)
    .join("|");
}

function calculatePerimeterEdges(cells) {
  let perimeterEdges = 0;
  const lookup = new Set(cells.map(([x, y]) => `${x},${y}`));
  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let i = 0; i < cells.length; i += 1) {
    const [x, y] = cells[i];
    for (let j = 0; j < neighbors.length; j += 1) {
      const nx = x + neighbors[j][0];
      const ny = y + neighbors[j][1];
      if (!lookup.has(`${nx},${ny}`)) {
        perimeterEdges += 1;
      }
    }
  }

  return perimeterEdges;
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

function getBoardMetrics() {
  const style = window.getComputedStyle(boardEl);
  const cellSize = Number.parseFloat(style.getPropertyValue("--cell-size")) || 0;
  const gap = Number.parseFloat(style.getPropertyValue("--cell-gap")) || 0;

  return {
    cellSize,
    gap,
    paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
    paddingTop: Number.parseFloat(style.paddingTop) || 0,
    gridSize: BOARD_SIZE * cellSize + (BOARD_SIZE - 1) * gap
  };
}

function loadBestScore() {
  const value = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function loadGenerationClearsSetting() {
  const stored = window.localStorage.getItem(GENERATOR_CLEARS_STORAGE_KEY);
  if (stored === null) {
    return true;
  }
  return stored === "1";
}

function loadDesignatedSpotSetting() {
  const stored = window.localStorage.getItem(DESIGNATED_SPOT_STORAGE_KEY);
  if (stored === null) {
    return true;
  }
  return stored === "1";
}

function loadPerfectFitSettings() {
  const defaults = {
    perfectFitChance: DEFAULT_PERFECT_FIT_CHANCE,
    minimumPerfectFitPercentage: DEFAULT_MIN_PERFECT_FIT_PERCENTAGE,
    minimumCellsFilledPercentage: DEFAULT_MIN_CELLS_FILLED_PERCENTAGE
  };

  const raw = window.localStorage.getItem(PERFECT_FIT_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      perfectFitChance: parseDecimalSetting(
        parsed?.perfectFitChance,
        defaults.perfectFitChance
      ),
      minimumPerfectFitPercentage: parseDecimalSetting(
        parsed?.minimumPerfectFitPercentage,
        defaults.minimumPerfectFitPercentage
      ),
      minimumCellsFilledPercentage: parseDecimalSetting(
        parsed?.minimumCellsFilledPercentage,
        defaults.minimumCellsFilledPercentage
      )
    };
  } catch (_) {
    return defaults;
  }
}

function loadDisabledShapeIds() {
  const raw = window.localStorage.getItem(SHAPE_BANK_STORAGE_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    const validIds = new Set(SHAPES.map((shape) => shape.id));
    return new Set(parsed.filter((id) => validIds.has(id)));
  } catch (_) {
    return new Set();
  }
}

function saveBestScore(value) {
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

function saveGenerationClearsSetting(isEnabled) {
  window.localStorage.setItem(
    GENERATOR_CLEARS_STORAGE_KEY,
    isEnabled ? "1" : "0"
  );
}

function saveDesignatedSpotSetting(isEnabled) {
  window.localStorage.setItem(
    DESIGNATED_SPOT_STORAGE_KEY,
    isEnabled ? "1" : "0"
  );
}

function savePerfectFitSettings(config) {
  window.localStorage.setItem(
    PERFECT_FIT_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      perfectFitChance: config.perfectFitChance,
      minimumPerfectFitPercentage: config.minimumPerfectFitPercentage,
      minimumCellsFilledPercentage: config.minimumCellsFilledPercentage
    })
  );
}

function saveDisabledShapeIds(shapeIdSet) {
  window.localStorage.setItem(
    SHAPE_BANK_STORAGE_KEY,
    JSON.stringify([...shapeIdSet])
  );
}

function parseDecimalSetting(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, parsed));
}

function formatDecimal(value) {
  const rounded = Math.round(value * 100) / 100;
  return String(Number(rounded.toFixed(2)));
}

function nextPieceId() {
  pieceIdCounter += 1;
  return `piece-${pieceIdCounter}`;
}
