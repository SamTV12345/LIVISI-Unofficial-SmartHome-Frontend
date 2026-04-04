import { afterAll, afterEach, beforeAll } from "vitest";
import { queryClient } from "@/src/api/queryClient";
import { worker } from "@/src/test/msw/browser";

beforeAll(async () => {
  await worker.start({
    onUnhandledRequest: "error",
    serviceWorker: {
      url: "/mockServiceWorker.js"
    }
  });
});

afterEach(() => {
  worker.resetHandlers();
  queryClient.clear();
  document.body.innerHTML = "";
});

afterAll(async () => {
  await worker.stop();
});

