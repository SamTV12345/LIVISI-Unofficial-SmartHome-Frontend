import { page, userEvent } from "vitest/browser";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HomeScreen } from "@/src/pages/HomeScreen";
import { i18next } from "@/src/language/i18n";
import { useContentModel } from "@/src/store";
import { worker } from "@/src/test/msw/browser";
import { TestProviders } from "@/src/test/renderWithProviders";
import type { AxiosDeviceResponse } from "@/src/store";
import type { Device } from "@/src/models/Device";

let root: Root | null = null;

const createDevice = (overrides: Partial<Device>): Device => ({
  manufacturer: "LIVISI",
  type: "PSS",
  version: "1.0",
  product: "test-product",
  serialNumber: "SN-1",
  config: {
    activityLogActive: true,
    friendlyName: "Test Device",
    modelId: "model-1",
    name: "Test Device",
    protocolId: "proto-1",
    timeOfAcceptance: "2026-01-01T00:00:00.000Z",
    timeOfDiscovery: "2026-01-01T00:00:00.000Z",
    underlyingDeviceIds: []
  },
  capabilities: [],
  id: "device-1",
  location: "location-1",
  tags: {
    type: "device",
    typeCategory: "generic"
  },
  ...overrides
});

const createAllThings = (devices: Device[]): AxiosDeviceResponse => ({
  devices: Object.fromEntries(devices.map((device) => [device.id, device])),
  status: {
    appVersion: "1.0.0",
    configVersion: 1,
    connected: true,
    controllerType: "controller",
    network: {
      backendAvailable: true,
      bluetoothHotspotName: "",
      ethCableAttached: true,
      ethIpAddress: "127.0.0.1",
      ethMacAddress: "00:00:00:00:00:00",
      hostname: "test-host",
      hotspotActive: false,
      inUseAdapter: "eth",
      wifiActiveSsid: "",
      wifiIpAddress: "",
      wifiMacAddress: "00:00:00:00:00:01",
      wifiSignalStrength: 0,
      wpsActive: false
    },
    osVersion: "1.0.0",
    serialNumber: "serial",
    operationStatus: "ok"
  },
  user_storage: [],
  locations: [
    { id: "location-1", config: { id: "location-1", name: "Living Room" }, devices: ["plug-1", "window-1"] },
    { id: "location-2", config: { id: "location-2", name: "Kitchen" }, devices: ["smoke-1", "climate-1"] }
  ],
  messages: [],
  email: {
    server_address: "",
    server_port_number: 0,
    email_username: "",
    email_password: "",
    recipient_list: [],
    notifications_device_unreachable: false,
    notification_device_low_battery: false
  },
  interactions: []
});

const renderHomeScreen = async (devices: Device[]) => {
  useContentModel.setState({ allThings: createAllThings(devices) });

  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  root.render(
    <TestProviders>
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<HomeScreen />} />
        </Routes>
      </MemoryRouter>
    </TestProviders>
  );

  await expect.element(page.getByRole("button", { name: /beleuchtung/i })).toBeInTheDocument();
};

describe("HomeScreen", () => {
  beforeEach(async () => {
    await i18next.changeLanguage("en");
  });

  afterEach(() => {
    root?.unmount();
    root = null;
    useContentModel.setState({ allThings: undefined });
    document.body.innerHTML = "";
  });

  it("shows hero counters on the main page", async () => {
    await renderHomeScreen([
      createDevice({
        id: "plug-1",
        serialNumber: "SN-PLUG-1",
        config: { ...createDevice({}).config, name: "Living Lamp", friendlyName: "Living Lamp" },
        capabilityState: [{ id: "cap-on-1", state: { onState: { value: true } } }]
      }),
      createDevice({
        id: "window-1",
        type: "WDS",
        serialNumber: "SN-WINDOW-1",
        config: { ...createDevice({}).config, name: "Window Sensor", friendlyName: "Window Sensor" },
        capabilityState: [{ id: "cap-open-1", state: { isOpen: { value: true } } }]
      }),
      createDevice({
        id: "smoke-1",
        type: "WSD2",
        serialNumber: "SN-SMOKE-1",
        config: { ...createDevice({}).config, name: "Smoke Detector", friendlyName: "Smoke Detector" },
        capabilityState: [{ id: "cap-smoke-1", state: { isSmokeAlarm: { value: true } } }]
      }),
      createDevice({
        id: "outside-1",
        type: "PSSO",
        serialNumber: "SN-OUTSIDE-1",
        config: { ...createDevice({}).config, name: "Garden Plug", friendlyName: "Garden Plug" },
        capabilityState: [{ id: "cap-on-2", state: { onState: { value: false } } }]
      })
    ]);

    await expect.element(page.getByText("4 devices")).toBeInTheDocument();
    await expect.element(page.getByText("2 rooms")).toBeInTheDocument();
    await expect.element(page.getByText("0 climate zones")).toBeInTheDocument();
  });

  it("renders smart-home elements inside their sections", async () => {
    await renderHomeScreen([
      createDevice({
        id: "plug-1",
        serialNumber: "SN-PLUG-1",
        config: { ...createDevice({}).config, name: "Living Lamp", friendlyName: "Living Lamp" },
        capabilityState: [{ id: "cap-on-1", state: { onState: { value: true } } }]
      }),
      createDevice({
        id: "window-1",
        type: "WDS",
        serialNumber: "SN-WINDOW-1",
        config: { ...createDevice({}).config, name: "Window Sensor", friendlyName: "Window Sensor" },
        capabilityState: [{ id: "cap-open-1", state: { isOpen: { value: true } } }]
      }),
      createDevice({
        id: "smoke-1",
        type: "WSD2",
        serialNumber: "SN-SMOKE-1",
        config: { ...createDevice({}).config, name: "Smoke Detector", friendlyName: "Smoke Detector" },
        capabilityState: [{ id: "cap-smoke-1", state: { isSmokeAlarm: { value: true } } }]
      })
    ]);

    await userEvent.click(page.getByRole("button", { name: /beleuchtung/i }));
    await userEvent.click(page.getByRole("button", { name: /fenster/i }));
    await userEvent.click(page.getByRole("button", { name: /sicherheit/i }));

    await expect.element(page.getByText("Living Lamp")).toBeInTheDocument();
    await expect.element(page.getByRole("button", { name: /switch off/i })).toBeInTheDocument();
    await expect.element(page.getByText("Window Sensor")).toBeInTheDocument();
    await expect.element(page.getByText("Open")).toBeInTheDocument();
    await expect.element(page.getByText("Smoke Detector")).toBeInTheDocument();
    await expect.element(page.getByText("Smoke detected")).toBeInTheDocument();
  });

  it("shows no climate history text when API returns no points", async () => {
    worker.use(http.get("/data/capability", () => HttpResponse.json([])));

    await renderHomeScreen([
      createDevice({
        id: "climate-1",
        type: "VRCC",
        serialNumber: "SN-CLIMATE-1",
        config: { ...createDevice({}).config, name: "Kitchen Climate", friendlyName: "Kitchen Climate" },
        locationData: { id: "location-2", config: { id: "location-2", name: "Kitchen" } },
        capabilityState: []
      })
    ]);

    await userEvent.click(page.getByRole("button", { name: /show histories/i }));

    await expect.element(page.getByText("No history 24h")).toBeInTheDocument();
  });

  it("shows 'No climate devices' when there are no VRCC devices", async () => {
    await renderHomeScreen([
      createDevice({
        id: "plug-1",
        serialNumber: "SN-PLUG-1",
        config: { ...createDevice({}).config, name: "Living Lamp", friendlyName: "Living Lamp" },
        capabilityState: [{ id: "cap-on-1", state: { onState: { value: false } } }]
      })
    ]);

    await userEvent.click(page.getByRole("button", { name: /show histories/i }));

    await expect.element(page.getByText("No climate devices")).toBeInTheDocument();
  });

  it("renders climate chart titles when history data exists", async () => {
    worker.use(
      http.get("/data/capability", () => HttpResponse.json([
        {
          eventType: "StateChanged",
          eventTime: "2026-04-04T09:00:00.000Z",
          dataName: "value",
          dataValue: "21.4",
          entityId: "LIVISI.VRCC.SN-CLIMATE-1.RoomTemperature"
        },
        {
          eventType: "StateChanged",
          eventTime: "2026-04-04T09:00:00.000Z",
          dataName: "value",
          dataValue: "45.0",
          entityId: "LIVISI.VRCC.SN-CLIMATE-1.RoomHumidity"
        }
      ]))
    );

    await renderHomeScreen([
      createDevice({
        id: "climate-1",
        type: "VRCC",
        serialNumber: "SN-CLIMATE-1",
        config: { ...createDevice({}).config, name: "Kitchen Climate", friendlyName: "Kitchen Climate" },
        locationData: { id: "location-2", config: { id: "location-2", name: "Kitchen" } },
        capabilityState: []
      })
    ]);

    await userEvent.click(page.getByRole("button", { name: /show histories/i }));

    await expect.element(page.getByRole("button", { name: /^kitchen$/i })).toBeInTheDocument();
    await expect.element(page.getByText("No history 24h")).not.toBeInTheDocument();
  });

  it("rolls back switch state and shows an error when action call fails", async () => {
    worker.use(http.post("/action", () => new HttpResponse("switch failed", { status: 500 })));

    await renderHomeScreen([
      createDevice({
        id: "plug-1",
        serialNumber: "SN-PLUG-1",
        config: { ...createDevice({}).config, name: "Living Lamp", friendlyName: "Living Lamp" },
        capabilityState: [{ id: "cap-on-1", state: { onState: { value: false } } }]
      })
    ]);

    await userEvent.click(page.getByRole("button", { name: /beleuchtung/i }));

    const toggle = page.getByRole("button", { name: /switch on/i });
    await userEvent.click(toggle);

    await expect.element(page.getByText("Switch failed")).toBeInTheDocument();
    await expect.element(page.getByRole("button", { name: /switch on/i })).toBeInTheDocument();
  });
});

