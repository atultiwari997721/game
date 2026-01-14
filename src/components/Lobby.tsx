import { useState } from 'react';

export default function Lobby({ onCreate, onJoin }: { onCreate: (username: string) => void, onJoin: (roomId: string, username: string) => void }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md">
      <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Multiplayer Game</h1>
      
      <div className="w-full">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Enter your name"
        />
      </div>

      <div className="flex flex-col w-full gap-4">
        <button
          onClick={() => { if (username) onCreate(username) }}
          disabled={!username}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create New Room
        </button>

        <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-300 dark:border-zinc-700 w-full absolute"></div>
            <span className="bg-zinc-100 dark:bg-zinc-900 px-2 text-zinc-500 text-sm relative z-10">OR</span>
        </div>

        <div className="flex gap-2">
            <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none uppercase"
                placeholder="ROOM ID"
            />
            <button
                onClick={() => { if (username && roomId) onJoin(roomId, username) }}
                disabled={!username || !roomId}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Join
            </button>
        </div>
      </div>
    </div>
  );
}
