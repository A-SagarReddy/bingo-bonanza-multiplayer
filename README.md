# bingo-bonanza-multiplayer
“A real-time multiplayer Bingo game with rematch, built with Node.js, Socket.io, and plain JavaScript.”

# Bingo Bonanza 🎉

This is a simple real-time multiplayer Bingo game built with:
- **Node.js**
- **Socket.IO**
- **HTML, CSS, JavaScript**

## ✅ Features

- Host a room with a unique 6-digit code
- Join a friend's room with the code
- Real-time moves and winner detection
- Request rematch with accept/decline flow
- Handles player disconnects gracefully

## 🚀 How to Run

1. Clone or download this project.
2. Open terminal in project root.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the server:

   ```bash
   node server.js
   ```

5. Open **http://localhost:3000** in two browser tabs or different devices to test.

## 📂 Project Structure

```
📁 public/
 ├─ index.html
 ├─ style.css
 ├─ multiplayer.js
 ├─ script.js
 ├─ images/
 ├─ sounds/
server.js
```

## 🔄 Rematch Flow

- After the game ends, click **Request Rematch**
- Opponent gets **Accept/Decline** prompt
- Accept → board resets automatically
- Decline → both return to home

## 📢 Notes

- Make sure ports are free (default: **3000**)
- For production, use **process.env.PORT**
- Built for learning and fun!

Enjoy the game!

