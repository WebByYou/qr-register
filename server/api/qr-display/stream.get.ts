import { qrDisplayEmitter } from "../../utils/qr-display";
import { PassThrough } from "stream";

export default defineEventHandler((event) => {
  // Set headers for SSE
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");
  setHeader(event, "Content-Encoding", "none");

  const stream = new PassThrough();

  const listener = (data: any) => {
    stream.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat to keep connection alive
  const interval = setInterval(() => {
    stream.write(": keep-alive\n\n");
  }, 30000);

  // Subscribe to events
  qrDisplayEmitter.on("update", listener);

  // Cleanup on connection close
  event.node.req.on("close", () => {
    clearInterval(interval);
    qrDisplayEmitter.off("update", listener);
    stream.end();
  });

  return sendStream(event, stream);
});
