import { qrDisplayEmitter } from "../../utils/qr-display";
import { PassThrough } from "stream";
export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");
  setHeader(event, "Content-Encoding", "none");
  const stream = new PassThrough();
  const listener = (data: any) => {
    stream.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const interval = setInterval(() => {
    stream.write(": keep-alive\n\n");
  }, 30000);
  qrDisplayEmitter.on("update", listener);
  event.node.req.on("close", () => {
    clearInterval(interval);
    qrDisplayEmitter.off("update", listener);
    stream.end();
  });
  return sendStream(event, stream);
});
