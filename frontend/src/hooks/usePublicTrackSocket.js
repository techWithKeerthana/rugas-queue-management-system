import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function usePublicTrackSocket({ queueId, tokenId, onInvalidate }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!queueId || !tokenId) {
      return undefined;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: {
        mode: "public-track",
        queueId,
        tokenId,
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("public:track:invalidate", (payload) => {
      if (payload?.queueId === queueId) {
        onInvalidate?.();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queueId, tokenId, onInvalidate]);

  return socketRef;
}
