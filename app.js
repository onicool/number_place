(function () {
  "use strict";

  var STORAGE_KEY = "numberplace-save-v1";
  var DIFFICULTY_COPY = {
    easy: "空きマスが少なめで、進めやすい問題です。",
    normal: "少しだけ考える場面が増える問題です。"
  };

  var PUZZLES = {
    easy: [
      {
        id: "easy-1",
        initialBoard: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
        solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
      },
      {
        id: "easy-2",
        initialBoard: "200080300060070084030500209000105408000000000402706000301007040720040060004010003",
        solution: "245981376169273584837564219976125438513498627482736951391657842728349165654812793"
      },
      {
        id: "easy-3",
        initialBoard: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
        solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259"
      }
    ],
    normal: [
      {
        id: "normal-1",
        initialBoard: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
        solution: "462831957795426183381795426173984265659312748248567319926178534834259671517643892"
      },
      {
        id: "normal-2",
        initialBoard: "300200000000107000706030500070009080900020004010800050009040301000702000000008006",
        solution: "351286497492157638786934512275469183938521764614873259829645371163792845547318926"
      },
      {
        id: "normal-3",
        initialBoard: "009000000080605020501078000000000700706040102004000000000720903090301080000000600",
        solution: "269134578784695321531278469918526734756943182324817956145762893697351284832489615"
      }
    ]
  };

  var state = {
    currentDifficulty: "easy",
    puzzle: null,
    board: [],
    fixed: [],
    selectedIndex: null,
    history: [],
    hintCount: 0,
    startedAt: 0,
    elapsedBeforePause: 0,
    timerId: null,
    cleared: false
  };

  var elements = {
    appShell: document.querySelector(".app-shell"),
    appCard: document.querySelector(".app-card"),
    homeScreen: document.getElementById("home-screen"),
    gameScreen: document.getElementById("game-screen"),
    gameHeader: document.querySelector(".game-header"),
    gameMain: document.getElementById("game-main"),
    boardWrap: document.getElementById("board-wrap"),
    controlColumn: document.getElementById("control-column"),
    board: document.getElementById("board"),
    numberPad: document.getElementById("number-pad"),
    messageText: document.getElementById("message-text"),
    timer: document.getElementById("timer"),
    hintCount: document.getElementById("hint-count"),
    selectedCellLabel: document.getElementById("selected-cell-label"),
    gameTitle: document.getElementById("game-title"),
    gameMenu: document.getElementById("game-menu"),
    startButton: document.getElementById("start-button"),
    continueButton: document.getElementById("continue-button"),
    homeButton: document.getElementById("home-button"),
    hintButton: document.getElementById("hint-button"),
    undoButton: document.getElementById("undo-button"),
    eraseButton: document.getElementById("erase-button"),
    newGameButton: document.getElementById("new-game-button"),
    clearModal: document.getElementById("clear-modal"),
    clearSummary: document.getElementById("clear-summary"),
    playAgainButton: document.getElementById("play-again-button"),
    modalHomeButton: document.getElementById("modal-home-button"),
    difficultyCopy: document.getElementById("difficulty-copy")
  };

  function setup() {
    bindDifficultyOptions();
    bindButtons();
    bindViewportEvents();
    createBoard();
    createNumberPad();
    refreshContinueButton();
    applyDifficultyCopy();
    render();
    scheduleViewportFit();
  }

  function bindViewportEvents() {
    window.addEventListener("resize", scheduleViewportFit);
    window.addEventListener("orientationchange", scheduleViewportFit);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleViewportFit);
      window.visualViewport.addEventListener("scroll", scheduleViewportFit);
    }
  }

  function scheduleViewportFit() {
    window.requestAnimationFrame(syncViewportFit);
  }

  function syncViewportFit() {
    var viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var isLandscape = viewportWidth > viewportHeight;

    document.body.dataset.orientation = isLandscape ? "landscape" : "portrait";
    document.documentElement.style.setProperty("--app-viewport-height", viewportHeight + "px");

    if (elements.gameScreen.hidden) {
      return;
    }

    document.documentElement.style.removeProperty("--board-size");

    var gameMainRect = elements.gameMain.getBoundingClientRect();
    var controlRect = elements.controlColumn.getBoundingClientRect();
    var gap = parseFloat(window.getComputedStyle(elements.gameMain).gap) || 0;
    var boardWrapStyles = window.getComputedStyle(elements.boardWrap);
    var boardWrapHorizontalPadding = parseFloat(boardWrapStyles.paddingLeft) + parseFloat(boardWrapStyles.paddingRight);
    var availableBoardWidth = isLandscape ? gameMainRect.width - controlRect.width - gap - boardWrapHorizontalPadding : gameMainRect.width - boardWrapHorizontalPadding;
    var availableBoardHeight = isLandscape ? gameMainRect.height : gameMainRect.height - controlRect.height - gap;
    var boardSize = Math.floor(Math.max(0, Math.min(availableBoardWidth, availableBoardHeight)));

    if (!Number.isFinite(boardSize) || boardSize <= 0) {
      return;
    }

    document.documentElement.style.setProperty("--board-size", boardSize + "px");
  }

  function bindDifficultyOptions() {
    var buttons = document.querySelectorAll(".difficulty-option");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        state.currentDifficulty = button.getAttribute("data-difficulty") || "easy";
        buttons.forEach(function (item) {
          var selected = item === button;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        applyDifficultyCopy();
      });
    });
  }

  function bindButtons() {
    bindPress(elements.startButton, function () {
      startNewGame(state.currentDifficulty);
    });

    bindPress(elements.continueButton, function () {
      if (!loadGame()) {
        setMessage("つづきのデータはありません。新しいゲームを始めよう。");
      }
    });

    bindPress(elements.homeButton, function () {
      stopTimer();
      switchScreen("home");
      refreshContinueButton();
      setMessage("ホームにもどりました。", true);
      closeGameMenu();
    });

    bindPress(elements.hintButton, giveHint);
    bindPress(elements.undoButton, undoMove);
    bindPress(elements.eraseButton, function () {
      applyEntry(0);
    });
    bindPress(elements.newGameButton, function () {
      startNewGame(state.currentDifficulty);
      closeGameMenu();
    });

    bindPress(elements.playAgainButton, function () {
      hideClearModal();
      startNewGame(state.currentDifficulty);
    });

    bindPress(elements.modalHomeButton, function () {
      hideClearModal();
      stopTimer();
      switchScreen("home");
      refreshContinueButton();
    });

    window.addEventListener("keydown", handleGlobalKeydown);
    window.addEventListener("beforeunload", saveGame);
  }

  function bindPress(element, handler) {
    element.addEventListener("click", function (event) {
      if (shouldIgnoreSyntheticClick(element)) {
        return;
      }
      handler(event);
    });

    element.addEventListener("pointerup", function (event) {
      if (event.pointerType !== "pen") {
        return;
      }
      rememberPenActivation(element);
      event.preventDefault();
      handler(event);
    });
  }

  function rememberPenActivation(element) {
    element.dataset.penActivationAt = String(Date.now());
  }

  function shouldIgnoreSyntheticClick(element) {
    var lastPenActivationAt = Number(element.dataset.penActivationAt || 0);
    return lastPenActivationAt && (Date.now() - lastPenActivationAt) < 500;
  }

  function createBoard() {
    var fragment = document.createDocumentFragment();
    for (var index = 0; index < 81; index += 1) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", "空のマス");
      cell.dataset.index = String(index);
      bindPress(cell, function (event) {
        var target = event.currentTarget;
        selectCell(Number(target.dataset.index));
      });

      if ((index + 1) % 3 === 0 && (index + 1) % 9 !== 0) {
        cell.classList.add("thick-right");
      }
      if (Math.floor(index / 9) % 3 === 2 && index < 54) {
        cell.classList.add("thick-bottom");
      }

      fragment.appendChild(cell);
    }
    elements.board.appendChild(fragment);
  }

  function createNumberPad() {
    var fragment = document.createDocumentFragment();
    for (var value = 1; value <= 9; value += 1) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "key-button";
      button.textContent = String(value);
      button.dataset.value = String(value);
      bindPress(button, function (event) {
        var target = event.currentTarget;
        applyEntry(Number(target.dataset.value));
      });
      fragment.appendChild(button);
    }
    elements.numberPad.appendChild(fragment);
  }

  function startNewGame(difficulty) {
    var puzzles = PUZZLES[difficulty];
    var chosen = puzzles[Math.floor(Math.random() * puzzles.length)];
    state.currentDifficulty = difficulty;
    state.puzzle = chosen;
    state.board = chosen.initialBoard.split("").map(function (char) {
      return Number(char);
    });
    state.fixed = state.board.map(function (value) {
      return value !== 0;
    });
    state.selectedIndex = firstEditableIndex();
    state.history = [];
    state.hintCount = 0;
    state.startedAt = Date.now();
    state.elapsedBeforePause = 0;
    state.cleared = false;
    hideClearModal();
    switchScreen("game");
    startTimer();
    setMessage("マスをえらんで、数字を入れてみよう。", true);
    saveGame();
    render();
  }

  function firstEditableIndex() {
    for (var index = 0; index < state.fixed.length; index += 1) {
      if (!state.fixed[index]) {
        return index;
      }
    }
    return null;
  }

  function selectCell(index) {
    state.selectedIndex = index;
    var row = Math.floor(index / 9) + 1;
    var col = (index % 9) + 1;
    if (state.fixed[index]) {
      setMessage("このマスは最初から入っている数字です。", true);
    } else {
      setMessage(row + "ぎょう " + col + "れつ のマスをえらびました。", true);
    }
    render();
    focusSelectedCell();
  }

  function applyEntry(value) {
    if (state.selectedIndex === null || !state.puzzle || state.cleared) {
      setMessage("先にマスをえらぼう。", true);
      return;
    }

    if (state.fixed[state.selectedIndex]) {
      setMessage("このマスは変えられません。", true);
      return;
    }

    var previousValue = state.board[state.selectedIndex];
    if (previousValue === value) {
      return;
    }

    state.history.push({
      index: state.selectedIndex,
      previousValue: previousValue,
      nextValue: value
    });
    state.board[state.selectedIndex] = value;
    saveGame();
    render();

    if (value === 0) {
      setMessage("数字をけしました。", true);
    } else if (hasConflictAt(state.selectedIndex)) {
      setMessage("ちがうかも。同じ数字がぶつかっています。", true);
    } else {
      setMessage("いいね。この調子で進めよう。", true);
    }

    checkClear();
  }

  function giveHint() {
    if (!state.puzzle || state.cleared) {
      return;
    }

    var targetIndex = state.selectedIndex;
    if (targetIndex === null || state.fixed[targetIndex] || state.board[targetIndex] !== 0) {
      targetIndex = findEmptyEditableCell();
    }

    if (targetIndex === null) {
      setMessage("ヒントを出せる空きマスがありません。", true);
      return;
    }

    state.selectedIndex = targetIndex;
    state.hintCount += 1;
    applyEntry(Number(state.puzzle.solution[targetIndex]));
    setMessage("ヒントで数字を1つ入れました。", true);
  }

  function findEmptyEditableCell() {
    for (var index = 0; index < 81; index += 1) {
      if (!state.fixed[index] && state.board[index] === 0) {
        return index;
      }
    }
    return null;
  }

  function undoMove() {
    if (!state.history.length || state.cleared) {
      setMessage("もどせる操作がありません。", true);
      return;
    }

    var move = state.history.pop();
    state.board[move.index] = move.previousValue;
    state.selectedIndex = move.index;
    saveGame();
    render();
    setMessage("ひとつ前にもどしました。", true);
  }

  function checkClear() {
    if (state.board.indexOf(0) !== -1) {
      return false;
    }

    for (var index = 0; index < 81; index += 1) {
      if (state.board[index] !== Number(state.puzzle.solution[index]) || hasConflictAt(index)) {
        return false;
      }
    }

    state.cleared = true;
    stopTimer();
    clearSavedGame();
    render();
    showClearModal();
    return true;
  }

  function hasConflictAt(index) {
    var value = state.board[index];
    if (!value) {
      return false;
    }

    var peers = getPeerIndexes(index);
    for (var i = 0; i < peers.length; i += 1) {
      if (state.board[peers[i]] === value) {
        return true;
      }
    }
    return false;
  }

  function getPeerIndexes(index) {
    var result = [];
    var seen = {};
    var row = Math.floor(index / 9);
    var col = index % 9;
    var rowStart = row * 9;

    for (var i = 0; i < 9; i += 1) {
      var rowIndex = rowStart + i;
      var colIndex = (i * 9) + col;
      addPeer(result, seen, rowIndex, index);
      addPeer(result, seen, colIndex, index);
    }

    var boxRow = Math.floor(row / 3) * 3;
    var boxCol = Math.floor(col / 3) * 3;
    for (var rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (var colOffset = 0; colOffset < 3; colOffset += 1) {
        var boxIndex = ((boxRow + rowOffset) * 9) + boxCol + colOffset;
        addPeer(result, seen, boxIndex, index);
      }
    }

    return result;
  }

  function addPeer(result, seen, candidate, index) {
    if (candidate !== index && !seen[candidate]) {
      seen[candidate] = true;
      result.push(candidate);
    }
  }

  function render() {
    renderHeader();
    renderBoard();
    renderNumberPad();
    scheduleViewportFit();
  }

  function focusSelectedCell() {
    if (state.selectedIndex === null) {
      return;
    }

    var cell = elements.board.children[state.selectedIndex];
    if (cell && document.activeElement !== cell) {
      cell.focus({ preventScroll: true });
    }
  }

  function closeGameMenu() {
    if (elements.gameMenu) {
      elements.gameMenu.open = false;
    }
  }

  function renderHeader() {
    elements.gameTitle.textContent = state.currentDifficulty === "easy" ? "かんたん" : "ふつう";
    elements.hintCount.textContent = String(state.hintCount);
    elements.selectedCellLabel.textContent = formatSelectedCellLabel();
    elements.undoButton.disabled = !state.history.length || state.cleared;
    elements.hintButton.disabled = !state.puzzle || state.cleared;
    elements.eraseButton.disabled = state.selectedIndex === null || state.cleared;
  }

  function renderBoard() {
    var selectedValue = state.selectedIndex !== null ? state.board[state.selectedIndex] : 0;
    var cells = elements.board.children;

    for (var index = 0; index < cells.length; index += 1) {
      var cell = cells[index];
      var value = state.board[index] || 0;
      cell.textContent = value === 0 ? "" : String(value);
      cell.classList.toggle("fixed", Boolean(state.fixed[index]));
      cell.classList.remove("selected", "related", "same-number", "conflict");

      if (state.selectedIndex === index) {
        cell.classList.add("selected");
      } else if (isRelatedToSelected(index)) {
        cell.classList.add("related");
      }

      if (selectedValue && value === selectedValue) {
        cell.classList.add("same-number");
      }

      if (hasConflictAt(index)) {
        cell.classList.add("conflict");
      }

      cell.setAttribute("aria-label", describeCell(index, value));
    }
  }

  function renderNumberPad() {
    var buttons = elements.numberPad.children;
    var selectedValue = state.selectedIndex !== null ? state.board[state.selectedIndex] : 0;

    for (var index = 0; index < buttons.length; index += 1) {
      var button = buttons[index];
      var value = Number(button.dataset.value);
      button.classList.toggle("is-active", value === selectedValue && selectedValue !== 0);
      button.disabled = !state.puzzle || state.cleared;
    }
  }

  function isRelatedToSelected(index) {
    if (state.selectedIndex === null || state.selectedIndex === index) {
      return false;
    }

    var selectedRow = Math.floor(state.selectedIndex / 9);
    var selectedCol = state.selectedIndex % 9;
    var row = Math.floor(index / 9);
    var col = index % 9;
    var sameBox = Math.floor(selectedRow / 3) === Math.floor(row / 3) && Math.floor(selectedCol / 3) === Math.floor(col / 3);
    return selectedRow === row || selectedCol === col || sameBox;
  }

  function describeCell(index, value) {
    var row = Math.floor(index / 9) + 1;
    var col = (index % 9) + 1;
    var description = row + "ぎょう " + col + "れつ ";
    if (value === 0) {
      description += "空のマス";
    } else {
      description += value;
    }
    if (state.fixed[index]) {
      description += " 固定";
    }
    if (hasConflictAt(index)) {
      description += " ちがうかも";
    }
    return description;
  }

  function formatSelectedCellLabel() {
    if (state.selectedIndex === null) {
      return "なし";
    }
    return (Math.floor(state.selectedIndex / 9) + 1) + "-" + ((state.selectedIndex % 9) + 1);
  }

  function applyDifficultyCopy() {
    elements.difficultyCopy.textContent = DIFFICULTY_COPY[state.currentDifficulty];
  }

  function switchScreen(target) {
    var showHome = target === "home";
    elements.homeScreen.hidden = !showHome;
    elements.gameScreen.hidden = showHome;
    elements.homeScreen.classList.toggle("screen-active", showHome);
    elements.gameScreen.classList.toggle("screen-active", !showHome);
    scheduleViewportFit();
    if (!showHome) {
      window.setTimeout(focusSelectedCell, 0);
    }
  }

  function handleGlobalKeydown(event) {
    if (event.defaultPrevented || isTypingTarget(event.target)) {
      return;
    }

    if (!elements.clearModal.hidden) {
      if (event.key === "Escape") {
        hideClearModal();
        event.preventDefault();
      }
      return;
    }

    if (elements.gameScreen.hidden || !state.puzzle) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === "z") {
        undoMove();
        event.preventDefault();
      }
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      applyEntry(Number(event.key));
      event.preventDefault();
      return;
    }

    if (/^Numpad[1-9]$/.test(event.code)) {
      applyEntry(Number(event.code.replace("Numpad", "")));
      event.preventDefault();
      return;
    }

    if (event.key === "0" || event.key === "Delete" || event.key === "Backspace" || event.code === "Numpad0") {
      applyEntry(0);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowUp") {
      moveSelection(-1, 0);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown") {
      moveSelection(1, 0);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowLeft") {
      moveSelection(0, -1);
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowRight") {
      moveSelection(0, 1);
      event.preventDefault();
      return;
    }

    if (event.key.toLowerCase() === "h") {
      giveHint();
      event.preventDefault();
      return;
    }

    if (event.key.toLowerCase() === "u") {
      undoMove();
      event.preventDefault();
    }
  }

  function isTypingTarget(target) {
    if (!target) {
      return false;
    }

    var tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable;
  }

  function moveSelection(rowDelta, colDelta) {
    var index = state.selectedIndex;
    if (index === null) {
      index = firstEditableIndex();
      if (index === null) {
        return;
      }
    }

    var row = Math.floor(index / 9);
    var col = index % 9;
    var nextRow = Math.min(8, Math.max(0, row + rowDelta));
    var nextCol = Math.min(8, Math.max(0, col + colDelta));
    selectCell((nextRow * 9) + nextCol);
  }

  function setMessage(text, shouldPersist) {
    elements.messageText.textContent = text;
    if (shouldPersist) {
      saveGame();
    }
  }

  function startTimer() {
    stopTimer();
    state.startedAt = Date.now();
    updateTimer();
    state.timerId = window.setInterval(updateTimer, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
      state.elapsedBeforePause = getElapsedSeconds();
    }
  }

  function updateTimer() {
    elements.timer.textContent = formatTime(getElapsedSeconds());
  }

  function getElapsedSeconds() {
    if (!state.startedAt) {
      return state.elapsedBeforePause;
    }
    return state.elapsedBeforePause + Math.floor((Date.now() - state.startedAt) / 1000);
  }

  function formatTime(seconds) {
    var minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    var remain = String(seconds % 60).padStart(2, "0");
    return minutes + ":" + remain;
  }

  function saveGame() {
    if (!state.puzzle || state.cleared) {
      return;
    }

    var payload = {
      difficulty: state.currentDifficulty,
      puzzleId: state.puzzle.id,
      board: state.board.join(""),
      hintCount: state.hintCount,
      history: state.history,
      selectedIndex: state.selectedIndex,
      elapsedSeconds: getElapsedSeconds(),
      message: elements.messageText.textContent
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadGame() {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      refreshContinueButton();
      return false;
    }

    try {
      var payload = JSON.parse(raw);
      var puzzle = findPuzzle(payload.difficulty, payload.puzzleId);
      if (!puzzle) {
        refreshContinueButton();
        return false;
      }

      state.currentDifficulty = payload.difficulty;
      syncDifficultyButtons();
      state.puzzle = puzzle;
      state.board = payload.board.split("").map(function (char) {
        return Number(char);
      });
      state.fixed = puzzle.initialBoard.split("").map(function (char) {
        return Number(char) !== 0;
      });
      state.history = Array.isArray(payload.history) ? payload.history : [];
      state.selectedIndex = typeof payload.selectedIndex === "number" ? payload.selectedIndex : firstEditableIndex();
      state.hintCount = payload.hintCount || 0;
      state.elapsedBeforePause = payload.elapsedSeconds || 0;
      state.startedAt = Date.now();
      state.cleared = false;
      hideClearModal();
      switchScreen("game");
      startTimer();
      setMessage(payload.message || "つづきから始めました。", false);
      render();
      return true;
    } catch (error) {
      clearSavedGame();
      refreshContinueButton();
      return false;
    }
  }

  function findPuzzle(difficulty, puzzleId) {
    var puzzles = PUZZLES[difficulty] || [];
    for (var index = 0; index < puzzles.length; index += 1) {
      if (puzzles[index].id === puzzleId) {
        return puzzles[index];
      }
    }
    return null;
  }

  function syncDifficultyButtons() {
    var buttons = document.querySelectorAll(".difficulty-option");
    buttons.forEach(function (button) {
      var selected = button.getAttribute("data-difficulty") === state.currentDifficulty;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    applyDifficultyCopy();
  }

  function clearSavedGame() {
    window.localStorage.removeItem(STORAGE_KEY);
    refreshContinueButton();
  }

  function refreshContinueButton() {
    elements.continueButton.disabled = !window.localStorage.getItem(STORAGE_KEY);
  }

  function showClearModal() {
    elements.clearSummary.textContent = formatTime(getElapsedSeconds()) + " でクリアしました。ヒントは " + state.hintCount + " 回です。";
    elements.clearModal.hidden = false;
    scheduleViewportFit();
  }

  function hideClearModal() {
    elements.clearModal.hidden = true;
    scheduleViewportFit();
  }

  setup();
})();