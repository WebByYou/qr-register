import { luckyDrawEmitter } from "../../utils/lucky-draw";
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
  luckyDrawEmitter.on("event", listener);
  event.node.req.on("close", () => {
    luckyDrawEmitter.off("event", listener);
    stream.end();
  });
  return sendStream(event, stream);
});
