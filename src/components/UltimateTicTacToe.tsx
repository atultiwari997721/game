import React from 'react';

interface UltimateState {
    boards: (string | null)[][]; // 9 boards, each 9 cells
    macroBoard: (string | null)[]; // 9 cells representing big board (X, O, D, null)
    nextBoardIdx: number | null; // Index of the board next player must play in (null = any)
    turn: string;
    winner: string | null;
    xPlayerId: string;
    oPlayerId: string;
}

interface RoomState {
    id: string;
    players: Player[];
    gameState: UltimateState;
}

interface Player {
    id: string;
    username: string;
}

export default function UltimateTicTacToe({ room, currentUserId, onAction }: { room: RoomState, currentUserId: string, onAction: (action: string, payload: any) => void }) {
    const { boards, macroBoard, nextBoardIdx, turn, winner, xPlayerId, oPlayerId } = room.gameState;
    
    const isX = currentUserId === xPlayerId;
    const isO = currentUserId === oPlayerId;
    const isSpectator = !isX && !isO;
    const mySymbol = isX ? 'X' : isO ? 'O' : null;
    const isMyTurn = mySymbol === turn;

    const xPlayer = room.players.find(p => p.id === xPlayerId);
    const oPlayer = room.players.find(p => p.id === oPlayerId);

    const handleCellClick = (boardIdx: number, cellIdx: number) => {
        if (!isMyTurn || winner) return;
        // Valid move check logic is mainly on server, but client should prevent obvious bad clicks
        if (nextBoardIdx !== null && nextBoardIdx !== boardIdx) return;
        if (macroBoard[boardIdx]) return; // Board already won/full
        if (boards[boardIdx][cellIdx]) return; // Cell taken

        onAction('move', { boardIdx, cellIdx });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4 font-sans">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">Ultimate Tic-Tac-Toe</h1>
            
            <div className="flex justify-between w-full max-w-lg mb-6 items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className={`flex flex-col items-center px-4 py-2 rounded-lg ${turn === 'X' ? 'bg-blue-900/50 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'opacity-50'}`}>
                    <span className="text-3xl font-black text-blue-500">X</span>
                    <span className="text-xs font-bold">{xPlayer?.username || '...'}</span>
                </div>
                
                <div className="text-center px-4">
                    {winner ? (
                        <div className="text-xl font-bold text-green-400 animate-pulse">
                            {winner === 'D' ? 'DRAW!' : `${winner === 'X' ? xPlayer?.username : oPlayer?.username} WINS!`}
                        </div>
                    ) : (
                        <div className="text-zinc-500 font-mono text-sm">VS</div>
                    )}
                </div>

                <div className={`flex flex-col items-center px-4 py-2 rounded-lg ${turn === 'O' ? 'bg-red-900/50 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'opacity-50'}`}>
                    <span className="text-3xl font-black text-red-500">O</span>
                    <span className="text-xs font-bold">{oPlayer?.username || '...'}</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-700 p-2 rounded-lg shadow-2xl relative">
                
                {/* Overlay for Global Win if needed, usually just disable input */}
                
                {boards.map((smallBoard, bIdx) => {
                    const isBoardWon = !!macroBoard[bIdx];
                    const isValidTarget = !winner && !isBoardWon && (nextBoardIdx === null || nextBoardIdx === bIdx);
                    
                    return (
                        <div key={bIdx} className={`relative bg-zinc-900 p-0.5 sm:p-1 gap-0.5 sm:gap-1 grid grid-cols-3 grid-rows-3 w-[26vw] h-[26vw] sm:w-36 sm:h-36 max-w-[100px] max-h-[100px] sm:max-w-none sm:max-h-none transition-all duration-300
                            ${isValidTarget && isMyTurn ? 'ring-2 ring-yellow-400 ring-offset-1 sm:ring-offset-2 ring-offset-zinc-800 z-10' : ''}
                            ${isValidTarget && !isMyTurn ? 'ring-1 ring-zinc-500' : 'opacity-90'}
                        `}>
                            {/* Small Cells */}
                            {smallBoard.map((cell, cIdx) => (
                                <button
                                    key={cIdx}
                                    onClick={() => handleCellClick(bIdx, cIdx)}
                                    disabled={!!cell || isBoardWon || (nextBoardIdx !== null && nextBoardIdx !== bIdx) || !isMyTurn}
                                    className={`w-full h-full flex items-center justify-center text-lg sm:text-2xl font-bold rounded-sm transition-colors
                                        ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}
                                        ${!cell && !isBoardWon ? 'bg-zinc-800 hover:bg-zinc-750' : 'bg-zinc-800/50'}
                                        ${isValidTarget && !cell && isMyTurn ? 'cursor-pointer hover:bg-zinc-700' : 'cursor-default'}
                                    `}
                                >
                                    {cell}
                                </button>
                            ))}
                            
                            {/* Won Board Overlay */}
                            {isBoardWon && (
                                <div className={`absolute inset-0 flex items-center justify-center text-6xl sm:text-7xl font-black bg-black/60 backdrop-blur-[1px]
                                    ${macroBoard[bIdx] === 'X' ? 'text-blue-500' : macroBoard[bIdx] === 'O' ? 'text-red-500' : 'text-zinc-500'}
                                `}>
                                    {macroBoard[bIdx]}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isSpectator && <div className="mt-6 text-zinc-500 font-mono text-sm border border-zinc-800 px-3 py-1 rounded-full">Spectator Mode</div>}
            
            {(winner) && isX && (
                <button onClick={() => onAction('reset', {})} className="mt-8 px-8 py-3 bg-zinc-100 text-black font-bold rounded-full hover:bg-white hover:scale-105 transition-all">
                    Play Again
                </button>
            )}
        </div>
    );
}
