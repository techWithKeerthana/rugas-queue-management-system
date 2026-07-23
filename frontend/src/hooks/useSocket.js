import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket({ token, queueId, onEvent }) {
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    const events = ["token:added", "token:reordered", "token:served", "token:cancelled", "token:statusChanged", "token:undone"];
    events.forEach((eventName) => {
      socket.on(eventName, (payload) => {
        onEventRef.current?.(eventName, payload);
      });
    });

    if (queueId) {
      socket.emit("queue:join", queueId);
    }

    return () => {
      if (queueId) {
        socket.emit("queue:leave", queueId);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queueId]);

  return socketRef;
}
