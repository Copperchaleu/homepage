// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";
import { expectBlockValue } from "test-utils/widget-assertions";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));
vi.mock("utils/proxy/use-widget-api", () => ({ default: useWidgetAPI }));

import Component from "./component";

const MOCK_UUID = "test-uuid-1234";

const MOCK_NODES_DATA = {
  data: [
    {
      uuid: MOCK_UUID,
      name: "TEST-SERVER",
      region: "🇨🇳",
      mem_total: 8589934592, // 8 GB
      swap_total: 2147483648, // 2 GB
      disk_total: 107374182400, // 100 GB
      hidden: false,
    },
  ],
};

const MOCK_STATUS_DATA = {
  [MOCK_UUID]: {
    online: true,
    cpu: 45.5,
    ram: 4294967296, // 4 GB used
    disk: 53687091200, // 50 GB used
    swap: 536870912, // 512 MB used
    load: 1.25,
    load5: 0.98,
    load15: 0.76,
    net_in: 102400,
    net_out: 51200,
    net_total_up: 1073741824,
    net_total_down: 10737418240,
    uptime: 86400,
  },
};

describe("widgets/komari/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders while loading", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const service = { widget: { type: "komari", uuid: MOCK_UUID } };
    const { container } = renderWithProviders(<Component service={service} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(7);
    expect(screen.getByText("komari.cpu")).toBeInTheDocument();
    expect(screen.getByText("komari.ram")).toBeInTheDocument();
    expect(screen.getByText("komari.disk")).toBeInTheDocument();
    expect(screen.getByText("komari.swap")).toBeInTheDocument();
    expect(screen.getByText("komari.load")).toBeInTheDocument();
    expect(screen.getByText("komari.net")).toBeInTheDocument();
    expect(screen.getByText("komari.traffic")).toBeInTheDocument();
  });

  it("renders error UI when nodes endpoint errors", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "nodes") return { data: undefined, error: { message: "API error" } };
      return { data: undefined, error: undefined };
    });

    renderWithProviders(<Component service={{ widget: { type: "komari", uuid: MOCK_UUID } }} />, {
      settings: { hideErrors: false },
    });

    expect(screen.getAllByText(/widget\.api_error/i).length).toBeGreaterThan(0);
    expect(screen.getByText("API error")).toBeInTheDocument();
  });

  it("renders error UI when status endpoint errors", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "status") return { data: undefined, error: { message: "RPC error" } };
      return { data: MOCK_NODES_DATA, error: undefined };
    });

    renderWithProviders(<Component service={{ widget: { type: "komari", uuid: MOCK_UUID } }} />, {
      settings: { hideErrors: false },
    });

    expect(screen.getAllByText(/widget\.api_error/i).length).toBeGreaterThan(0);
  });

  it("renders N/A when uuid does not match any node", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "nodes") return { data: MOCK_NODES_DATA, error: undefined };
      if (endpoint === "status") return { data: MOCK_STATUS_DATA, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "komari", uuid: "non-existent-uuid" } }} />,
      { settings: { hideErrors: false } },
    );

    expectBlockValue(container, "komari.status", "N/A");
  });

  it("renders offline state when node is not online", () => {
    const offlineStatus = { [MOCK_UUID]: { online: false } };

    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "nodes") return { data: MOCK_NODES_DATA, error: undefined };
      if (endpoint === "status") return { data: offlineStatus, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "komari", uuid: MOCK_UUID } }} />,
      { settings: { hideErrors: false } },
    );

    expectBlockValue(container, "komari.status", "komari.offline");
    expectBlockValue(container, "komari.cpu", "-");
    expectBlockValue(container, "komari.ram", "-");
    expectBlockValue(container, "komari.disk", "-");
  });

  it("renders online node with all metrics", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "nodes") return { data: MOCK_NODES_DATA, error: undefined };
      if (endpoint === "status") return { data: MOCK_STATUS_DATA, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "komari", uuid: MOCK_UUID } }} />,
      { settings: { hideErrors: false } },
    );

    expect(container.querySelectorAll(".service-block")).toHaveLength(7);

    // CPU: 45.5%
    expectBlockValue(container, "komari.cpu", "45.5");
    // RAM: 4GB / 8GB = 50%
    expectBlockValue(container, "komari.ram", "50");
    // Disk: 50GB / 100GB = 50%
    expectBlockValue(container, "komari.disk", "50");
    // Swap: 512MB / 2GB = 25%
    expectBlockValue(container, "komari.swap", "25");
    // Load: 1.25/0.98/0.76
    expectBlockValue(container, "komari.load", "1.25/0.98/0.76");
  });

  it("renders swap as dash when no swap configured", () => {
    const noSwapNodes = {
      data: [{ ...MOCK_NODES_DATA.data[0], swap_total: 0 }],
    };

    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "nodes") return { data: noSwapNodes, error: undefined };
      if (endpoint === "status") return { data: MOCK_STATUS_DATA, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "komari", uuid: MOCK_UUID } }} />,
      { settings: { hideErrors: false } },
    );

    expectBlockValue(container, "komari.swap", "-");
  });
});
