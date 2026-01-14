import React from 'react';

interface Player {
    id: string;
    username: string;
    score: number;
    isHost: boolean;
}

interface RoomState {
    id: string;
    players: Player[];
    status: string;
    gameType: string;
}

const getGameName = (type: string) => {
    switch(type) {
        case 'TICTACTOE': return 'Tic Tac Toe';
        case 'SNAKE': return 'Snake & Ladder';
        case 'GOOSE': return 'Goose Hunt';
        case 'ULTIMATE': return 'Ultimate Tic-Tac-Toe';
        case 'LUDO': return 'Ludo';
        default: return type;
    }
};

export default function Room({ room, currentUserId, onStart, onSelectGame }: { room: RoomState, currentUserId: string, onStart: () => void, onSelectGame: (type: string) => void }) {
    const isHost = room.players.find(p => p.id === currentUserId)?.isHost;
    const copyRoomId = () => {
        navigator.clipboard.writeText(room.id);
        // Could add toast here
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Room:</h2>
                <button 
                    onClick={copyRoomId}
                    className="text-3xl font-mono font-bold text-blue-500 tracking-wider bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition"
                    title="Click to copy"
                >
                    {room.id}
                </button>
            </div>


            <div className="flex items-center gap-4 mb-4">
                 <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">Game Mode:</h3>
                 {isHost ? (
                     <select 
                        className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        value={room.gameType || "TICTACTOE"}
                        onChange={(e) => onSelectGame(e.target.value)}
                     >
                         <option value="TICTACTOE">Tic Tac Toe (2 Players)</option>
                         <option value="SNAKE">Snake & Ladder (2-4 Players)</option>
                         <option value="GOOSE">Goose Hunt (Multiplayer)</option>
                         <option value="ULTIMATE">Ultimate TICTACTOE (2 Players)</option>
                         <option value="LUDO">Ludo (2-4 Players)</option>
                     </select>
                 ) : (
                     <span className="font-bold text-lg text-blue-600">{getGameName(room.gameType)}</span>
                 )}
            </div>

            <div className="w-full mb-8">
                <h3 className="text-xl font-semibold mb-4 text-zinc-700 dark:text-zinc-300">Players ({room.players.length}/4)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {room.players.map((player) => (
                        <div key={player.id} className={`flex items-center justify-between p-4 rounded border ${player.id === currentUserId ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {player.username[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-white">
                                    {player.username} {player.id === currentUserId && "(You)"}
                                </span>
                            </div>
                            {player.isHost && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">HOST</span>}
                        </div>
                    ))}
                </div>
            </div>

            {isHost ? (
                <button
                    onClick={onStart}
                    className="w-full max-w-xs py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                >
                    START GAME
                </button>
            ) : (
                <div className="text-zinc-500 italic animate-pulse">
                    Waiting for host to start the game...
                </div>
            )}
        </div>
    );
}
