let ioInstance;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  if (!ioInstance) {
    throw new Error("Socket.io is not initialized");
  }
  return ioInstance;
}

function safeEmitToQueue(queueId, eventName, payload) {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(`queue:${queueId}`).emit(eventName, payload);
}

function safeEmitPublicTrackInvalidation(queueId) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`public:queue:${queueId}`).emit("public:track:invalidate", {
    queueId,
    updatedAt: new Date().toISOString(),
  });
}

module.exports = {
  setIo,
  getIo,
  safeEmitToQueue,
  safeEmitPublicTrackInvalidation,
};
