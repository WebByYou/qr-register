import { useState } from "nuxt/app";

// We need to implement the logic.
// Since we can't easily share module-level variables across HMR updates sometimes,
// let's put the logic inside the composable but guard it.

let globalEventSource: EventSource | null = null;
let globalCountInterval: NodeJS.Timeout | null = null;
const globalCallbacks: ((data: any) => void)[] = [];

export const useRegistration = () => {
  const count = useState<number>("registration-count", () => 0);
  const isConnected = useState<boolean>(
    "registration-sse-connected",
    () => false
  );
  const isInitialized = useState<boolean>(
    "registration-initialized",
    () => false
  );

  const fetchCount = async () => {
    try {
      const res: any = await $fetch("/api/registrations/count");
      if (res?.success) {
        count.value = res.count;
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  const startPolling = () => {
    if (!globalCountInterval) {
      fetchCount();
      globalCountInterval = setInterval(fetchCount, 5000);
    }
  };

  const stopPolling = () => {
    if (globalCountInterval) {
      clearInterval(globalCountInterval);
      globalCountInterval = null;
    }
  };

  const setupSSE = () => {
    if (typeof window === "undefined") return;
    if (
      globalEventSource &&
      globalEventSource.readyState !== EventSource.CLOSED
    )
      return;

    if (globalEventSource) globalEventSource.close();

    // Add timestamp to prevent caching
    globalEventSource = new EventSource(
      `/api/qr-display/stream?t=${Date.now()}`
    );

    globalEventSource.onopen = () => {
      console.log("SSE Connected (Store)");
      isConnected.value = true;
      stopPolling();
    };

    globalEventSource.onerror = (err) => {
      if (globalEventSource?.readyState === EventSource.CLOSED) {
        console.log("SSE Connection closed (Store)");
      } else {
        console.error("SSE Error (Store):", err);
      }
      isConnected.value = false;
      globalEventSource?.close();
      globalEventSource = null;
      startPolling();
      setTimeout(setupSSE, 10000); // Retry connection
    };

    globalEventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "count") {
          count.value = parsed.data;
        }

        // Notify other listeners (e.g. for settings)
        globalCallbacks.forEach((cb) => cb(parsed));
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };
  };

  const init = () => {
    if (isInitialized.value) return;
    fetchCount();
    setupSSE();
    isInitialized.value = true;
  };

  const onMessage = (callback: (data: any) => void) => {
    globalCallbacks.push(callback);
  };

  const removeListener = (callback: (data: any) => void) => {
    const index = globalCallbacks.indexOf(callback);
    if (index > -1) {
      globalCallbacks.splice(index, 1);
    }
  };

  return {
    count,
    isConnected,
    init,
    onMessage,
    removeListener,
    fetchCount, // Expose for manual refresh if needed
  };
};
