// backend/src/sockets/bus.js
let ioRef = null;

export function setIO(io) {
  ioRef = io;
}

export async function broadcastNotesUpdated(notes) {
  if (ioRef) ioRef.emit('notes_updated', notes);
}
