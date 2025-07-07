document.addEventListener("DOMContentLoaded", () => {
  const singlePlayerBtn = document.getElementById("pc");
  const multiPlayerBtn = document.getElementById("multi");
  const tutorialBtn = document.getElementById("tutorial");
  const tutorialModal = document.getElementById("tutorialModal");
  const closeTutorial = document.getElementById("closeTutorial");
  const multiplayerUI = document.getElementById("multiplayer-options");
  const mainContent = document.querySelector(".hd");
  const gameModes = document.querySelector(".game-modes");
  const backToMenu = document.getElementById("backToMenu");
  const inputArea = document.getElementById("inputArea");
  const timeoutMsg = document.getElementById("roomTimeoutMsg");

  document.querySelector(".result-box")?.remove();
  document.querySelector(".game-container")?.remove();

  if (inputArea) inputArea.innerHTML = "";
  if (multiplayerUI) multiplayerUI.style.display = "none";
  if (gameModes) gameModes.style.display = "flex";
  if (mainContent) mainContent.style.display = "flex";

  document.body.classList.add("loaded");

  tutorialBtn?.addEventListener("click", () => {
    tutorialModal.style.display = "flex";
  });

  closeTutorial?.addEventListener("click", () => {
    tutorialModal.style.display = "none";
  });

  multiPlayerBtn?.addEventListener("click", () => {
    multiplayerUI.style.display = "block";
    gameModes.style.display = "none";
    timeoutMsg.textContent = "";
    inputArea.innerHTML = "";
  });

  backToMenu?.addEventListener("click", () => {
    multiplayerUI.style.display = "none";
    gameModes.style.display = "flex";
    timeoutMsg.textContent = "";
    inputArea.innerHTML = "";
  });

  singlePlayerBtn?.addEventListener("click", () => {
    mainContent.style.display = "none";
    startSinglePlayerGame();
  });
});

function startSinglePlayerGame() {
  const mainContent = document.querySelector(".hd");
  const gameContainer = document.createElement("div");
  gameContainer.classList.add("game-container");

  const title = document.createElement("h2");
  title.textContent = "🎯 Single Player - BINGO";
  gameContainer.appendChild(title);

  const tracker = document.createElement("div");
  tracker.classList.add("bingo-tracker");
  tracker.innerHTML = "B I N G O"
    .split(" ")
    .map((l) => `<span class="bingo-letter">${l}</span>`)
    .join("");
  gameContainer.appendChild(tracker);

  const status = document.createElement("p");
  status.classList.add("turn-status");
  status.textContent = "Your turn!";
  gameContainer.appendChild(status);

  const grid = document.createElement("div");
  grid.classList.add("bingo-grid");

  const numbers = Array.from({ length: 25 }, (_, i) => i + 1).sort(
    () => Math.random() - 0.5
  );
  const cells = [];

  numbers.forEach((num) => {
    const cell = document.createElement("div");
    cell.classList.add("bingo-cell");
    cell.textContent = num;
    grid.appendChild(cell);
    cells.push(cell);
  });

  gameContainer.appendChild(grid);

  let currentPlayer = "user";
  let gameOver = false;
  let cleared = 0;

  function countLines() {
    const isMarked = (i) => cells[i].classList.contains("marked");
    let lines = 0;

    for (let r = 0; r < 5; r++) {
      if ([0, 1, 2, 3, 4].every((c) => isMarked(r * 5 + c))) lines++;
    }
    for (let c = 0; c < 5; c++) {
      if ([0, 1, 2, 3, 4].every((r) => isMarked(r * 5 + c))) lines++;
    }
    if ([0, 6, 12, 18, 24].every(isMarked)) lines++;
    if ([4, 8, 12, 16, 20].every(isMarked)) lines++;

    return lines;
  }

  function updateTracker(count) {
    const bonusSound = document.getElementById("bonusSound");
    document.querySelectorAll(".bingo-letter").forEach((el, i) => {
      if (!el.classList.contains("struck") && i < count) {
        el.classList.add("struck");
        if (bonusSound) {
          bonusSound.play().catch(() => {});
        }
      }
    });
  }

  function showResultBox(msg) {
    const result = document.createElement("div");
    result.classList.add("result-box");

    const winSound = document.getElementById("winSound");
    const loseSound = document.getElementById("loseSound");

    if (msg.includes("BINGO") && winSound) {
      winSound.play().catch(() => {});
    } else if (loseSound) {
      loseSound.play().catch(() => {});
    }

    result.textContent = msg;

    const stats = document.createElement("div");
    stats.classList.add("result-box-stats");
    stats.textContent = "Thanks for playing!";
    result.appendChild(stats);

    const playAgainBtn = document.createElement("button");
    playAgainBtn.textContent = "Play Again";
    playAgainBtn.onclick = () => {
      result.remove();
      gameContainer.remove();
      startSinglePlayerGame();
    };

    const menuBtn = document.createElement("button");
    menuBtn.textContent = "Back to Main Menu";
    menuBtn.onclick = () => {
      result.remove();
      gameContainer.remove();
      mainContent.style.display = "flex";
    };

    result.appendChild(playAgainBtn);
    result.appendChild(menuBtn);
    document.body.appendChild(result);
  }

  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      if (
        gameOver ||
        cell.classList.contains("marked") ||
        currentPlayer !== "user"
      )
        return;

      cell.classList.add("marked");
      const lines = countLines();

      if (lines > cleared) {
        updateTracker(lines);
        cleared = lines;
      }

      if (cleared === 5) {
        showResultBox("🎉 You got BINGO!");
        gameOver = true;
        return;
      }

      currentPlayer = "computer";
      status.textContent = "Computer's turn...";

      setTimeout(() => {
        const unmarked = cells.filter((c) => !c.classList.contains("marked"));
        if (unmarked.length > 0) {
          const choice = unmarked[Math.floor(Math.random() * unmarked.length)];
          choice.classList.add("marked");

          const newLines = countLines();
          if (newLines > cleared) {
            updateTracker(newLines);
            cleared = newLines;
          }

          if (cleared === 5) {
            showResultBox("😢 Better Luck Next Time");
            gameOver = true;
            return;
          }

          currentPlayer = "user";
          status.textContent = "Your turn!";
        }
      }, 800);
    });
  });

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit to Home";
  exitBtn.classList.add("exit-button");
  exitBtn.onclick = () => {
    gameContainer.remove();
    document.querySelector(".result-box")?.remove();
    mainContent.style.display = "flex";
  };

  gameContainer.appendChild(exitBtn);
  mainContent.parentNode.appendChild(gameContainer);
}
