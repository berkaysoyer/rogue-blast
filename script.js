const BOARD_SIZE = 8;
const TRAY_CELL_SIZE = 22;
const SHAPE_BANK_CELL_SIZE = 13;
const STORAGE_KEY = "block-blast-mvp-best-score";
const GENERATOR_CLEARS_STORAGE_KEY = "block-blast-mvp-generator-clears";
const SHAPE_BANK_STORAGE_KEY = "block-blast-mvp-shape-bank-disabled";
const DESIGNATED_SPOT_STORAGE_KEY = "block-blast-mvp-designated-spot";
const PERFECT_FIT_SETTINGS_STORAGE_KEY = "block-blast-mvp-perfect-fit-settings";
const TOKEN_SETTINGS_STORAGE_KEY = "block-blast-mvp-token-settings";
const SCORE_PER_LINE = 100;
const MULTI_LINE_BONUS_PER_EXTRA = 50;
const BATCH_SIZE = 3;
const DEFAULT_PERFECT_FIT_CHANCE = 0.5;
const DEFAULT_MIN_PERFECT_FIT_PERCENTAGE = 0.7;
const DEFAULT_MIN_CELLS_FILLED_PERCENTAGE = 0.3;
const LOW_OCCUPANCY_THRESHOLD = 0.28;
const LOW_OCCUPANCY_MAX_BOOST = 2.3;
const VERY_LOW_OCCUPANCY_THRESHOLD = 0.1;
const LARGE_SHAPE_MIN_CELLS = 6;
const VERY_LOW_OCCUPANCY_LARGE_SHAPE_BOOST = 2.2;
const DEFAULT_TOKEN_SPAWN_CHANCE = 0.2;
const INITIAL_MILESTONE_TARGET = 3;
const MILESTONE_STEP = 2;

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
  { id: "rect2x3", cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  { id: "rect3x2", cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "square3", cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
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

const PERK_DEFINITIONS = [
  { id: "pf_plus_5", name: "Perfect Fit +5%", desc: "+5% chance", icon: "💎", stars: 0 },
  { id: "pf_plus_10", name: "Perfect Fit +10%", desc: "+10% chance", icon: "✨", stars: 3 },
  { id: "flip_plus_1", name: "Flip +1", desc: "Flip it!", icon: "↔️", stars: 0 },
  { id: "flip_plus_2", name: "Flip +2", desc: "Flip it more!", icon: "🔁", stars: 0 },
  { id: "perfect_combo", name: "Perfect Combo", desc: "10 combo grants perfect fit", icon: "🎯", stars: 3 },
  { id: "tnt_combo", name: "TNT Combo", desc: "15 combo grants TNT", icon: "💥", stars: 3 },
  { id: "area_row", name: "Area +1 Row", desc: "Board area increase", icon: "⬇️", stars: 0 },
  { id: "area_col", name: "Area +1 Col", desc: "Board area increase", icon: "➡️", stars: 0 },
  { id: "daily_reshuffle", name: "Daily Reshuffle", desc: "1 free reshuffle daily", icon: "🎲", stars: 0 },
  { id: "gems_plus_5", name: "Gems +5%", desc: "Higher gem chance", icon: "💠", stars: 0 },
  { id: "gems_plus_10", name: "Gems +10%", desc: "Bigger gem chance", icon: "💍", stars: 0 },
  { id: "perfect_helper", name: "Perfect Fit Helper", desc: "Shows perfect spot", icon: "🧭", stars: 0 },
  { id: "undo_plus_1", name: "Undo +1", desc: "Gain one undo", icon: "⏪", stars: 3 }
];

const boardEl = document.getElementById("board");
const clearOutlineEl = document.getElementById("clear-outline");
const effectsLayerEl = document.getElementById("effects-layer");
const trayEl = document.getElementById("tray");
const tokenProgressTextEl = document.getElementById("token-progress-text");
const tokenProgressFillEl = document.getElementById("token-progress-fill");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const plannerClearsToggleEl = document.getElementById("planner-clears-toggle");
const designatedSpotToggleEl = document.getElementById("designated-spot-toggle");
const perfectFitCurrentViewToggleEl = document.getElementById(
  "perfect-fit-current-view-toggle"
);
const tokenChanceInputEl = document.getElementById("token-chance-input");
const perfectFitChanceInputEl = document.getElementById("perfect-fit-chance-input");
const minPerfectFitInputEl = document.getElementById("min-perfect-fit-input");
const minCellsFilledInputEl = document.getElementById("min-cells-filled-input");
const shapeBankBtnEl = document.getElementById("shape-bank-btn");
const shapeBankModalEl = document.getElementById("shape-bank-modal");
const shapeBankCloseBtnEl = document.getElementById("shape-bank-close-btn");
const shapeBankGridEl = document.getElementById("shape-bank-grid");
const perkOverlayEl = document.getElementById("perk-overlay");
const perkOptionsEl = document.getElementById("perk-options");
const perkReshuffleBtnEl = document.getElementById("perk-reshuffle-btn");
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
  tokenSpawnChance: loadTokenSpawnChance(),
  ...loadPerfectFitSettings()
};
let disabledShapeIds = loadDisabledShapeIds();
let pieceIdCounter = 0;
let isGameOver = false;
let dragState = null;
let hoveredPieceId = null;
let tokenBlockIndices = new Set();
let totalTokensCollected = 0;
let previousMilestoneTarget = 0;
let nextMilestoneTarget = INITIAL_MILESTONE_TARGET;
let pendingPerkSelections = 0;
let isPerkOverlayOpen = false;
let availablePerks = buildInitialPerkPool();
let selectedPerks = [];
let currentPerkChoices = [];

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
  perfectFitCurrentViewToggleEl.checked =
    generationConfig.perfectFitUseCurrentBoardView;
  perfectFitCurrentViewToggleEl.addEventListener("change", () => {
    generationConfig.perfectFitUseCurrentBoardView =
      perfectFitCurrentViewToggleEl.checked;
    savePerfectFitSettings(generationConfig);
  });

  tokenChanceInputEl.value = String(generationConfig.tokenSpawnChance);
  perfectFitChanceInputEl.value = String(generationConfig.perfectFitChance);
  minPerfectFitInputEl.value = String(generationConfig.minimumPerfectFitPercentage);
  minCellsFilledInputEl.value = String(generationConfig.minimumCellsFilledPercentage);

  tokenChanceInputEl.addEventListener("change", () => {
    generationConfig.tokenSpawnChance = parseDecimalSetting(
      tokenChanceInputEl.value,
      generationConfig.tokenSpawnChance
    );
    tokenChanceInputEl.value = formatDecimal(generationConfig.tokenSpawnChance);
    saveTokenSpawnChance(generationConfig.tokenSpawnChance);
  });

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
  perkReshuffleBtnEl.addEventListener("click", reshufflePerkChoices);

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
  hideClearOutline();
  effectsLayerEl.innerHTML = "";

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i += 1) {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    boardCells.push(cell);
    boardEl.appendChild(cell);
  }
}

function startNewGame() {
  stopDrag();
  effectsLayerEl.innerHTML = "";
  hideClearOutline();
  hoveredPieceId = null;
  closePerkOverlay();
  tokenBlockIndices = new Set();
  totalTokensCollected = 0;
  previousMilestoneTarget = 0;
  nextMilestoneTarget = INITIAL_MILESTONE_TARGET;
  pendingPerkSelections = 0;
  availablePerks = buildInitialPerkPool();
  selectedPerks = [];
  currentPerkChoices = [];
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
  closePerkOverlay();
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

  maybeAssignTokenToShapeBank();

  if (!hasAnyMoves(board, pieces)) {
    endGame();
    return;
  }

  maybeOpenPerkOverlayIfNeeded();
}

function render() {
  renderBoard();
  renderTray();
  renderScore();
  renderTokenProgress();
}

function renderScore() {
  scoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);
  shapeBankBtnEl.textContent = `Shape Bank (${getEnabledShapes().length})`;
}

function renderTokenProgress() {
  const stepSize = Math.max(1, nextMilestoneTarget - previousMilestoneTarget);
  const currentStepProgress = Math.max(
    0,
    totalTokensCollected - previousMilestoneTarget
  );
  const fillPercent = Math.min(1, currentStepProgress / stepSize) * 100;
  tokenProgressTextEl.textContent = `${currentStepProgress} / ${stepSize}`;
  tokenProgressFillEl.style.width = `${fillPercent.toFixed(2)}%`;
}

function renderBoard() {
  hideClearOutline();

  for (let i = 0; i < boardCells.length; i += 1) {
    const cell = boardCells[i];
    cell.className = "board-cell";
    if (board[i]) {
      cell.classList.add("occupied");
      if (tokenBlockIndices.has(i)) {
        cell.classList.add("token-block");
      }
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
    const clearCells = getCellsForCompletedLines(rows, cols);

    clearCells.forEach((cell) => {
      boardCells[toIndex(cell.x, cell.y)].classList.add("clear-hint", "clear-flash");
    });

    if (clearCells.length > 0) {
      renderClearOutline(clearCells);
    }
  }

  dragState.previewCells.forEach((cell) => {
    if (!isInsideBoard(cell.x, cell.y)) {
      return;
    }
    boardCells[toIndex(cell.x, cell.y)].classList.add("preview-valid");
  });
}

function getCellsForCompletedLines(rowsSet, colsSet) {
  const seen = new Set();
  const cells = [];

  rowsSet.forEach((row) => {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const key = `${x},${row}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      cells.push({ x, y: row });
    }
  });

  colsSet.forEach((col) => {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      const key = `${col},${y}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      cells.push({ x: col, y });
    }
  });

  return cells;
}

function renderClearOutline(clearCells) {
  if (clearCells.length === 0) {
    hideClearOutline();
    return;
  }

  let minX = clearCells[0].x;
  let maxX = clearCells[0].x;
  let minY = clearCells[0].y;
  let maxY = clearCells[0].y;

  for (let i = 1; i < clearCells.length; i += 1) {
    const cell = clearCells[i];
    if (cell.x < minX) minX = cell.x;
    if (cell.x > maxX) maxX = cell.x;
    if (cell.y < minY) minY = cell.y;
    if (cell.y > maxY) maxY = cell.y;
  }

  const metrics = getBoardMetrics();
  const left = metrics.borderLeft + metrics.paddingLeft + minX * metrics.step;
  const top = metrics.borderTop + metrics.paddingTop + minY * metrics.step;
  const width = (maxX - minX + 1) * metrics.cellSize + (maxX - minX) * metrics.gap;
  const height = (maxY - minY + 1) * metrics.cellSize + (maxY - minY) * metrics.gap;

  clearOutlineEl.style.left = `${left - 2}px`;
  clearOutlineEl.style.top = `${top - 2}px`;
  clearOutlineEl.style.width = `${width + 4}px`;
  clearOutlineEl.style.height = `${height + 4}px`;
  clearOutlineEl.classList.remove("hidden");
}

function hideClearOutline() {
  clearOutlineEl.classList.add("hidden");
}

function spawnClearDebris(clearedCells) {
  if (!clearedCells || clearedCells.length === 0) {
    return;
  }

  const metrics = getBoardMetrics();
  const fragmentCountPerBlock = 4;

  for (let i = 0; i < clearedCells.length; i += 1) {
    const cell = clearedCells[i];
    const cellLeft =
      metrics.borderLeft + metrics.paddingLeft + cell.x * metrics.step;
    const cellTop =
      metrics.borderTop + metrics.paddingTop + cell.y * metrics.step;

    for (let f = 0; f < fragmentCountPerBlock; f += 1) {
      const particle = document.createElement("div");
      const duration = randomRange(0.4, 1.0);
      const startX = cellLeft + randomRange(3, Math.max(4, metrics.cellSize - 10));
      const startY = cellTop + randomRange(3, Math.max(4, metrics.cellSize - 10));
      const driftX = randomRange(-22, 22);
      const dropY = randomRange(26, 96);

      particle.className = "debris";
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.setProperty("--drift-x", `${driftX}px`);
      particle.style.setProperty("--drop-y", `${dropY}px`);
      particle.style.setProperty("--debris-duration", `${duration.toFixed(3)}s`);
      particle.style.setProperty(
        "--spin-start",
        `${Math.round(randomRange(-28, 28))}deg`
      );
      particle.style.setProperty(
        "--spin-end",
        `${Math.round(randomRange(110, 340))}deg`
      );

      effectsLayerEl.appendChild(particle);
      window.setTimeout(() => {
        particle.remove();
      }, Math.ceil(duration * 1000) + 80);
    }
  }
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
  maybeAssignTokenToShapeBank();

  if (!hasAnyMoves(board, pieces)) {
    endGame();
    return;
  }

  maybeOpenPerkOverlayIfNeeded();
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

    const pieceEl = createPieceElement(
      piece.cells,
      TRAY_CELL_SIZE,
      "piece",
      TRAY_CELL_SIZE,
      piece.tokenCell || null
    );
    slot.appendChild(pieceEl);

    const generationLabelEl = document.createElement("div");
    generationLabelEl.className = "piece-generation-label";
    if (piece.generationType === "perfect_fit") {
      generationLabelEl.classList.add("perfect");
      generationLabelEl.textContent = "Perfect Fit";
    } else if (piece.generationType === "perfect_fit_simulated") {
      generationLabelEl.classList.add("perfect");
      generationLabelEl.textContent = "Perfect Fit (Simulated)";
    } else {
      generationLabelEl.classList.add("weighted");
      generationLabelEl.textContent = "Weighted";
    }
    slot.appendChild(generationLabelEl);

    if (
      (piece.generationType === "perfect_fit" ||
        piece.generationType === "perfect_fit_simulated") &&
      piece.perfectFitMetrics
    ) {
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
      pieceEl.addEventListener("pointerdown", (event) => {
        beginDrag(event, piece, pieceEl);
      });
    }

    trayEl.appendChild(slot);
  });
}

function beginDrag(event, piece, sourcePieceEl) {
  if (isGameOver || isPerkOverlayOpen || piece.used || dragState) {
    return;
  }

  event.preventDefault();
  hoveredPieceId = null;

  const { cellSize, step } = getBoardMetrics();
  const dragCellSize = cellSize;
  const bounds = getShapeBounds(piece.cells);
  const avatarWidth = (bounds.width - 1) * step + dragCellSize;
  const avatarHeight = (bounds.height - 1) * step + dragCellSize;
  const sourceRect = sourcePieceEl.getBoundingClientRect();
  const sourceOffsetX = event.clientX - sourceRect.left;
  const sourceOffsetY = event.clientY - sourceRect.top;
  const scaleX = sourceRect.width > 0 ? avatarWidth / sourceRect.width : 1;
  const scaleY = sourceRect.height > 0 ? avatarHeight / sourceRect.height : 1;
  const grabOffsetX = Math.max(0, Math.min(avatarWidth, sourceOffsetX * scaleX));
  const grabOffsetY = Math.max(0, Math.min(avatarHeight, sourceOffsetY * scaleY));

  const avatar = document.createElement("div");
  avatar.className = "drag-avatar";
  avatar.appendChild(
    createPieceElement(piece.cells, dragCellSize, "piece", step, piece.tokenCell || null)
  );
  document.body.appendChild(avatar);

  dragState = {
    pointerId: event.pointerId,
    pieceId: piece.id,
    pieceCells: piece.cells,
    avatar,
    grabOffsetX,
    grabOffsetY,
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

  // Snap once more at release point so drop matches shown shadow.
  updateDragPosition(event.clientX, event.clientY);

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

  const avatarLeft = clientX - dragState.grabOffsetX;
  const avatarTop = clientY - dragState.grabOffsetY;
  dragState.avatar.style.transform = `translate(${avatarLeft}px, ${avatarTop}px)`;

  const boardRect = boardEl.getBoundingClientRect();
  const { cellSize, gap, paddingLeft, paddingTop, borderLeft, borderTop } =
    getBoardMetrics();
  const step = cellSize + gap;
  const localLeft = avatarLeft - boardRect.left - borderLeft - paddingLeft;
  const localTop = avatarTop - boardRect.top - borderTop - paddingTop;
  const col = Math.round(localLeft / step);
  const row = Math.round(localTop / step);

  dragState.col = col;
  dragState.row = row;

  const absoluteCells = dragState.pieceCells.map(([dx, dy]) => ({
    x: col + dx,
    y: row + dy
  }));

  const fits = canPlace(board, dragState.pieceCells, col, row);
  dragState.valid = fits;
  dragState.previewCells = fits
    ? absoluteCells.filter((cell) => isInsideBoard(cell.x, cell.y))
    : [];

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

  const { nextBoard, lineCount, clearedCells } = simulatePlacement(
    board,
    piece.cells,
    dragState.col,
    dragState.row
  );

  board = nextBoard;
  piece.used = true;

  if (piece.tokenCell) {
    const tokenBoardIndex = toIndex(
      dragState.col + piece.tokenCell[0],
      dragState.row + piece.tokenCell[1]
    );
    tokenBlockIndices.add(tokenBoardIndex);
  }

  const collectedTokens = collectTokensFromClearedCells(clearedCells);

  if (lineCount > 0) {
    spawnClearDebris(clearedCells);
    score += calculateLineScore(lineCount);
  }

  if (collectedTokens > 0) {
    registerCollectedTokens(collectedTokens);
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
    return;
  }

  maybeOpenPerkOverlayIfNeeded();
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

function maybeAssignTokenToShapeBank() {
  for (let i = 0; i < pieces.length; i += 1) {
    pieces[i].tokenCell = null;
  }

  if (Math.random() >= generationConfig.tokenSpawnChance) {
    return;
  }

  const piece = pieces[Math.floor(Math.random() * pieces.length)];
  if (!piece || piece.cells.length === 0) {
    return;
  }

  const tokenCell = piece.cells[Math.floor(Math.random() * piece.cells.length)];
  piece.tokenCell = [tokenCell[0], tokenCell[1]];
}

function collectTokensFromClearedCells(clearedCells) {
  let collected = 0;
  for (let i = 0; i < clearedCells.length; i += 1) {
    const index = toIndex(clearedCells[i].x, clearedCells[i].y);
    if (tokenBlockIndices.delete(index)) {
      collected += 1;
    }
  }
  return collected;
}

function registerCollectedTokens(amount) {
  totalTokensCollected += amount;

  while (totalTokensCollected >= nextMilestoneTarget) {
    pendingPerkSelections += 1;
    previousMilestoneTarget = nextMilestoneTarget;
    nextMilestoneTarget += MILESTONE_STEP;
  }
}

function buildInitialPerkPool() {
  return PERK_DEFINITIONS.map((perk) => ({ ...perk }));
}

function maybeOpenPerkOverlayIfNeeded() {
  if (isGameOver || isPerkOverlayOpen || pendingPerkSelections <= 0) {
    return;
  }

  if (availablePerks.length === 0) {
    pendingPerkSelections = 0;
    return;
  }

  currentPerkChoices = drawPerkChoices();
  if (currentPerkChoices.length === 0) {
    pendingPerkSelections = 0;
    return;
  }

  isPerkOverlayOpen = true;
  perkOverlayEl.classList.remove("hidden");
  renderPerkChoices();
}

function closePerkOverlay() {
  isPerkOverlayOpen = false;
  perkOverlayEl.classList.add("hidden");
}

function drawPerkChoices() {
  const pool = availablePerks.slice();
  shuffleInPlace(pool);
  return pool.slice(0, Math.min(3, pool.length));
}

function renderPerkChoices() {
  perkOptionsEl.innerHTML = "";

  currentPerkChoices.forEach((perk) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "perk-card";

    const icon = document.createElement("div");
    icon.className = "perk-icon";
    icon.textContent = perk.icon;

    const info = document.createElement("div");
    info.className = "perk-info";
    const name = document.createElement("div");
    name.className = "perk-name";
    name.textContent = perk.name;
    const desc = document.createElement("div");
    desc.className = "perk-desc";
    desc.textContent = perk.desc;
    info.appendChild(name);
    info.appendChild(desc);

    const stars = document.createElement("div");
    stars.className = "perk-stars";
    stars.textContent = perk.stars >= 3 ? "★★★" : "";

    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(stars);
    card.addEventListener("click", () => {
      selectPerk(perk.id);
    });
    perkOptionsEl.appendChild(card);
  });
}

function selectPerk(perkId) {
  const picked = currentPerkChoices.find((perk) => perk.id === perkId);
  if (!picked) {
    return;
  }

  selectedPerks.push(picked);
  availablePerks = availablePerks.filter((perk) => perk.id !== perkId);
  pendingPerkSelections = Math.max(0, pendingPerkSelections - 1);
  closePerkOverlay();

  if (pendingPerkSelections > 0) {
    maybeOpenPerkOverlayIfNeeded();
  }
}

function reshufflePerkChoices() {
  if (!isPerkOverlayOpen) {
    return;
  }

  currentPerkChoices = drawPerkChoices();
  renderPerkChoices();
}

function generateBatch(currentBoard) {
  const enabledShapes = getEnabledShapes();
  if (enabledShapes.length === 0) {
    return [];
  }

  const selected = [];
  let perfectPlanningBoard = currentBoard.slice();
  const useCurrentBoardPerfectFit = generationConfig.perfectFitUseCurrentBoardView;

  for (let slot = 0; slot < BATCH_SIZE; slot += 1) {
    let chosenSelection = null;
    const shouldAttemptPerfectFit =
      Math.random() < generationConfig.perfectFitChance;

    if (shouldAttemptPerfectFit) {
      const perfectFitBoard = useCurrentBoardPerfectFit
        ? currentBoard
        : perfectPlanningBoard;
      const perfectPlaceableShapes = enabledShapes.filter((shape) =>
        hasPlacement(perfectFitBoard, shape.cells)
      );
      chosenSelection = pickPerfectFitGenerationOption(
        perfectFitBoard,
        perfectPlaceableShapes
      );
      if (chosenSelection) {
        selected.push(chosenSelection);
        if (!useCurrentBoardPerfectFit) {
          perfectPlanningBoard = applyPlacementWithoutClears(
            perfectPlanningBoard,
            chosenSelection.shape.cells,
            chosenSelection.designatedPlacement.col,
            chosenSelection.designatedPlacement.row
          );
        }
        continue;
      }
    }

    const weightedPlaceableShapes = enabledShapes.filter((shape) =>
      hasPlacement(currentBoard, shape.cells)
    );
    chosenSelection = pickWeightedGenerationOption(
      currentBoard,
      weightedPlaceableShapes
    );
    if (!chosenSelection) {
      break;
    }
    selected.push(chosenSelection);
  }

  while (selected.length < BATCH_SIZE) {
    const weightedPlaceableShapes = enabledShapes.filter((shape) =>
      hasPlacement(currentBoard, shape.cells)
    );
    const weightedSelection = pickWeightedGenerationOption(
      currentBoard,
      weightedPlaceableShapes
    );
    if (!weightedSelection) {
      break;
    }
    selected.push(weightedSelection);
  }

  shuffleInPlace(selected);
  return selected.slice(0, BATCH_SIZE).map((entry) => toGeneratedPiece(entry));
}

function toGeneratedPiece(entry) {
  return {
    id: nextPieceId(),
    shapeId: entry.shape.id,
    used: false,
    cells: entry.shape.cells,
    tokenCell: null,
    designatedPlacement: {
      col: entry.designatedPlacement.col,
      row: entry.designatedPlacement.row
    },
    generationType: entry.generationType,
    perfectFitMetrics: entry.perfectFitMetrics || null
  };
}

function pickWeightedGenerationOption(currentBoard, placeableShapes) {
  if (placeableShapes.length === 0) {
    return null;
  }
  const chosenShape = pickWeightedShapeWithBoardBoost(
    currentBoard,
    placeableShapes
  );
  if (!chosenShape) {
    return null;
  }
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
  if (placeableShapes.length === 0) {
    return null;
  }

  const targetCorner = getBusiestQuadrantCorner(currentBoard);
  let bestSelection = null;

  for (let i = 0; i < placeableShapes.length; i += 1) {
    const shape = placeableShapes[i];
    const perfectPlacements = findPerfectFitPlacements(
      currentBoard,
      shape,
      targetCorner
    );
    for (let j = 0; j < perfectPlacements.length; j += 1) {
      const candidate = {
        shape,
        ...perfectPlacements[j]
      };
      if (
        !bestSelection ||
        comparePerfectFitSelections(candidate, bestSelection) < 0
      ) {
        bestSelection = candidate;
      }
    }
  }

  if (!bestSelection) {
    return null;
  }

  return {
    shape: bestSelection.shape,
    designatedPlacement: {
      col: bestSelection.col,
      row: bestSelection.row
    },
    generationType: generationConfig.perfectFitUseCurrentBoardView
      ? "perfect_fit"
      : "perfect_fit_simulated",
    perfectFitMetrics: {
      perfectFitPercentage: bestSelection.perfectFitPercentage,
      cellsFilledPercentage: bestSelection.cellsFilledPercentage,
      touchingEdges: bestSelection.touchingEdges,
      touchingBlockEdges: bestSelection.touchingBlockEdges,
      totalEdges: bestSelection.totalEdges
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

function comparePerfectFitSelections(a, b) {
  const base = comparePerfectFitCandidates(a, b);
  if (base !== 0) {
    return base;
  }
  if (a.shape.score !== b.shape.score) {
    return b.shape.score - a.shape.score;
  }
  return a.shape.id.localeCompare(b.shape.id);
}

function pickWeightedShapeWithBoardBoost(currentBoard, pool) {
  if (pool.length === 0) {
    return null;
  }

  const occupied = countOccupied(currentBoard);
  const occupancyRatio = occupied / (BOARD_SIZE * BOARD_SIZE);
  const lowOccupancyFactor =
    occupancyRatio >= LOW_OCCUPANCY_THRESHOLD
      ? 0
      : (LOW_OCCUPANCY_THRESHOLD - occupancyRatio) / LOW_OCCUPANCY_THRESHOLD;
  const veryLowOccupancyFactor =
    occupancyRatio >= VERY_LOW_OCCUPANCY_THRESHOLD
      ? 0
      : (VERY_LOW_OCCUPANCY_THRESHOLD - occupancyRatio) /
        VERY_LOW_OCCUPANCY_THRESHOLD;

  const weights = pool.map((shape) => {
    const sizeWeight = shape.cells.length;
    let boostMultiplier =
      1 + lowOccupancyFactor * (sizeWeight / 9) * LOW_OCCUPANCY_MAX_BOOST;

    if (sizeWeight >= LARGE_SHAPE_MIN_CELLS && veryLowOccupancyFactor > 0) {
      boostMultiplier *=
        1 + veryLowOccupancyFactor * VERY_LOW_OCCUPANCY_LARGE_SHAPE_BOOST;
    }

    return shape.score * boostMultiplier;
  });

  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
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

function applyPlacementWithoutClears(currentBoard, cells, col, row) {
  const nextBoard = currentBoard.slice();
  for (let i = 0; i < cells.length; i += 1) {
    const [dx, dy] = cells[i];
    nextBoard[toIndex(col + dx, row + dy)] = 1;
  }
  return nextBoard;
}

function shuffleInPlace(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function createPieceElement(
  cells,
  cellSize,
  className,
  cellStep = cellSize,
  tokenCell = null
) {
  const pieceEl = document.createElement("div");
  pieceEl.className = className;

  const bounds = getShapeBounds(cells);
  pieceEl.style.width = `${(bounds.width - 1) * cellStep + cellSize}px`;
  pieceEl.style.height = `${(bounds.height - 1) * cellStep + cellSize}px`;

  cells.forEach(([x, y]) => {
    const square = document.createElement("div");
    square.className = "piece-cell";
    if (tokenCell && tokenCell[0] === x && tokenCell[1] === y) {
      square.classList.add("token-cell");
    }
    square.style.width = `${cellSize - 2}px`;
    square.style.height = `${cellSize - 2}px`;
    square.style.left = `${x * cellStep}px`;
    square.style.top = `${y * cellStep}px`;
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
  const clearedCells = [];

  for (let i = 0; i < cells.length; i += 1) {
    const [dx, dy] = cells[i];
    const x = col + dx;
    const y = row + dy;
    nextBoard[toIndex(x, y)] = 1;
  }

  const completed = getCompletedLines(nextBoard);
  const lineCount = completed.rows.length + completed.cols.length;

  if (lineCount > 0) {
    const clearCellSet = getCellsForCompletedLines(
      new Set(completed.rows),
      new Set(completed.cols)
    );
    for (let i = 0; i < clearCellSet.length; i += 1) {
      const cell = clearCellSet[i];
      if (nextBoard[toIndex(cell.x, cell.y)] === 1) {
        clearedCells.push(cell);
      }
    }
    clearLines(nextBoard, completed.rows, completed.cols);
  }

  return { nextBoard, completed, lineCount, clearedCells };
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
  const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
  const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
  const step = cellSize + gap;

  return {
    cellSize,
    gap,
    step,
    borderLeft,
    borderTop,
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

function loadTokenSpawnChance() {
  return parseDecimalSetting(
    window.localStorage.getItem(TOKEN_SETTINGS_STORAGE_KEY),
    DEFAULT_TOKEN_SPAWN_CHANCE
  );
}

function loadPerfectFitSettings() {
  const defaults = {
    perfectFitChance: DEFAULT_PERFECT_FIT_CHANCE,
    minimumPerfectFitPercentage: DEFAULT_MIN_PERFECT_FIT_PERCENTAGE,
    minimumCellsFilledPercentage: DEFAULT_MIN_CELLS_FILLED_PERCENTAGE,
    perfectFitUseCurrentBoardView: true
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
      ),
      perfectFitUseCurrentBoardView: parseBooleanSetting(
        parsed?.perfectFitUseCurrentBoardView,
        defaults.perfectFitUseCurrentBoardView
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

function saveTokenSpawnChance(value) {
  window.localStorage.setItem(TOKEN_SETTINGS_STORAGE_KEY, String(value));
}

function savePerfectFitSettings(config) {
  window.localStorage.setItem(
    PERFECT_FIT_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      perfectFitChance: config.perfectFitChance,
      minimumPerfectFitPercentage: config.minimumPerfectFitPercentage,
      minimumCellsFilledPercentage: config.minimumCellsFilledPercentage,
      perfectFitUseCurrentBoardView: config.perfectFitUseCurrentBoardView
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

function parseBooleanSetting(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function formatDecimal(value) {
  const rounded = Math.round(value * 100) / 100;
  return String(Number(rounded.toFixed(2)));
}

function nextPieceId() {
  pieceIdCounter += 1;
  return `piece-${pieceIdCounter}`;
}
