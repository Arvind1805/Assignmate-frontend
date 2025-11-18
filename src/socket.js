// src/socket.js
import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(process.env.REACT_APP_API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.io connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket.io disconnected");
    });
  }

  return socketInstance;
};

// For backward compatibility (if anything still uses `socket`)
export const socket = getSocket();
