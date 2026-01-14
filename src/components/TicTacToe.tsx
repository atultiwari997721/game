import React from 'react';

interface TicTacToeState {
    board: (string | null)[];
    turn: string; // 'X' or 'O'
    winner: string | null;
    draw: boolean;
    xPlayerId: string;
    oPlayerId: string;
}

interface RoomState {
    id: string;
    players: Player[];
    gameState: TicTacToeState;
}

interface Player {
    id: string;
    username: string;
}

export default function TicTacToe({ room, currentUserId, onAction }: { room: RoomState, currentUserId: string, onAction: (action: string, payload: any) => void }) {
    const { board, turn, winner, draw, xPlayerId, oPlayerId } = room.gameState;
    
    // Determine my role
    const isX = currentUserId === xPlayerId;
    const isO = currentUserId === oPlayerId;
    const isSpectator = !isX && !isO;
    const mySymbol = isX ? 'X' : isO ? 'O' : null;
    const isMyTurn = mySymbol === turn;

    const xPlayer = room.players.find(p => p.id === xPlayerId);
    const oPlayer = room.players.find(p => p.id === oPlayerId);

    const handleClick = (index: number) => {
        if (isMyTurn && !board[index] && !winner && !draw) {
            onAction('move', { index });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-8">Tic Tac Toe</h1>
            
            <div className="flex justify-between w-full max-w-sm mb-8">
                <div className={`flex flex-col items-center p-4 rounded-lg ${turn === 'X' ? 'bg-blue-600' : 'bg-zinc-800'} transition-colors`}>
                    <span className="text-2xl font-bold">X</span>
                    <span className="text-sm truncate max-w-[100px]">{xPlayer?.username || 'Waiting...'}</span>
                </div>
                <div className={`flex flex-col items-center p-4 rounded-lg ${turn === 'O' ? 'bg-red-600' : 'bg-zinc-800'} transition-colors`}>
                    <span className="text-2xl font-bold">O</span>
                    <span className="text-sm truncate max-w-[100px]">{oPlayer?.username || 'Waiting...'}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-zinc-700 p-2 rounded-lg">
                {board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        disabled={!!cell || !!winner || !!draw || !isMyTurn}
                        className={`w-24 h-24 sm:w-32 sm:h-32 bg-zinc-800 text-6xl font-bold flex items-center justify-center rounded hover:bg-zinc-750 transition-colors
                            ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}
                            ${(!cell && isMyTurn && !winner && !draw) ? 'hover:bg-zinc-700 cursor-pointer' : 'cursor-default'}
                        `}
                    >
                        {cell}
                    </button>
                ))}
            </div>

            <div className="mt-8 text-2xl font-bold h-12">
                {winner ? (
                    <span className="text-green-500 animate-bounce block">Winner: {winner === 'X' ? xPlayer?.username : oPlayer?.username}!</span>
                ) : draw ? (
                    <span className="text-yellow-500">It's a Draw!</span>
                ) : (
                    <span>Current Turn: <span className={turn === 'X' ? 'text-blue-500' : 'text-red-500'}>{turn}</span></span>
                )}
            </div>
            
            {isSpectator && <div className="mt-4 text-zinc-500">You are spectating</div>}
            
            {(winner || draw) && isX && ( /* Only host/X can restart usually, but simplicity allows anyone or auto-restart */
                 <button onClick={() => onAction('reset', {})} className="mt-4 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded">Play Again</button>
            )}
        </div>
    );
}
