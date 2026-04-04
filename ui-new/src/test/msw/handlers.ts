import { http, HttpResponse } from "msw";

export const handlers = [
  // Default mock keeps Settings page deterministic in tests.
  http.get("/usb_storage", () => HttpResponse.json({ external_storage: false })),
  http.get("/unmount", () => HttpResponse.json({ ok: true }))
];

