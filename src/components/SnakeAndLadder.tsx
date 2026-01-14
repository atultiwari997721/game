import React, { useState } from 'react';

// Snake and Ladders lookup tables
const SNAKES: { [key: number]: number } = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS: { [key: number]: number } = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

interface Player {
    id: string;
    username: string;
    color: string;
}

interface SnakeState {
    positions: { [playerId: string]: number };
    turnPlayerId: string;
    lastRoll: number | null;
    winnerId: string | null;
    activePlayerIds: string[]; // Logic to know who is playing order
}

interface RoomState {
    players: Player[];
    gameState: SnakeState;
}

export default function SnakeAndLadder({ room, currentUserId, onAction }: { room: RoomState, currentUserId: string, onAction: (action: string, payload: any) => void }) {
    const { positions, turnPlayerId, lastRoll, winnerId, activePlayerIds } = room.gameState;
    const isMyTurn = currentUserId === turnPlayerId;

    const [diceAnimating, setDiceAnimating] = useState(false);

    const handleRoll = () => {
        if (isMyTurn && !winnerId && !diceAnimating) {
            setDiceAnimating(true);
            // Simulate animation time then send request
            setTimeout(() => {
                setDiceAnimating(false);
                onAction('roll', {});
            }, 600);
        }
    };

    const renderBoard = () => {
        const cells = [];
        let isReverse = false;
        
        for (let row = 9; row >= 0; row--) {
            const rowCells = [];
            for (let col = 0; col < 10; col++) {
                const num = row * 10 + col + 1;
                rowCells.push(num);
            }
            if (isReverse) rowCells.reverse();
            cells.push(...rowCells);
            isReverse = !isReverse;
        }

        return cells.map(num => {
            const playersHere = activePlayerIds.filter(pid => positions[pid] === num);
            const snakeDest = SNAKES[num];
            const ladderDest = LADDERS[num];
            
            let bgClass = (Math.floor((num - 1) / 10) % 2 === 0) 
                            ? ((num % 2 === 0) ? 'bg-amber-100' : 'bg-amber-200')
                            : ((num % 2 === 0) ? 'bg-amber-100' : 'bg-amber-200');

            return (
                <div key={num} className={`relative flex items-center justify-center w-full h-full border-[0.5px] border-amber-900/10 ${bgClass} text-xs sm:text-sm font-semibold text-amber-900/50`}>
                    <span className="absolute top-0 left-1">{num}</span>
                    
                    {/* Snake/Ladder Indicators (Visual only, ideally uses SVG/Image overlay) */}
                    {snakeDest && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 text-red-500 font-bold rotate-12">SNAKE</div>}
                    {ladderDest && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 text-green-500 font-bold -rotate-12">LADDER</div>}
                    
                    {/* Players */}
                    <div className="flex gap-1 flex-wrap justify-center z-10">
                        {playersHere.map(pid => {
                            const p = room.players.find(rp => rp.id === pid);
                            return (
                                <div key={pid} 
                                    className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md transform hover:scale-125 transition-transform"
                                    style={{ backgroundColor: p?.color || 'gray' }}
                                    title={p?.username}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    const activePlayers = room.players.filter(p => activePlayerIds.includes(p.id));

    return (
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-stone-800 p-4 gap-8">
            <div className="bg-white p-2 rounded-lg shadow-2xl relative w-full max-w-[500px] aspect-square grid grid-cols-10 grid-rows-10">
                {renderBoard()}
            </div>

            <div className="flex flex-col gap-6 bg-stone-900 p-6 rounded-xl text-white min-w-[300px]">
                <h2 className="text-3xl font-bold text-center text-amber-400">Snake & Ladder</h2>
                
                {/* Player List */}
                <div className="flex flex-col gap-2">
                    {activePlayers.map(p => (
                        <div key={p.id} className={`flex items-center p-2 rounded ${p.id === turnPlayerId ? 'bg-stone-700 ring-2 ring-amber-400' : 'bg-stone-800'}`}>
                            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: p.color }}></div>
                            <span className="flex-1">{p.username}</span>
                            {p.id === turnPlayerId && <span className="text-xs text-amber-400">TURN</span>}
                            {p.id === winnerId && <span className="text-xs text-green-400 font-bold">WINNER</span>}
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4 mt-auto">
                    <div className={`w-20 h-20 bg-white rounded-xl flex items-center justify-center text-5xl font-bold text-black border-4 border-stone-600 ${diceAnimating ? 'animate-spin' : ''}`}>
                         {lastRoll ?? '?'}
                    </div>

                    {!winnerId && (
                        <button
                         onClick={handleRoll}
                         disabled={!isMyTurn || diceAnimating}
                         className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:cursor-not-allowed rounded-lg font-bold text-xl transition-all shadow-[0_4px_0_rgb(146,64,14)] active:shadow-none active:translate-y-1"
                        >
                            {isMyTurn ? (diceAnimating ? 'Rolling...' : 'ROLL DICE') : 'Waiting...'}
                        </button>
                    )}
                    
                    {winnerId && winnerId === currentUserId && (
                        <button onClick={() => onAction('reset', {})} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded font-bold">New Game</button>
                    )}
                </div>
            </div>
        </div>
    );
}
