import { luckyDrawEmitter } from "../../utils/lucky-draw";
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  luckyDrawEmitter.emit("event", body);
  return { success: true };
});
