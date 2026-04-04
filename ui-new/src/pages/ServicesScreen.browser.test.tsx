import { page } from "vitest/browser";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ServicesScreen } from "@/src/pages/ServicesScreen";
import { worker } from "@/src/test/msw/browser";
import { TestProviders } from "@/src/test/renderWithProviders";
import { i18next } from "@/src/language/i18n";

let root: Root | null = null;

const renderServicesScreen = async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  root.render(
    <TestProviders>
      <MemoryRouter initialEntries={["/services"]}>
        <Routes>
          <Route path="/services" element={<ServicesScreen />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>
  );

  await expect.element(page.getByRole("button", { name: /mobile access/i })).toBeInTheDocument();
};

describe("ServicesScreen", () => {
  beforeEach(async () => {
    await i18next.changeLanguage("en");
  });

  afterEach(() => {
    root?.unmount();
    root = null;
    document.body.innerHTML = "";
  });

  it("shows fallback text when sun-times endpoint returns no data", async () => {
    worker.use(http.get("/service/sun-times", () => HttpResponse.json(null)));

    await renderServicesScreen();

    await expect.element(page.getByText("No sun times")).toBeInTheDocument();
  });

  it("shows sunrise and sunset labels when sun-times data exists", async () => {
    worker.use(
      http.get("/service/sun-times", () => HttpResponse.json({
        nextSunrise: "2026-04-05T05:55:00.000Z",
        nextSunset: "2026-04-05T18:44:00.000Z",
        nextEventAt: "2026-04-05T05:55:00.000Z"
      }))
    );

    await renderServicesScreen();

    await expect.element(page.getByText("Next sunrise")).toBeInTheDocument();
    await expect.element(page.getByText("Next sunset")).toBeInTheDocument();
  });
});

