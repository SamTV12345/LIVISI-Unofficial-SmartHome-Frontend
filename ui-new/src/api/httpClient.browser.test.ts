import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { worker } from "@/src/test/msw/browser";
import { HttpRequestError, postJson } from "@/src/api/httpClient";

describe("postJson", () => {
  it("returns parsed JSON for successful responses", async () => {
    worker.use(
      http.post("/test-http-client", async ({ request }: { request: Request }) => {
        const body = await request.json();
        return HttpResponse.json({ received: body });
      })
    );

    const response = await postJson<{ received: { ping: string } }>("/test-http-client", { ping: "pong" });

    expect(response).toEqual({ received: { ping: "pong" } });
  });

  it("throws HttpRequestError for non-2xx responses", async () => {
    worker.use(
      http.post("/test-http-client-error", () => new HttpResponse("kaputt", { status: 500 }))
    );

    await expect(postJson("/test-http-client-error", { ping: "pong" })).rejects.toBeInstanceOf(HttpRequestError);
    await expect(postJson("/test-http-client-error", { ping: "pong" })).rejects.toMatchObject({
      status: 500,
      responseText: "kaputt"
    });
  });
});

