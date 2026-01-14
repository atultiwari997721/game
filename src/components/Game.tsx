import React from 'react';

interface Player {
    id: string;
    username: string;
    score: number;
    isHost: boolean;
}

interface Target {
    id: string;
    x: number;
    y: number;
}

interface RoomState {
    id: string;
    players: Player[];
    status: string;
    targets: Target[];
}

export default function Game({ room, currentUserId, onTargetClick }: { room: RoomState, currentUserId: string, onTargetClick: (targetId: string) => void }) {
    // Sort players by score descending
    const leaderboard = [...room.players].sort((a, b) => b.score - a.score);

    return (
        <div className="flex flex-col w-full h-screen bg-zinc-900 overflow-hidden relative">
            {/* Header / Scoreboard */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
                <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl text-white">
                    <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Leaderboard</h3>
                    <ul className="space-y-2">
                        {leaderboard.map((p, i) => (
                            <li key={p.id} className={`flex items-center gap-4 ${p.id === currentUserId ? 'text-yellow-400' : ''}`}>
                                <span className="font-mono w-4">{i + 1}.</span>
                                <span className="font-bold">{p.username}</span>
                                <span className="font-mono ml-auto">{p.score}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl text-white">
                    <span className="text-zinc-400 text-sm">Room: </span>
                    <span className="font-mono font-bold">{room.id}</span>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 relative cursor-crosshair">
                {room.targets.map((target) => (
                    <button
                        key={target.id}
                        onClick={() => onTargetClick(target.id)}
                        style={{
                            left: `${target.x}%`,
                            top: `${target.y}%`,
                        }}
                        className="absolute w-12 h-12 -ml-6 -mt-6 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] transform active:scale-90 transition-transform animate-bounce-in hover:bg-red-400 border-4 border-white"
                        aria-label="Target"
                    />
                ))}
            </div>
        </div>
    );
}
