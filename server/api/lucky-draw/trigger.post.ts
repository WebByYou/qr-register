import { luckyDrawEmitter } from "../../utils/lucky-draw";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Emit the event to all listeners (SSE streams)
  luckyDrawEmitter.emit("event", body);

  return { success: true };
});
