// ✅ FINAL multiplayer.js

const socket = io("https://api-bingo-bonanza-multiplayer.onrender.com");

let isHost = false;
let myTurn = false;
let roomCode = "";
let clearedLines = 0;
let gameOver = false;

let gameContainer, tracker, status, grid, lastCalled;
let cells = [];

// ✅ Start game
socket.on("startGame", ({ roomCode: rc, currentTurn }) => {
  roomCode = rc;
  myTurn = (isHost && currentTurn === "host") || (!isHost && currentTurn === "guest");
  const numbers = shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
  buildBoard(numbers);
});

// ✅ Rematch start
socket.on("startRematch", ({ currentTurn }) => {
  removeResultBoxes();
  resetBoard(currentTurn);
});

// ✅ Rematch declined
socket.on("rematchDeclined", () => {
  alert("Opponent declined the rematch.");
  location.href = "https://a-sagarreddy.github.io/bingo-bonanza-multiplayer/";
});

// ✅ If you get a rematch request
socket.on("rematchRequested", () => {
  removeResultBoxes();
  const box = document.createElement("div");
  box.classList.add("result-box");
  box.textContent = "Opponent wants a rematch!";

  const acceptBtn = document.createElement("button");
  acceptBtn.textContent = "Accept";
  acceptBtn.onclick = () => {
    socket.emit("rematchResponse", { roomCode, accepted: true });
    removeResultBoxes();
    resetBoard(isHost ? "host" : "guest");
  };
  box.appendChild(acceptBtn);

  const declineBtn = document.createElement("button");
  declineBtn.textContent = "Decline";
  declineBtn.onclick = () => {
    socket.emit("rematchResponse", { roomCode, accepted: false });
    location.href = "https://a-sagarreddy.github.io/bingo-bonanza-multiplayer/";
  };
  box.appendChild(declineBtn);

  document.body.appendChild(box);
});

// ✅ Host creates room
document.getElementById("createRoomPrompt").onclick = () => {
  const inputArea = document.getElementById("inputArea");
  inputArea.innerHTML = `
    <input id="hostName" placeholder="Enter your name" />
    <button id="startHost">Create Room</button>
  `;

  document.getElementById("startHost").onclick = () => {
    const name = document.getElementById("hostName").value.trim();
    if (!name) return alert("Enter your name!");

    roomCode = Math.floor(Math.random() * 900000 + 100000).toString();
    socket.emit("createRoom", { roomCode, playerName: name });
    isHost = true;
    myTurn = true;

    inputArea.innerHTML = `
      <p>Room Code: <strong>${roomCode}</strong></p>
      <p>Share this code with your friend to join!</p>
    `;
  };
};

// ✅ Guest joins room
document.getElementById("joinRoomPrompt").onclick = () => {
  const inputArea = document.getElementById("inputArea");
  inputArea.innerHTML = `
    <input id="guestName" placeholder="Enter your name" />
    <input id="joinCode" placeholder="Enter Room Code" />
    <button id="startJoin">Join Room</button>
  `;

  document.getElementById("startJoin").onclick = () => {
    const name = document.getElementById("guestName").value.trim();
    const code = document.getElementById("joinCode").value.trim();
    if (!name || !code) return alert("Enter name and room code!");
    roomCode = code;
    socket.emit("joinRoom", { roomCode, playerName: name });
    isHost = false;
    myTurn = false;
  };
};

// ✅ Shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ✅ Build initial board
function buildBoard(numbers) {
  document.querySelector(".hd").style.display = "none";

  if (gameContainer) gameContainer.remove();

  gameContainer = document.createElement("div");
  gameContainer.classList.add("game-container");

  const roomTitle = document.createElement("h2");
  roomTitle.textContent = `Room: ${roomCode}`;
  gameContainer.appendChild(roomTitle);

  tracker = document.createElement("div");
  tracker.classList.add("bingo-tracker");
  tracker.innerHTML = "B I N G O".split(" ").map(l => `<span class="bingo-letter">${l}</span>`).join("");
  gameContainer.appendChild(tracker);

  lastCalled = document.createElement("p");
  lastCalled.id = "lastCalled";
  lastCalled.textContent = "Last Number: -";
  gameContainer.appendChild(lastCalled);

  status = document.createElement("p");
  status.textContent = myTurn ? "Your turn!" : "Opponent's turn";
  gameContainer.appendChild(status);

  grid = document.createElement("div");
  grid.classList.add("bingo-grid");
  gameContainer.appendChild(grid);

  cells = [];
  clearedLines = 0;
  gameOver = false;

  numbers.forEach(num => {
    const cell = document.createElement("div");
    cell.classList.add("bingo-cell");
    cell.textContent = num;
    grid.appendChild(cell);
    cells.push(cell);

    cell.addEventListener("click", () => {
      if (gameOver || !myTurn || cell.classList.contains("marked")) return;
      markCell(cell, true);
      socket.emit("moveMade", { roomCode, number: num });
      myTurn = false;
      status.textContent = "Opponent's turn";
    });
  });

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit to Home";
  exitBtn.classList.add("exit-button");
  exitBtn.onclick = () => location.href = "https://a-sagarreddy.github.io/bingo-bonanza-multiplayer/";
  gameContainer.appendChild(exitBtn);

  document.body.appendChild(gameContainer);
}

// ✅ Mark a cell
function markCell(cell, isOwn) {
  if (gameOver) return;

  cell.classList.add("marked");
  lastCalled.textContent = `Last Number: ${cell.textContent}`;

  const lines = countLines();
  if (lines > clearedLines) {
    updateTracker(lines);
    clearedLines = lines;

    const bonusSound = document.getElementById("bonusSound");
    if (bonusSound) bonusSound.play();
  }

  if (clearedLines >= 5) {
    gameOver = true;
    socket.emit("gameOver", roomCode);
    showResultBox(isOwn ? "🎉 You got BINGO!" : "😢 Opponent got BINGO!", isOwn);
  }
}

// ✅ When move happens
socket.on("moveMade", ({ number, nextTurn }) => {
  if (gameOver) return;

  const cell = cells.find(c => Number(c.textContent) === number);
  if (cell && !cell.classList.contains("marked")) {
    markCell(cell, false);
  }
  myTurn = (isHost && nextTurn === "host") || (!isHost && nextTurn === "guest");
  status.textContent = myTurn ? "Your turn!" : "Opponent's turn";
});

// ✅ Opponent wins
socket.on("gameOver", () => {
  if (!gameOver) {
    gameOver = true;
    showResultBox("😢 Opponent got BINGO!", false);
  }
});

// ✅ Opponent leaves
socket.on("opponentLeft", () => {
  gameOver = true;
  showResultBox("🚫 Opponent left the game.", false, true);
});

// ✅ Count BINGO lines
function countLines() {
  const isMarked = i => cells[i].classList.contains("marked");
  let lines = 0;
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every(c => isMarked(r * 5 + c))) lines++;
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every(r => isMarked(r * 5 + c))) lines++;
  }
  if ([0, 6, 12, 18, 24].every(isMarked)) lines++;
  if ([4, 8, 12, 16, 20].every(isMarked)) lines++;
  return lines;
}

// ✅ Update B I N G O
function updateTracker(count) {
  document.querySelectorAll(".bingo-letter").forEach((el, i) => {
    el.classList.toggle("struck", i < count);
  });
}

// ✅ Reset board for rematch
function resetBoard(currentTurn) {
  const numbers = shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
  buildBoard(numbers);
  myTurn = (isHost && currentTurn === "host") || (!isHost && currentTurn === "guest");
  status.textContent = myTurn ? "Your turn!" : "Opponent's turn";
}

// ✅ Remove result boxes
function removeResultBoxes() {
  document.querySelectorAll(".result-box").forEach(el => el.remove());
}

// ✅ Show result box
function showResultBox(msg, isWinner = false, opponentLeft = false) {
  removeResultBoxes();

  const result = document.createElement("div");
  result.classList.add("result-box");
  result.textContent = msg;

  if (isWinner) {
    confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    const winSound = document.getElementById("winSound");
    if (winSound) winSound.play();
  } else if (!opponentLeft) {
    const loseSound = document.getElementById("loseSound");
    if (loseSound) loseSound.play();
  }

  const playAgainBtn = document.createElement("button");
  playAgainBtn.textContent = "Request Rematch";
  playAgainBtn.onclick = () => {
    removeResultBoxes();
    socket.emit("requestRematch", { roomCode });
    const wait = document.createElement("div");
    wait.classList.add("result-box");
    wait.textContent = "⏳ Waiting for opponent...";
    document.body.appendChild(wait);
  };
  result.appendChild(playAgainBtn);

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit to Home";
  exitBtn.onclick = () => location.href = "https://a-sagarreddy.github.io/bingo-bonanza-multiplayer/";
  result.appendChild(exitBtn);

  document.body.appendChild(result);
}
