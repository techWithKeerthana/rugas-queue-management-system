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

module.exports = {
  setIo,
  getIo,
  safeEmitToQueue,
};
