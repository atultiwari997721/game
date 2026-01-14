const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Snake & Ladder Constants
const MAX_SNAKE_PLAYERS = 4;

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer);
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // --- LOBBY EVENTS ---

    socket.on("create_room", ({ username }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newRoom = {
        id: roomId,
        players: [{ id: socket.id, username, score: 0, isHost: true, color: getRandomColor() }],
        status: "LOBBY",
        gameType: "TICTACTOE", // Default
        gameState: initTicTacToe()
      };
      
      rooms.set(roomId, newRoom);
      socket.join(roomId);
      callback({ success: true, roomId });
      io.to(roomId).emit("room_update", newRoom);
    });

    socket.on("join_room", ({ roomId, username }, callback) => {
      const room = rooms.get(roomId);
      if (!room) return callback({ success: false, error: "Room not found" });
      if (room.status !== "LOBBY") return callback({ success: false, error: "Game in progress" });
      if (room.players.length >= 8) return callback({ success: false, error: "Room Full" }); // Increased limit

      room.players.push({ id: socket.id, username, score: 0, isHost: false, color: getRandomColor() });
      socket.join(roomId);
      callback({ success: true, roomId });
      io.to(roomId).emit("room_update", room);
    });

    // --- GAME SELECTION ---

    socket.on("select_game", ({ roomId, gameType }) => {
        const room = rooms.get(roomId);
        if (room && isHost(room, socket.id) && room.status === "LOBBY") {
            room.gameType = gameType;
            // Initialize state based on type
            if (gameType === "TICTACTOE") room.gameState = initTicTacToe();
            else if (gameType === "SNAKE") room.gameState = initSnake(room.players);
            else if (gameType === "GOOSE") room.gameState = initGoose(room.players);
            else if (gameType === "ULTIMATE") room.gameState = initUltimate(room.players);
            else if (gameType === "LUDO") room.gameState = initLudo(room.players);
            
            io.to(roomId).emit("room_update", room);
        }
    });

    socket.on("start_game", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && isHost(room, socket.id)) {
            // Re-init state just in case player count changed
            if (room.gameType === "TICTACTOE") room.gameState = initTicTacToe(room.players);
            else if (room.gameType === "SNAKE") room.gameState = initSnake(room.players);
            else if (room.gameType === "GOOSE") room.gameState = initGoose(room.players);
            else if (room.gameType === "ULTIMATE") room.gameState = initUltimate(room.players);
            else if (room.gameType === "LUDO") room.gameState = initLudo(room.players);

            // Special case checks
            if (room.gameType === "SNAKE" && room.players.length < 2) return; // Need min 2
            
            room.status = "PLAYING";
            
            // Start Server Loops if needed
            if (room.gameType === "GOOSE") startGameLoop(room, io);

            io.to(roomId).emit("room_update", room);
        }
    });

    // --- GAME ACTIONS ---

    socket.on("game_action", ({ roomId, action, payload }) => {
        const room = rooms.get(roomId);
        if (!room || room.status !== "PLAYING") return;

        if (room.gameType === "TICTACTOE") handleTicTacToe(room, socket.id, action, payload);
        else if (room.gameType === "SNAKE") handleSnake(room, socket.id, action, payload);
        else if (room.gameType === "GOOSE") handleGoose(room, socket.id, action, payload);
        else if (room.gameType === "ULTIMATE") handleUltimate(room, socket.id, action, payload);
        else if (room.gameType === "LUDO") handleLudo(room, socket.id, action, payload);
        
        io.to(roomId).emit("room_update", room);
    });

    socket.on("disconnect", () => {
        for (const [roomId, room] of rooms.entries()) {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                room.players.splice(idx, 1);
                if (room.players.length === 0) rooms.delete(roomId);
                else {
                    if (!room.players.some(p => p.isHost)) room.players[0].isHost = true;
                    // Reset game if active player left? For now just continue or let it break gracefully specific to game logic
                    if (room.status === "PLAYING" && room.players.length < 2 && room.gameType !== "GOOSE") {
                         room.status = "LOBBY"; // Reset to lobby if not enough players
                    }
                    io.to(roomId).emit("room_update", room);
                }
                break;
            }
        }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

// --- GAME LOGIC HELPERS ---

function getRandomColor() {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function isHost(room, socketId) {
    return room.players.find(p => p.id === socketId)?.isHost;
}

// TIC TAC TOE
function initTicTacToe(players = []) {
    // Pick first two as players
    return {
        board: Array(9).fill(null),
        turn: 'X',
        winner: null,
        draw: false,
        xPlayerId: players[0]?.id || null,
        oPlayerId: players[1]?.id || null,
        score: { X: 0, O: 0 }
    };
}

function handleTicTacToe(room, playerId, action, payload) {
    const state = room.gameState;
    if (action === "reset") {
        room.gameState = initTicTacToe(room.players);
        return;
    }
    if (action !== "move" || state.winner || state.draw) return;

    // Validate Turn
    const isX = playerId === state.xPlayerId;
    const isO = playerId === state.oPlayerId;
    if ((isX && state.turn !== 'X') || (isO && state.turn !== 'O')) return;
    if (!isX && !isO) return;

    const { index } = payload;
    if (state.board[index]) return;

    state.board[index] = state.turn;

    // Check Win
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const hasToWon = wins.some(c => state.board[c[0]] && state.board[c[0]] === state.board[c[1]] && state.board[c[0]] === state.board[c[2]]);

    if (hasToWon) {
        state.winner = state.turn;
    } else if (!state.board.includes(null)) {
        state.draw = true;
    } else {
        state.turn = state.turn === 'X' ? 'O' : 'X';
    }
}

// SNAKE AND LADDER
function initSnake(players) {
    const activePlayers = players.slice(0, 4).map(p => p.id); // Max 4
    const initialPositions = {};
    activePlayers.forEach(id => initialPositions[id] = 1);
    
    return {
        positions: initialPositions,
        turnPlayerId: activePlayers[0],
        activePlayerIds: activePlayers,
        lastRoll: null,
        winnerId: null
    };
}

function handleSnake(room, playerId, action, payload) {
    const state = room.gameState;
    if (action === "reset") {
        room.gameState = initSnake(room.players);
        return;
    }
    if (action !== 'roll' || state.winnerId || state.turnPlayerId !== playerId) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    state.lastRoll = roll;

    let pos = state.positions[playerId];
    if (pos + roll <= 100) {
        pos += roll;
        // Check Snakes/Ladders
        const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
        const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
        
        if (SNAKES[pos]) pos = SNAKES[pos];
        if (LADDERS[pos]) pos = LADDERS[pos];
        
        state.positions[playerId] = pos;
        
        if (pos === 100) {
            state.winnerId = playerId;
            return;
        }
    }
    
    // Next Turn
    if (roll !== 6) {
        const idx = state.activePlayerIds.indexOf(playerId);
        state.turnPlayerId = state.activePlayerIds[(idx + 1) % state.activePlayerIds.length];
    }
}

// GOOSE HUNT
function initGoose(players) {
    // 1 Duck, rest Geese
    const duckIndex = Math.floor(Math.random() * players.length);
    const gamePlayers = players.map((p, i) => ({
        ...p,
        role: i === duckIndex ? 'DUCK' : 'GOOSE',
        status: 'ALIVE',
        x: Math.random() * 500 + 50,
        y: Math.random() * 500 + 50
    }));

    return {
        players: gamePlayers,
        timeLeft: 60,
        winner: null,
        startTime: searchWebTime()
    };
}

function searchWebTime() { return Date.now(); }

function handleGoose(room, playerId, action, payload) {
     const state = room.gameState;
     if (action === "reset") {
         room.gameState = initGoose(room.players);
         room.status = "LOBBY"; // Or restart immediately? Let's restart immediately.
         room.status = "PLAYING";
         // Need to restart loop logic in main server handler if it stopped
         return;
     }

     const player = state.players.find(p => p.id === playerId);
     if (!player || player.status === 'DEAD' || state.winner) return;

     if (action === 'move') {
         const { dx, dy } = payload;
         // Validate speed (server side check ideally, trust for now but clamp)
         const speed = 5; 
         player.x = Math.max(10, Math.min(590, player.x + (dx || 0)));
         player.y = Math.max(10, Math.min(590, player.y + (dy || 0)));
     }
     
     if (action === 'attack' && player.role === 'DUCK') {
         // Check distance to geese
         state.players.forEach(p => {
            if (p.role === 'GOOSE' && p.status === 'ALIVE') {
                const dist = Math.sqrt(Math.pow(p.x - player.x, 2) + Math.pow(p.y - player.y, 2));
                if (dist < 50) { // Kill range
                    p.status = 'DEAD';
                }
            }
         });
         checkGooseWin(state);
     }
}

function checkGooseWin(state) {
    const geeseAlive = state.players.filter(p => p.role === 'GOOSE' && p.status === 'ALIVE').length;
    if (geeseAlive === 0) {
        state.winner = 'DUCK';
    }
}

function startGameLoop(room, io) {
    const interval = setInterval(() => {
        if (room.status !== "PLAYING" || room.gameType !== "GOOSE" || room.gameState.winner) {
            clearInterval(interval);
            return;
        }

        const state = room.gameState;
        if (state.timeLeft > 0) {
            state.timeLeft -= 1;
            if (state.timeLeft <= 0) {
                state.winner = "GEESE";
                io.to(room.id).emit("room_update", room);
                clearInterval(interval);
            } else {
                 io.to(room.id).emit("room_update", room); // Optimization: Don't emit every second fully? For now OK.
            }
        }
    }, 1000);
}

// ULTIMATE TIC TAC TOE
function initUltimate(players = []) {
    return {
        boards: Array(9).fill(null).map(() => Array(9).fill(null)),
        macroBoard: Array(9).fill(null),
        nextBoardIdx: null, // null means any board is valid (start of game or previous target full)
        turn: 'X',
        winner: null,
        xPlayerId: players[0]?.id || null, // Robustness check
        oPlayerId: players[1]?.id || null
    };
}

function handleUltimate(room, playerId, action, payload) {
    const state = room.gameState;
    if (action === "reset") {
        room.gameState = initUltimate(room.players);
        return;
    }
    
    if (action !== "move" || state.winner) return;
    
    // Validate Turn
    const isX = playerId === state.xPlayerId;
    const isO = playerId === state.oPlayerId;
    if ((isX && state.turn !== 'X') || (isO && state.turn !== 'O')) return;
    if (!isX && !isO) return;

    const { boardIdx, cellIdx } = payload;
    
    // Validate Move Rules
    if (state.macroBoard[boardIdx]) return; // Board already won
    if (state.nextBoardIdx !== null && state.nextBoardIdx !== boardIdx) return; // Must play in specific board theory
    if (state.boards[boardIdx][cellIdx]) return; // Cell taken

    // Execute Move
    state.boards[boardIdx][cellIdx] = state.turn;
    
    // Check Small Board Win
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const b = state.boards[boardIdx];
    const hasWonSmall = wins.some(c => b[c[0]] && b[c[0]] === b[c[1]] && b[c[0]] === b[c[2]]);
    
    if (hasWonSmall) {
        state.macroBoard[boardIdx] = state.turn;
    } else if (!b.includes(null)) {
        state.macroBoard[boardIdx] = 'D'; // Draw logic for small board? Usually just locked.
    }

    // Check Large Board Win
    const macroWin = wins.some(c => state.macroBoard[c[0]] && state.macroBoard[c[0]] !== 'D' && state.macroBoard[c[0]] === state.macroBoard[c[1]] && state.macroBoard[c[0]] === state.macroBoard[c[2]]);
    if (macroWin) {
        state.winner = state.turn;
    } else if (!state.macroBoard.includes(null)) {
        state.winner = 'D'; // Draw
    }
    
    // Prepare Next Turn
    state.turn = state.turn === 'X' ? 'O' : 'X';
    
    // Determine Next Board
    // The cellIdx played becomes the boardIdx for the next player
    const nextTargetIdx = cellIdx;
    
    if (state.macroBoard[nextTargetIdx]) {
        state.nextBoardIdx = null; // Board won/full, play anywhere
    } else {
        state.nextBoardIdx = nextTargetIdx;
    }
}

// LUDO
function initLudo(players) {
    const colors = ['red', 'green', 'yellow', 'blue'];
    const activePlayers = players.slice(0, 4).map((p, i) => ({
        id: p.id,
        username: p.username,
        color: colors[i],
        pieces: [-1, -1, -1, -1] // 4 Pieces at Home (-1)
    }));

    return {
        players: activePlayers,
        turn: 0,
        dice: null,
        phase: 'ROLL', // ROLL or MOVE
        winners: []
    };
}

function handleLudo(room, playerId, action, payload) {
    const state = room.gameState;
    if (action === "reset") {
        room.gameState = initLudo(room.players);
        return;
    }
    
    // Validate Player
    const playerIdx = state.turn;
    const player = state.players[playerIdx];
    if (player.id !== playerId) return;

    if (action === 'roll') {
        if (state.phase !== 'ROLL') return;
        
        const roll = Math.floor(Math.random() * 6) + 1;
        state.dice = roll;
        
        // Check moves possibilities
        const movable = player.pieces.some(pos => ludoCanMove(pos, roll));
        
        if (movable) {
            state.phase = 'MOVE';
        } else {
            // No moves, next turn
            // Delay slightly? No, immediate.
            nextLudoTurn(state);
        }
    } else if (action === 'move') {
        if (state.phase !== 'MOVE') return;
        const { pieceIndex } = payload;
        const currentPos = player.pieces[pieceIndex];
        const attempt = ludoMove(currentPos, state.dice);
        
        if (attempt !== null) {
            // Apply Move
            player.pieces[pieceIndex] = attempt;
            
            // Winning Condition
            if (attempt === 57) {
                // Piece finished
            }
            
            // Check Collision/Capture (Only on main path < 51)
            if (attempt < 51) {
                // Calculate Global Grid Position to check against others
                // Map my 0-51 to global 0-51.
                // P0(Red): 0-51 = Global 0-51
                // P1(Green): 0-51 = Global 13-51, 0-12
                // ...
                // Formula: Global = (Local + Offset) % 52
                // Offsets: P0=0, P1=13, P2=26, P3=39
                const myOffset = playerIdx * 13;
                const myGlobal = (attempt + myOffset) % 52;
                
                // Safe Zones: 0, 8, 13, 21, 26, 34, 39, 47 (Global indices)
                // Just defined as Global Safe Zones relative to 0 start (Red start is 0).
                // Actually start is safe.
                const SAFE_GLOBALS = [0, 8, 13, 21, 26, 34, 39, 47];
                const isSafe = SAFE_GLOBALS.includes(myGlobal);
                
                if (!isSafe) {
                    // Check enemies
                    state.players.forEach((opp, oppIdx) => {
                        if (oppIdx !== playerIdx) {
                            opp.pieces.forEach((oppPos, oppPieceIdx) => {
                                if (oppPos > -1 && oppPos < 51) {
                                    const oppOffset = oppIdx * 13;
                                    const oppGlobal = (oppPos + oppOffset) % 52;
                                    
                                    if (myGlobal === oppGlobal) {
                                        // Capture!
                                        opp.pieces[oppPieceIdx] = -1; // Send Home
                                        // Bonus Turn? Standard rules say yes.
                                        // Implementing Bonus Turn for 6 or Capture would be nice.
                                        // For simplicity: No bonus for capture right now, just standard flow.
                                    }
                                }
                            });
                        }
                    });
                }
            }
            
            // Next Turn (unless 6)
            if (state.dice === 6) {
                state.phase = 'ROLL';
                state.dice = null;
            } else {
                nextLudoTurn(state);
            }
        }
    }
}

function ludoCanMove(pos, dice) {
    if (pos === -1) return dice === 6;
    if (pos === 57) return false;
    return pos + dice <= 57;
}

function ludoMove(pos, dice) {
    if (pos === -1) return dice === 6 ? 0 : null;
    if (pos + dice <= 57) return pos + dice;
    return null;
}

function nextLudoTurn(state) {
    state.phase = 'ROLL';
    state.dice = null;
    let next = (state.turn + 1) % state.players.length;
    // Skip finished players if we implement winning
    state.turn = next;
}
