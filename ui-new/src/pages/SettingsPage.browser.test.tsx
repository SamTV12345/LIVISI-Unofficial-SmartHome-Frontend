import { page, userEvent } from "vitest/browser";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createRoot, Root } from "react-dom/client";
import { SettingsPage } from "@/src/pages/SettingsPage";
import { worker } from "@/src/test/msw/browser";
import { TestProviders } from "@/src/test/renderWithProviders";
import { i18next } from "@/src/language/i18n";

let root: Root | null = null;

const renderSettingsPage = async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  root.render(
    <TestProviders>
      <MemoryRouter initialEntries={["/settings"]}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logincom" element={<div>Login Route</div>} />
        </Routes>
      </MemoryRouter>
    </TestProviders>
  );

  await expect.element(page.getByRole("button", { name: /eject usb/i })).toBeInTheDocument();
};

describe("SettingsPage", () => {
  beforeEach(async () => {
    await i18next.changeLanguage("en");
  });

  afterEach(() => {
    root?.unmount();
    root = null;
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("disables USB eject button when no USB storage is connected", async () => {
    worker.use(
      http.get("/usb_storage", () => HttpResponse.json({ external_storage: false }))
    );

    await renderSettingsPage();

    await expect.element(page.getByRole("button", { name: /eject usb/i })).toBeDisabled();
  });

  it("updates UI after unmount call and disables eject action", async () => {
    worker.use(
      http.get("/usb_storage", () => HttpResponse.json({ external_storage: true })),
      http.get("/unmount", () => HttpResponse.json({ ok: true }))
    );

    await renderSettingsPage();

    const ejectUsbButton = page.getByRole("button", { name: /eject usb/i });
    await expect.element(ejectUsbButton).toBeEnabled();

    await userEvent.click(ejectUsbButton);

    await expect.element(page.getByRole("button", { name: /eject usb/i })).toBeDisabled();
  });

  it("keeps USB eject enabled when unmount request fails", async () => {
    worker.use(
      http.get("/usb_storage", () => HttpResponse.json({ external_storage: true })),
      http.get("/unmount", () => new HttpResponse("fail", { status: 500 }))
    );

    await renderSettingsPage();

    const ejectUsbButton = page.getByRole("button", { name: /eject usb/i });
    await expect.element(ejectUsbButton).toBeEnabled();

    await userEvent.click(ejectUsbButton);

    await expect.element(page.getByRole("button", { name: /eject usb/i })).toBeEnabled();
  });

  it("clears auth storage and navigates to login on logout", async () => {
    worker.use(http.get("/usb_storage", () => HttpResponse.json({ external_storage: false })));
    localStorage.setItem("auth", "token");
    sessionStorage.setItem("auth", "token");

    await renderSettingsPage();

    await userEvent.click(page.getByRole("button", { name: /logout/i }));

    await expect.element(page.getByText("Login Route")).toBeInTheDocument();
    expect(localStorage.getItem("auth")).toBeNull();
    expect(sessionStorage.getItem("auth")).toBeNull();
  });
});

