"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Lobby from "../components/Lobby";
import Room from "../components/Room";
// import Game from "../components/Game"; // Deprecated
import TicTacToe from "../components/TicTacToe";
import SnakeAndLadder from "../components/SnakeAndLadder";
import GooseHunt from "../components/GooseHunt";
import UltimateTicTacToe from "../components/UltimateTicTacToe";
import Ludo from "../components/Ludo";

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the same origin
    const socketInstance = io();

    socketInstance.on("connect", () => {
      console.log("Connected to server", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected");
      setIsConnected(false);
      setRoom(null);
    });

    socketInstance.on("room_update", (updatedRoom) => {
      console.log("Room update:", updatedRoom);
      setRoom(updatedRoom);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateRoom = (username: string) => {
    if (!socket) return;
    socket.emit("create_room", { username }, (response: any) => {
      if (!response.success) {
        alert(response.error);
      }
      // Success will trigger room_update
    });
  };

  const handleJoinRoom = (roomId: string, username: string) => {
    if (!socket) return;
    socket.emit("join_room", { roomId, username }, (response: any) => {
        if (!response.success) {
            alert(response.error);
        }
    });
  };

  const handleStartGame = () => {
      if (!socket || !room) return;
      socket.emit("start_game", { roomId: room.id });
  };

  const handleSelectGame = (gameType: string) => {
      if (!socket || !room) return;
      socket.emit("select_game", { roomId: room.id, gameType });
  };

  const handleGameAction = (action: string, payload: any) => {
      if (!socket || !room) return;
      socket.emit("game_action", { roomId: room.id, action, payload });
  };

  if (!isConnected) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
            <div className="animate-pulse">Connecting to server...</div>
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      {!room ? (
        <Lobby onCreate={handleCreateRoom} onJoin={handleJoinRoom} />
      ) : room.status === "LOBBY" ? (
        <Room room={room} currentUserId={socket?.id || ""} onStart={handleStartGame} onSelectGame={handleSelectGame} />
      ) : (
        <>
            {room.gameType === "TICTACTOE" && <TicTacToe room={room} currentUserId={socket?.id || ""} onAction={handleGameAction} />}
            {room.gameType === "SNAKE" && <SnakeAndLadder room={room} currentUserId={socket?.id || ""} onAction={handleGameAction} />}
            {room.gameType === "GOOSE" && <GooseHunt room={room} currentUserId={socket?.id || ""} onAction={handleGameAction} />}
            {room.gameType === "ULTIMATE" && <UltimateTicTacToe room={room} currentUserId={socket?.id || ""} onAction={handleGameAction} />}
            {room.gameType === "LUDO" && <Ludo room={room} currentUserId={socket?.id || ""} onAction={handleGameAction} />}
        </>
      )}
    </main>
  );
}
