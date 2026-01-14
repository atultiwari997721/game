import React, { useEffect, useRef, useState } from 'react';

// Configuration
const CANVAS_SIZE = 600;
const PLAYER_SIZE = 20;
const MOVEMENT_SPEED = 3;
const KILL_DISTANCE = 40;
const ROUND_TIME = 60; // Seconds

interface Player {
    id: string;
    username: string;
    role: 'DUCK' | 'GOOSE';
    status: 'ALIVE' | 'DEAD';
    x: number;
    y: number;
    color: string;
}

interface GooseState {
    players: Player[];
    timeLeft: number;
    winner: 'DUCK' | 'GEESE' | null;
}

interface RoomState {
    gameState: GooseState;
}

export default function GooseHunt({ room, currentUserId, onAction }: { room: RoomState, currentUserId: string, onAction: (action: string, payload: any) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GooseState>(room.gameState);
    
    // Sync external state changes to local state for rendering
    useEffect(() => {
        setGameState(room.gameState);
    }, [room]);

    // Input Handling
    useEffect(() => {
        const keys = new Set<string>();

        const handleKeyDown = (e: KeyboardEvent) => {
            keys.add(e.code);
            
            // Attack action for Duck
            if(e.code === 'Space') {
                 onAction('attack', {});
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Movement Loop
        const interval = setInterval(() => {
            const myPlayer = gameState.players.find(p => p.id === currentUserId);
            if (!myPlayer || myPlayer.status === 'DEAD' || gameState.winner) return;

            let dx = 0;
            let dy = 0;
            if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
            if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
            if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
            if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;

            if (dx !== 0 || dy !== 0) {
                // Normalize vector
                const mag = Math.sqrt(dx * dx + dy * dy);
                dx = (dx / mag) * MOVEMENT_SPEED;
                dy = (dy / mag) * MOVEMENT_SPEED;
                onAction('move', { dx, dy });
            }
        }, 1000 / 60); // 60hz

        return () => {
             window.removeEventListener('keydown', handleKeyDown);
             window.removeEventListener('keyup', handleKeyUp);
             clearInterval(interval);
        };
    }, [currentUserId, gameState.players, gameState.winner, onAction]);

    // Rendering Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#18181b'; // zinc-900
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw Boundary/Map (Simple box for now)
        ctx.strokeStyle = '#3f3f46'; // zinc-700
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw Players
        gameState.players.forEach(p => {
             if (p.status === 'DEAD') {
                 // Draw Dead Body
                 ctx.fillStyle = '#52525b'; // zinc-600
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, PLAYER_SIZE + 5, 0, Math.PI * 2);
                 ctx.fill();
             } else {
                 // Roles are hidden? Or visible? 
                 // For simplicity, let's make roles visible to self, but maybe hidden to others unless close? 
                 // Requirements didn't specify, doing simple explicit roles for now.
                 
                 ctx.fillStyle = p.color;
                 
                 // If I am this player, highlight
                 if (p.id === currentUserId) {
                     ctx.shadowColor = 'white';
                     ctx.shadowBlur = 10;
                 } else {
                     ctx.shadowBlur = 0;
                 }
                 
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
                 ctx.fill();
                 
                 // Draw Name
                 ctx.fillStyle = 'white';
                 ctx.font = '12px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText(p.username, p.x, p.y - PLAYER_SIZE - 5);
                 
                 // Draw Weapon/Icon if Duck
                 if(p.role === 'DUCK') {
                      
                 }
             }
        });

    }, [gameState]);

    const myPlayer = gameState.players.find(p => p.id === currentUserId);

    return (
        <div className="flex bg-black min-h-screen items-center justify-center p-4">
            <div className="flex flex-col gap-4 relative">
                <div className="flex justify-between text-white bg-zinc-800 p-4 rounded-lg">
                    <div className="text-xl font-bold">Time: {gameState.timeLeft}s</div>
                    <div className="text-xl font-bold">
                        Role: <span className={myPlayer?.role === 'DUCK' ? 'text-red-500' : 'text-blue-500'}>{myPlayer?.role}</span>
                    </div>
                </div>

                <div className="relative border-4 border-zinc-700 rounded overflow-hidden">
                    <canvas 
                        ref={canvasRef} 
                        width={CANVAS_SIZE} 
                        height={CANVAS_SIZE}
                        className="bg-zinc-900 cursor-none"
                    />
                    
                    {gameState.winner && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col gap-4 z-10">
                            <h1 className="text-6xl font-black text-white uppercase tracking-tighter">
                                {gameState.winner === 'DUCK' ? <span className="text-red-600">Duck Wins!</span> : <span className="text-blue-500">Geese Survives!</span>}
                            </h1>
                            {myPlayer?.role === 'DUCK' && gameState.winner === 'DUCK' && <div className="text-2xl text-yellow-400">Total Domination!</div>}
                            <button onClick={() => onAction('reset', {})} className="px-8 py-4 bg-zinc-100 text-black font-bold rounded hover:bg-white text-xl">Play Again</button>
                        </div>
                    )}
                </div>
                
                <div className="text-zinc-500 text-sm text-center">
                    Use <span className="bg-zinc-800 px-1 rounded text-white">WASD</span> or <span className="bg-zinc-800 px-1 rounded text-white">ARROWS</span> to move. 
                    {myPlayer?.role === 'DUCK' && <span> Press <span className="bg-zinc-800 px-1 rounded text-amber-500">SPACE</span> to kill!</span>}
                </div>
            </div>
        </div>
    );
}
