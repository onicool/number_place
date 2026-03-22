(function () {
  "use strict";

  var STORAGE_KEY = "numberplace-save-v1";
  var PROGRESS_KEY = "numberplace-progress-v1";

  var GAME_OPTIONS = {
    mini: {
      key: "mini",
      course: "mini",
      label: "れんしゅう 4x4",
      homeCopy: "4つの数字だけで遊べる、いちばん入りやすいれんしゅうコースです。",
      rewardLabel: "4x4 クリア",
      stampLabel: "4x4",
      size: 4,
      blockRows: 2,
      blockCols: 2,
      puzzles: [
        { id: "mini-1", initialBoard: "1030040221034001", solution: "1234341221434321" },
        { id: "mini-2", initialBoard: "1004341001404300", solution: "1234341221434321" },
        { id: "mini-3", initialBoard: "0204341001034020", solution: "1234341221434321" }
      ]
    },
    step: {
      key: "step",
      course: "step",
      label: "ステップアップ 6x6",
      homeCopy: "少しずつ考える楽しさが増える、6x6 のステップアップコースです。",
      rewardLabel: "6x6 クリア",
      stampLabel: "6x6",
      size: 6,
      blockRows: 2,
      blockCols: 3,
      puzzles: [
        { id: "step-1", initialBoard: "120406406120034061560204045610602045", solution: "123456456123234561561234345612612345" },
        { id: "step-2", initialBoard: "103450056103230060561204300012610305", solution: "123456456123234561561234345612612345" },
        { id: "step-3", initialBoard: "023050450100204501501034045610610340", solution: "123456456123234561561234345612612345" }
      ]
    },
    easy: {
      key: "easy",
      course: "classic",
      label: "いつもの 9x9",
      subtitle: "かんたん",
      homeCopy: "空きマスが少なめで、進めやすい問題です。",
      rewardLabel: "9x9 かんたんクリア",
      stampLabel: "9x9 かんたん",
      size: 9,
      blockRows: 3,
      blockCols: 3,
      puzzles: [
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
      ]
    },
    normal: {
      key: "normal",
      course: "classic",
      label: "いつもの 9x9",
      subtitle: "ふつう",
      homeCopy: "少しだけ考える場面が増える問題です。",
      rewardLabel: "9x9 ふつうクリア",
      stampLabel: "9x9 ふつう",
      size: 9,
      blockRows: 3,
      blockCols: 3,
      puzzles: [
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
    }
  };

  var state = {
    currentCourse: "classic",
    currentDifficulty: "easy",
    gameKey: "easy",
    config: null,
    puzzle: null,
    board: [],
    fixed: [],
    selectedIndex: null,
    history: [],
    hintCount: 0,
    mistakeCount: 0,
    startedAt: 0,
    elapsedBeforePause: 0,
    timerId: null,
    cleared: false,
    isDaily: false,
    lastRewards: [],
    progress: loadProgress()
  };

  var elements = {
    homeScreen: document.getElementById("home-screen"),
    gameScreen: document.getElementById("game-screen"),
    gameMain: document.getElementById("game-main"),
    boardWrap: document.getElementById("board-wrap"),
    controlColumn: document.getElementById("control-column"),
    board: document.getElementById("board"),
    numberPad: document.getElementById("number-pad"),
    messageText: document.getElementById("message-text"),
    timer: document.getElementById("timer"),
    remainingCells: document.getElementById("remaining-cells"),
    hintCount: document.getElementById("hint-count"),
    selectedCellLabel: document.getElementById("selected-cell-label"),
    gameTitle: document.getElementById("game-title"),
    gameSubtitle: document.getElementById("game-subtitle"),
    gameMenu: document.getElementById("game-menu"),
    startButton: document.getElementById("start-button"),
    dailyButton: document.getElementById("daily-button"),
    continueButton: document.getElementById("continue-button"),
    homeButton: document.getElementById("home-button"),
    hintButton: document.getElementById("hint-button"),
    undoButton: document.getElementById("undo-button"),
    eraseButton: document.getElementById("erase-button"),
    newGameButton: document.getElementById("new-game-button"),
    clearModal: document.getElementById("clear-modal"),
    clearSummary: document.getElementById("clear-summary"),
    clearRewardCopy: document.getElementById("clear-reward-copy"),
    rewardList: document.getElementById("reward-list"),
    playAgainButton: document.getElementById("play-again-button"),
    modalHomeButton: document.getElementById("modal-home-button"),
    difficultyPanel: document.getElementById("difficulty-panel"),
    selectionCopy: document.getElementById("selection-copy"),
    dailyStatus: document.getElementById("daily-status"),
    streakCount: document.getElementById("streak-count"),
    totalClears: document.getElementById("total-clears"),
    stampBook: document.getElementById("stamp-book")
  };

  function setup() {
    bindCourseOptions();
    bindDifficultyOptions();
    bindButtons();
    bindViewportEvents();
    syncSelectionButtons();
    refreshContinueButton();
    renderHomeProgress();
    applySelectionCopy();
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

  function bindCourseOptions() {
    document.querySelectorAll(".course-option").forEach(function (button) {
      button.addEventListener("click", function () {
        state.currentCourse = button.getAttribute("data-course") || "classic";
        syncSelectionButtons();
        applySelectionCopy();
      });
    });
  }

  function bindDifficultyOptions() {
    document.querySelectorAll(".difficulty-option").forEach(function (button) {
      button.addEventListener("click", function () {
        state.currentDifficulty = button.getAttribute("data-difficulty") || "easy";
        syncSelectionButtons();
        applySelectionCopy();
      });
    });
  }

  function bindButtons() {
    bindPress(elements.startButton, function () {
      startNewGame(getSelectedGameKey(), false);
    });

    bindPress(elements.dailyButton, function () {
      startNewGame(getSelectedGameKey(), true);
    });

    bindPress(elements.continueButton, function () {
      if (!loadGame()) {
        setMessage("つづきのデータはありません。新しいゲームを始めよう。", false);
      }
    });

    bindPress(elements.homeButton, function () {
      stopTimer();
      switchScreen("home");
      refreshContinueButton();
      renderHomeProgress();
      setMessage("ホームにもどりました。", false);
      closeGameMenu();
    });

    bindPress(elements.hintButton, giveHint);
    bindPress(elements.undoButton, undoMove);
    bindPress(elements.eraseButton, function () {
      applyEntry(0);
    });
    bindPress(elements.newGameButton, function () {
      startNewGame(state.gameKey || getSelectedGameKey(), false);
      closeGameMenu();
    });

    bindPress(elements.playAgainButton, function () {
      hideClearModal();
      startNewGame(state.gameKey || getSelectedGameKey(), state.isDaily);
    });

    bindPress(elements.modalHomeButton, function () {
      hideClearModal();
      stopTimer();
      switchScreen("home");
      refreshContinueButton();
      renderHomeProgress();
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

  function getSelectedGameKey() {
    return state.currentCourse === "classic" ? state.currentDifficulty : state.currentCourse;
  }

  function getConfig(gameKey) {
    return GAME_OPTIONS[gameKey] || null;
  }

  function setSelectionFromGameKey(gameKey) {
    var config = getConfig(gameKey);
    if (!config) {
      return;
    }

    state.currentCourse = config.course;
    if (config.course === "classic") {
      state.currentDifficulty = gameKey;
    }

    syncSelectionButtons();
    applySelectionCopy();
  }

  function syncSelectionButtons() {
    document.querySelectorAll(".course-option").forEach(function (button) {
      var selected = button.getAttribute("data-course") === state.currentCourse;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    document.querySelectorAll(".difficulty-option").forEach(function (button) {
      var selected = button.getAttribute("data-difficulty") === state.currentDifficulty;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    elements.difficultyPanel.hidden = state.currentCourse !== "classic";
    elements.dailyButton.textContent = "きょうの1もん: " + getConfig(getSelectedGameKey()).stampLabel;
  }

  function applySelectionCopy() {
    elements.selectionCopy.textContent = getConfig(getSelectedGameKey()).homeCopy;
  }

  function startNewGame(gameKey, isDaily) {
    var config = getConfig(gameKey);
    if (!config) {
      return;
    }

    var chosen = choosePuzzle(config, isDaily);
    state.gameKey = gameKey;
    state.config = config;
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
    state.mistakeCount = 0;
    state.startedAt = Date.now();
    state.elapsedBeforePause = 0;
    state.cleared = false;
    state.isDaily = Boolean(isDaily);
    state.lastRewards = [];
    hideClearModal();
    rebuildGameLayout();
    switchScreen("game");
    startTimer();
    setMessage(state.isDaily ? "きょうの1もんです。できたらスタンプがふえます。" : "マスをえらんで、数字を入れてみよう。", true);
    saveGame();
    render();
  }

  function choosePuzzle(config, isDaily) {
    var puzzles = config.puzzles;
    if (!isDaily) {
      return puzzles[Math.floor(Math.random() * puzzles.length)];
    }

    var seed = getTodayKey() + "-" + config.key;
    var total = 0;
    for (var index = 0; index < seed.length; index += 1) {
      total += seed.charCodeAt(index);
    }
    return puzzles[total % puzzles.length];
  }

  function rebuildGameLayout() {
    document.documentElement.style.setProperty("--board-dimension", String(state.config.size));
    document.documentElement.style.setProperty("--pad-columns", String(getPadColumns(state.config.size)));
    createBoard();
    createNumberPad();
  }

  function getPadColumns(size) {
    if (size <= 4) {
      return 4;
    }
    if (size <= 6) {
      return 3;
    }
    return 5;
  }

  function createBoard() {
    var fragment = document.createDocumentFragment();
    var cellCount = getCellCount();
    var size = state.config.size;
    var blockRows = state.config.blockRows;
    var blockCols = state.config.blockCols;

    for (var index = 0; index < cellCount; index += 1) {
      var row = Math.floor(index / size);
      var col = index % size;
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

      if ((col + 1) % blockCols === 0 && col !== size - 1) {
        cell.classList.add("thick-right");
      }
      if ((row + 1) % blockRows === 0 && row !== size - 1) {
        cell.classList.add("thick-bottom");
      }

      fragment.appendChild(cell);
    }

    elements.board.replaceChildren(fragment);
    elements.board.setAttribute("aria-label", state.config.size + "x" + state.config.size + " の盤面");
  }

  function createNumberPad() {
    var fragment = document.createDocumentFragment();

    for (var value = 1; value <= state.config.size; value += 1) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "key-button";
      button.dataset.value = String(value);

      var buttonValue = document.createElement("span");
      buttonValue.className = "key-button-value";
      buttonValue.textContent = String(value);

      var buttonCount = document.createElement("span");
      buttonCount.className = "key-button-count";
      buttonCount.textContent = "あと " + state.config.size;

      button.appendChild(buttonValue);
      button.appendChild(buttonCount);

      bindPress(button, function (event) {
        var target = event.currentTarget;
        applyEntry(Number(target.dataset.value));
      });

      fragment.appendChild(button);
    }

    elements.numberPad.replaceChildren(fragment);
  }

  function getCellCount() {
    return state.config ? state.config.size * state.config.size : 0;
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
    var row = Math.floor(index / state.config.size) + 1;
    var col = (index % state.config.size) + 1;
    if (state.fixed[index]) {
      setMessage("このマスは最初から入っている数字です。", false);
    } else {
      setMessage(row + "ぎょう " + col + "れつ のマスをえらびました。", false);
    }
    render();
    focusSelectedCell();
  }

  function applyEntry(value) {
    if (state.selectedIndex === null || !state.puzzle || state.cleared) {
      setMessage("先にマスをえらぼう。", false);
      return;
    }

    if (state.fixed[state.selectedIndex]) {
      setMessage("このマスは変えられません。", false);
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

    if (value !== 0 && value !== Number(state.puzzle.solution[state.selectedIndex])) {
      state.mistakeCount += 1;
    }

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
      setMessage("ヒントを出せる空きマスがありません。", false);
      return;
    }

    state.selectedIndex = targetIndex;
    state.hintCount += 1;
    applyEntry(Number(state.puzzle.solution[targetIndex]));
    setMessage("ヒントで数字を1つ入れました。", true);
  }

  function findEmptyEditableCell() {
    for (var index = 0; index < getCellCount(); index += 1) {
      if (!state.fixed[index] && state.board[index] === 0) {
        return index;
      }
    }
    return null;
  }

  function undoMove() {
    if (!state.history.length || state.cleared) {
      setMessage("もどせる操作がありません。", false);
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

    for (var index = 0; index < getCellCount(); index += 1) {
      if (state.board[index] !== Number(state.puzzle.solution[index]) || hasConflictAt(index)) {
        return false;
      }
    }

    state.cleared = true;
    stopTimer();
    clearSavedGame();
    state.lastRewards = buildRewards();
    recordClear(state.lastRewards);
    render();
    showClearModal();
    return true;
  }

  function buildRewards() {
    var rewards = [state.config.rewardLabel];

    if (state.progress.totalClears === 0) {
      rewards.push("はじめてクリア");
    }
    if (state.hintCount === 0) {
      rewards.push("ノーヒント");
    }
    if (state.mistakeCount === 0) {
      rewards.push("ノーミス");
    }
    if (state.isDaily) {
      rewards.push("きょうのチャレンジ");
    }

    return rewards;
  }

  function recordClear(rewards) {
    var today = getTodayKey();
    var stampId = state.isDaily ? "daily-" + today + "-" + state.gameKey : "clear-" + Date.now();
    var stamp = {
      id: stampId,
      title: (state.isDaily ? "きょうの " : "") + state.config.stampLabel,
      date: today,
      rewards: rewards.slice(0, 3)
    };

    state.progress.totalClears += 1;

    if (state.isDaily && state.progress.lastDailyClearDate !== today) {
      state.progress.streakCount = isPreviousDay(state.progress.lastDailyClearDate, today) ? state.progress.streakCount + 1 : 1;
      state.progress.lastDailyClearDate = today;
    }

    if (!state.progress.stamps.some(function (item) {
      return item.id === stamp.id;
    })) {
      state.progress.stamps.unshift(stamp);
      state.progress.stamps = state.progress.stamps.slice(0, 18);
    }

    state.progress.lastPlayedGameKey = state.gameKey;
    saveProgress();
    renderHomeProgress();
  }

  function isPreviousDay(previousDate, nextDate) {
    if (!previousDate) {
      return false;
    }

    var previous = new Date(previousDate + "T00:00:00");
    var next = new Date(nextDate + "T00:00:00");
    var diffDays = Math.round((next.getTime() - previous.getTime()) / 86400000);
    return diffDays === 1;
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
    var size = state.config.size;
    var row = Math.floor(index / size);
    var col = index % size;
    var rowStart = row * size;

    for (var i = 0; i < size; i += 1) {
      addPeer(result, seen, rowStart + i, index);
      addPeer(result, seen, (i * size) + col, index);
    }

    var boxRow = Math.floor(row / state.config.blockRows) * state.config.blockRows;
    var boxCol = Math.floor(col / state.config.blockCols) * state.config.blockCols;
    for (var rowOffset = 0; rowOffset < state.config.blockRows; rowOffset += 1) {
      for (var colOffset = 0; colOffset < state.config.blockCols; colOffset += 1) {
        addPeer(result, seen, ((boxRow + rowOffset) * size) + boxCol + colOffset, index);
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
    renderHomeProgress();
    if (!state.puzzle || !state.config) {
      return;
    }

    renderHeader();
    renderBoard();
    renderNumberPad();
    scheduleViewportFit();
  }

  function renderHomeProgress() {
    elements.dailyStatus.textContent = state.progress.lastDailyClearDate === getTodayKey() ? "クリアずみ" : "まだ";
    elements.streakCount.textContent = String(state.progress.streakCount) + "日";
    elements.totalClears.textContent = String(state.progress.totalClears) + "回";

    if (!state.progress.stamps.length) {
      elements.stampBook.innerHTML = "<div class=\"stamp-empty\">まだスタンプはありません。きょうの1もんから始められます。</div>";
      return;
    }

    elements.stampBook.innerHTML = state.progress.stamps.slice(0, 6).map(function (stamp) {
      return "<article class=\"stamp-chip\"><strong>" + escapeHtml(stamp.title) + "</strong><span>" + escapeHtml(stamp.date) + "</span><span>" + escapeHtml(stamp.rewards.join(" / ")) + "</span></article>";
    }).join("");
  }

  function renderHeader() {
    elements.gameTitle.textContent = state.config.label + (state.config.subtitle ? " " + state.config.subtitle : "");
    elements.gameSubtitle.textContent = state.isDaily ? "きょうのチャレンジ" : "じゆうプレイ";
    elements.remainingCells.textContent = String(getRemainingCellCount());
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
      var remainingCount = getRemainingCountForValue(value);
      button.classList.toggle("is-active", value === selectedValue && selectedValue !== 0);
      button.classList.toggle("is-complete", remainingCount === 0);
      button.querySelector(".key-button-count").textContent = remainingCount === 0 ? "そろった" : "あと " + remainingCount;
      button.setAttribute("aria-label", buildKeyButtonLabel(value, remainingCount));
      button.disabled = !state.puzzle || state.cleared;
    }
  }

  function getRemainingCellCount() {
    var remaining = 0;
    for (var index = 0; index < state.board.length; index += 1) {
      if (state.board[index] === 0) {
        remaining += 1;
      }
    }
    return remaining;
  }

  function getRemainingCountForValue(value) {
    var used = 0;
    for (var index = 0; index < state.board.length; index += 1) {
      if (state.board[index] === value) {
        used += 1;
      }
    }
    return Math.max(0, state.config.size - used);
  }

  function buildKeyButtonLabel(value, remainingCount) {
    return remainingCount === 0 ? String(value) + " はそろっています" : String(value) + " あと " + remainingCount;
  }

  function isRelatedToSelected(index) {
    if (state.selectedIndex === null || state.selectedIndex === index) {
      return false;
    }

    var size = state.config.size;
    var selectedRow = Math.floor(state.selectedIndex / size);
    var selectedCol = state.selectedIndex % size;
    var row = Math.floor(index / size);
    var col = index % size;
    var sameBox = Math.floor(selectedRow / state.config.blockRows) === Math.floor(row / state.config.blockRows) && Math.floor(selectedCol / state.config.blockCols) === Math.floor(col / state.config.blockCols);
    return selectedRow === row || selectedCol === col || sameBox;
  }

  function describeCell(index, value) {
    var size = state.config.size;
    var row = Math.floor(index / size) + 1;
    var col = (index % size) + 1;
    var description = row + "ぎょう " + col + "れつ ";
    description += value === 0 ? "空のマス" : value;
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
    return (Math.floor(state.selectedIndex / state.config.size) + 1) + "-" + ((state.selectedIndex % state.config.size) + 1);
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
      var value = Number(event.key);
      if (value <= state.config.size) {
        applyEntry(value);
        event.preventDefault();
      }
      return;
    }

    if (/^Numpad[1-9]$/.test(event.code)) {
      var padValue = Number(event.code.replace("Numpad", ""));
      if (padValue <= state.config.size) {
        applyEntry(padValue);
        event.preventDefault();
      }
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

    var size = state.config.size;
    var row = Math.floor(index / size);
    var col = index % size;
    var nextRow = Math.min(size - 1, Math.max(0, row + rowDelta));
    var nextCol = Math.min(size - 1, Math.max(0, col + colDelta));
    selectCell((nextRow * size) + nextCol);
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
      gameKey: state.gameKey,
      puzzleId: state.puzzle.id,
      board: state.board.join(""),
      hintCount: state.hintCount,
      mistakeCount: state.mistakeCount,
      history: state.history,
      selectedIndex: state.selectedIndex,
      elapsedSeconds: getElapsedSeconds(),
      message: elements.messageText.textContent,
      isDaily: state.isDaily
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    refreshContinueButton();
  }

  function loadGame() {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      refreshContinueButton();
      return false;
    }

    try {
      var payload = JSON.parse(raw);
      var gameKey = payload.gameKey || payload.difficulty || "easy";
      var config = getConfig(gameKey);
      var puzzle = findPuzzle(gameKey, payload.puzzleId);
      if (!config || !puzzle) {
        refreshContinueButton();
        return false;
      }

      state.gameKey = gameKey;
      state.config = config;
      state.puzzle = puzzle;
      setSelectionFromGameKey(gameKey);
      state.board = payload.board.split("").map(function (char) {
        return Number(char);
      });
      state.fixed = puzzle.initialBoard.split("").map(function (char) {
        return Number(char) !== 0;
      });
      state.history = Array.isArray(payload.history) ? payload.history : [];
      state.selectedIndex = typeof payload.selectedIndex === "number" ? payload.selectedIndex : firstEditableIndex();
      state.hintCount = payload.hintCount || 0;
      state.mistakeCount = payload.mistakeCount || 0;
      state.elapsedBeforePause = payload.elapsedSeconds || 0;
      state.startedAt = Date.now();
      state.cleared = false;
      state.isDaily = Boolean(payload.isDaily);
      state.lastRewards = [];
      hideClearModal();
      rebuildGameLayout();
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

  function findPuzzle(gameKey, puzzleId) {
    var config = getConfig(gameKey);
    var puzzles = config ? config.puzzles : [];
    for (var index = 0; index < puzzles.length; index += 1) {
      if (puzzles[index].id === puzzleId) {
        return puzzles[index];
      }
    }
    return null;
  }

  function clearSavedGame() {
    window.localStorage.removeItem(STORAGE_KEY);
    refreshContinueButton();
  }

  function refreshContinueButton() {
    elements.continueButton.disabled = !window.localStorage.getItem(STORAGE_KEY);
  }

  function showClearModal() {
    elements.clearSummary.textContent = formatTime(getElapsedSeconds()) + " でクリアしました。ヒントは " + state.hintCount + " 回、ミスは " + state.mistakeCount + " 回です。";
    elements.clearRewardCopy.textContent = state.isDaily ? "きょうのチャレンジをクリアして、れんぞく記録も更新します。" : "クリアごとにスタンプがふえます。";
    elements.rewardList.innerHTML = state.lastRewards.map(function (reward) {
      return "<span class=\"reward-chip\">" + escapeHtml(reward) + "</span>";
    }).join("");
    elements.clearModal.hidden = false;
    scheduleViewportFit();
  }

  function hideClearModal() {
    elements.clearModal.hidden = true;
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

  function loadProgress() {
    var raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return getDefaultProgress();
    }

    try {
      var parsed = JSON.parse(raw);
      return {
        totalClears: typeof parsed.totalClears === "number" ? parsed.totalClears : 0,
        streakCount: typeof parsed.streakCount === "number" ? parsed.streakCount : 0,
        lastDailyClearDate: parsed.lastDailyClearDate || "",
        lastPlayedGameKey: parsed.lastPlayedGameKey || "easy",
        stamps: Array.isArray(parsed.stamps) ? parsed.stamps : []
      };
    } catch (error) {
      return getDefaultProgress();
    }
  }

  function getDefaultProgress() {
    return {
      totalClears: 0,
      streakCount: 0,
      lastDailyClearDate: "",
      lastPlayedGameKey: "easy",
      stamps: []
    };
  }

  function saveProgress() {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  }

  function getTodayKey() {
    var today = new Date();
    var year = String(today.getFullYear());
    var month = String(today.getMonth() + 1).padStart(2, "0");
    var day = String(today.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  setup();
})();