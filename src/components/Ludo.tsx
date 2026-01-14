import React, { useState } from 'react';

// Types
interface LudoState {
    players: LudoPlayer[]; // Index 0=Red, 1=Green, 2=Yellow, 3=Blue
    turn: number; // Index of the player whose turn it is
    dice: number | null;
    phase: 'ROLL' | 'MOVE';
    winners: number[]; // Indices of players who finished
}

interface LudoPlayer {
    id: string;
    username: string;
    color: string; // 'red', 'green', 'yellow', 'blue'
    pieces: number[]; // 4 pieces. -1=Base, 0-50=Path, 51-56=HomePath, 57=Home
}

interface RoomState {
    id: string;
    players: Player[];
    gameState: LudoState;
}

interface Player {
    id: string;
    username: string;
}

// Helpers/Constants
const COLORS = ['red', 'green', 'yellow', 'blue'];
const PATH_MAP: any = {
    // We can calculate visual grid coordinates (row, col) from a 0-51 path index
    // This is complex. Standard Ludo Path is a loop.
    // Let's hardcode the visual path or use logic? Logic is better but hard.
    // Let's use a coordinate map array for the 52 main cells + home paths.
};

/*
    Coordinate System (0-14, 0-14)
    Top-Left: Red Base
    Top-Right: Green Base
    Bottom-Right: Yellow Base
    Bottom-Left: Blue Base (Standard usually: Red(TL), Green(TR), Yellow(BR), Blue(BL))
    WAIT: Standard Ludo Colors/Order:
    Red (Bottom Left or Top Left?), usually:
    Red (BL) -> Green (TL) -> Yellow (TR) -> Blue (BR)?
    Actually, let's stick to a specific layout:
    TL: Green Base
    TR: Yellow Base
    BL: Red Base
    BR: Blue Base
    
    Path starts from each player's "star" and goes clockwise.
*/

export default function Ludo({ room, currentUserId, onAction }: { room: RoomState, currentUserId: string, onAction: (action: string, payload: any) => void }) {
    const { players: ludoPlayers, turn, dice, phase, winners } = room.gameState;
    const activePlayerIndex = turn;
    const activePlayer = ludoPlayers[activePlayerIndex];
    const isMyTurn = activePlayer?.id === currentUserId;

    // --- RENDER HELPERS ---
    
    // Convert logic position to grid coordinates (row, col 0-14)
    // This is the hardest part of UI.
    const getPieceCoords = (playerIdx: number, piecePos: number) => {
        // Base (-1)
        if (piecePos === -1) {
            // Hardcoded base positions
            const baseOffsets = [
                { r: 2, c: 2 }, // Red (TopLeft for simplicity in this map? No usually colors are fixed)
                // Let's define: P0=Red(TL), P1=Green(TR), P2=Yellow(BR), P3=Blue(BL)
                { r: 2, c: 11 }, // Green (TR)
                { r: 11, c: 11 }, // Yellow (BR)
                { r: 11, c: 2 }, // Blue (BL)
            ];
            // Each base has 4 spots. Just returning center for now or offset slightly?
            // Let's just put them in a 2x2 grid inside the 6x6 base
            const baseParams = [
                { r: 1, c: 1 }, { r: 1, c: 10 }, { r: 10, c: 10 }, { r: 10, c: 1 } // TL of the 6x6 areas
            ];
            const b = baseParams[playerIdx];
            // Assume pieces 0-3
            // We need piece Index too?
            return { r: b.r + 1, c: b.c + 1 }; // Placeholder, needs mapped piece index
        }
        
        // Home (57)
        if (piecePos === 57) {
             return { r: 7, c: 7 }; // Center
        }

        // Main Path & Home Run Calculation is tricky without a lookup table
        // Implementation Detail: Writing a full path lookup or logic is huge.
        // Let's trust I can generate a path lookup array.
        return getGridDisplayFromGlobal(playerIdx, piecePos);
    };

    const handlePieceClick = (pieceIndex: number) => {
        if (isMyTurn && phase === 'MOVE' && dice !== null) {
            onAction('move', { pieceIndex });
        }
    };
    
    const handleRoll = () => {
        if (isMyTurn && phase === 'ROLL') {
            onAction('roll', {});
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-stone-200 p-4 gap-8">
            {/* BOARD */}
            <div className="relative bg-white border-4 border-black w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] shadow-2xl grid grid-cols-15 grid-rows-15">
                {/* Background Grid Generation */}
                {renderBoardBackground()}
                
                {/* Pieces */}
                {ludoPlayers.map((p, pIdx) => (
                    p.pieces.map((pos, pieceIdx) => {
                        const { r, c } = getPieceCoordsWithOffset(pIdx, pieceIdx, pos, ludoPlayers);
                        return (
                            <div 
                                key={`${pIdx}-${pieceIdx}`}
                                onClick={() => p.id === currentUserId && handlePieceClick(pieceIdx)}
                                className={`absolute w-[4%] h-[4%] md:w-[25px] md:h-[25px] rounded-full border-2 border-white shadow-lg z-20 transition-all duration-300
                                    ${getColorClass(p.color)}
                                    ${p.id === currentUserId && phase === 'MOVE' && canMove(pos, dice ?? 0) ? 'cursor-pointer hover:scale-125 ring-2 ring-black animate-bounce' : ''}
                                `}
                                style={{
                                    top: `${(r) * (100/15) + (100/30) - 2}%`, // Centered in cell
                                    left: `${(c) * (100/15) + (100/30) - 2}%`
                                }}
                            >
                                {/* Inner dot */}
                                <div className="w-[40%] h-[40%] bg-black/20 rounded-full m-auto mt-[25%]" />
                            </div>
                        );
                    })
                ))}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-xl w-full max-w-xs text-center border-2 border-stone-300">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-stone-700">Ludo</h2>
                
                <div className="text-sm font-semibold text-stone-500">
                    Current Turn: <span className={`font-bold ${getTextColorClass(activePlayer?.color)}`}>{activePlayer?.username || 'Unknown'}</span>
                </div>

                <div 
                    onClick={handleRoll}
                    className={`h-24 w-24 mx-auto flex items-center justify-center text-4xl font-bold rounded-xl border-4
                        ${isMyTurn && phase === 'ROLL' ? 'cursor-pointer bg-blue-50 border-blue-500 animate-pulse' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    {dice ?? 'Roll'}
                </div>

                 {playersStatus(ludoPlayers, turn)}
                 
                 {isMyTurn && dice === 6 && phase === 'MOVE' && <p className="text-xs text-green-600 font-bold">Roll 6 again logic might apply!</p>}
            </div>
        </div>
    );
}

// --- UTILS ---

function renderBoardBackground() {
    const cells = [];
    // 15x15 Grid
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            let bg = "bg-white";
            let content = null;
            
            // Bases (6x6 corners)
            if (r < 6 && c < 6) bg = "bg-red-500"; // TL
            else if (r < 6 && c > 8) bg = "bg-green-500"; // TR
            else if (r > 8 && c < 6) bg = "bg-blue-500"; // BL
            else if (r > 8 && c > 8) bg = "bg-yellow-500"; // BR
            
            // Home Triangles/Paths
            else if (r === 7 && c > 0 && c < 6) bg = "bg-red-500 opacity-30"; // Red Home Run (Horizontal Left) -> No, Red is usually BL or TL?
                                                                         // Standard: Red=TL, Green=TR, Yellow=BR, Blue=BL?
                                                                         // Let's standardize:
                                                                         // P0: Red (Top-Left base). Path starts 1,6. Home Run: 7,1 -> 7,6?
                                                                         // Actually usually Red starts at 1,6 moves right... NO.
                                                                         // Let's implement generic coloring based on coordinates.
            
            // Center
            else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) bg = "bg-purple-200"; // Center Home
            
            // Main Paths are white usually, with safe spots.
            
            cells.push(
                <div key={`${r}-${c}`} className={`border-[0.5px] border-black/10 flex items-center justify-center text-[8px] text-gray-300 ${bg}`} 
                     style={{ gridColumnStart: c + 1, gridRowStart: r + 1 }}
                >
                    {/* {r},{c} */}
                </div>
            );
        }
    }
    return cells;
}

function getColorClass(color: string) {
    if (color === 'red') return 'bg-red-600';
    if (color === 'green') return 'bg-green-600';
    if (color === 'yellow') return 'bg-yellow-500';
    if (color === 'blue') return 'bg-blue-600';
    return 'bg-gray-500';
}

function getTextColorClass(color: string) {
    if (color === 'red') return 'text-red-600';
    if (color === 'green') return 'text-green-600';
    if (color === 'yellow') return 'text-yellow-600';
    if (color === 'blue') return 'text-blue-600';
    return 'text-gray-500';
}

// Logic to map Linear Pos (0-57) + Player Offset to Grid (15x15)
function getGridDisplayFromGlobal(playerIdx: number, step: number) {
    // This is a simplified hardcoded path for 1 player (Red), then rotated for others?
    // Doing rotation logic is smart.
    // Red (P0 - Top Left) Starts at (6, 1) -> Moves Right to (6,5) -> Up to (0,6) ...
    // Coordinate System: (0,0) is Top-Left.
    
    // Let's define the 52-step path for Red first.
    // 0: Start (6, 1). 
    // 1-4: (6, 2) to (6, 5).
    // 5: Turn Up (5, 6).
    // ...
    // This is tedious to map manually. Let's use a standard path array.
    
    // Path segment relative to a "Wing". Each wing is 6x3.
    // 0-4: Out straight. 5: Turn corner. 6-11: Up center. 12: End center.
    // No, standard path:
    // 5 cells straight, 1 diagonally? No.
    // Let's approximate for MVP:
    // 4 Sides. 13 main steps per side.
    
    // Generic Path for "Side 0" (Left Wing, going Right then Up):
    // (6, 1), (6, 2), (6, 3), (6, 4), (6, 5) -> 5 steps
    // (5, 6), (4, 6), (3, 6), (2, 6), (1, 6), (0, 6) -> 6 steps
    // (0, 7) -> 1 step (Top middle)
    // (0, 8) -> 1 step (Top right) - Down
    
    // Let's just define the list of coords for Red (P0).
    const RED_PATH = [
        {r:6,c:1}, {r:6,c:2}, {r:6,c:3}, {r:6,c:4}, {r:6,c:5}, // 0-4
        {r:5,c:6}, {r:4,c:6}, {r:3,c:6}, {r:2,c:6}, {r:1,c:6}, {r:0,c:6}, // 5-10
        {r:0,c:7}, {r:0,c:8}, // 11-12
        {r:1,c:8}, {r:2,c:8}, {r:3,c:8}, {r:4,c:8}, {r:5,c:8}, // 13-17 (Down Right)
        {r:6,c:9}, {r:6,c:10}, {r:6,c:11}, {r:6,c:12}, {r:6,c:13}, {r:6,c:14}, // 18-23
        {r:7,c:14}, {r:8,c:14}, // 24-25
        {r:8,c:13}, {r:8,c:12}, {r:8,c:11}, {r:8,c:10}, {r:8,c:9}, // 26-30
        {r:9,c:8}, {r:10,c:8}, {r:11,c:8}, {r:12,c:8}, {r:13,c:8}, {r:14,c:8}, // 31-36
        {r:14,c:7}, {r:14,c:6}, // 37-38
        {r:13,c:6}, {r:12,c:6}, {r:11,c:6}, {r:10,c:6}, {r:9,c:6}, // 39-43
        {r:8,c:5}, {r:8,c:4}, {r:8,c:3}, {r:8,c:2}, {r:8,c:1}, {r:8,c:0}, // 44-49
        {r:7,c:0}, // 50 (Last step before home turn)
        // 51 is the same as start? No, 50 is (7,0). Start was (6,1).
        // 51 (Home Stretch Start) -> (7, 1)
        // 52 -> (7, 2) ... 56 -> (7, 6)
        // 57 -> Target (7,7)
    ];
    
    // Home Run for RED (Left side going in)
    const RED_HOME = [
        {r:7,c:1}, {r:7,c:2}, {r:7,c:3}, {r:7,c:4}, {r:7,c:5}, {r:7,c:6}
    ];

    // For other players, we Rotate the point (7,7) is center.
    // 90 degrees rotation around (7,7).
    // P1 (Green/Top): -90 deg? P0 is Left. P1 is Top.
    // Need to rotate logic.
    
    if (step < 51) {
         let pos = RED_PATH[step];
         if (!pos) return {r:7, c:7}; // Error fallback
         
         // Rotate based on player
         return rotateCoord(pos, playerIdx);
    } else if (step === 57) {
        return {r:7, c:7};
    } else {
        // Home Stretch
        const idx = step - 51; // 0 to 5
        let pos = RED_HOME[idx] || {r:7, c:7};
        return rotateCoord(pos, playerIdx);
    }
}

function rotateCoord(pos: {r:number, c:number}, rotation: number) {
    // Rotation 0: Red (Left) -> As mapped.
    // Rotation 1: Green (Top) -> Needs 90 deg Clockwise? 
    // Left Wing (Red) -> Top Wing (Green). 
    // (r, c) -> (c, 14-r) ? 
    // Example: Red Start (6,1). Green Start should be (1, 8)?
    // (6, 1) -> (1, 14-6) = (1, 8). Correct!
    
    let { r, c } = pos;
    for (let i = 0; i < rotation; i++) {
        const newR = c;
        const newC = 14 - r;
        r = newR;
        c = newC;
    }
    return { r, c };
}

function getPieceCoordsWithOffset(playerIdx: number, pieceIdx: number, pos: number, allPlayers: LudoPlayer[]) {
    // Basic coord
    let base = { r: 0, c: 0 };
    
    if (pos === -1) {
        // Base Layout
        const R = (playerIdx === 0 || playerIdx === 1) ? 2 : 11; // 0,1 Top; 2,3 Bottom
        // Re-read base layout:
        // P0 (Red - TL): r2, c2
        // P1 (Green - TR): r2, c11
        // P2 (Yellow - BR): r11, c11
        // P3 (Blue - BL): r11, c2
        
        let startR = 0, startC = 0;
        if (playerIdx === 0) { startR = 1; startC=1; }
        else if (playerIdx === 1) { startR = 1; startC=10; }
        else if (playerIdx === 2) { startR = 10; startC=10; }
        else if (playerIdx === 3) { startR = 10; startC=1; }
        
        // 2x2 grid inside base
        base = {
            r: startR + Math.floor(pieceIdx / 2),
            c: startC + (pieceIdx % 2)
        };
    } else {
        base = getGridDisplayFromGlobal(playerIdx, pos);
    }
    
    // Collision Offset? 
    // If multiple pieces on same cell, slightly offset them?
    // Hard to do nicely in 4% grid.
    // Skipping complex overlapping for now, they will stack (z-indexing might hide some).
    
    return base;
}

function canMove(pos: number, dice: number) {
    if (dice === 6) {
        if (pos === -1) return true; // Start
    }
    if (pos === -1) return false;
    if (pos + dice <= 57) return true;
    return false;
}

function playersStatus(players: LudoPlayer[], turn: number) {
    return (
        <div className="flex flex-col gap-2 w-full mt-4">
            {players.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between text-xs p-2 rounded ${i === turn ? 'bg-stone-100 border border-stone-300' : ''}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getColorClass(p.color)}`}></div>
                        <span className={i === turn ? 'font-bold' : ''}>{p.username}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Global Types for compatibility if pasted
/*
interface LudoPlayer {
    id: string; username: string; color: string; pieces: number[];
}
*/
