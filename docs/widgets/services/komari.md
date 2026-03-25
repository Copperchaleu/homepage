---
title: Komari
description: Komari Server Monitoring Widget Configuration
---

Learn more about [Komari](https://github.com/komari-monitor/komari).

The Komari widget provides a comprehensive multi-node server monitoring dashboard. Unlike most widgets, **a single widget entry automatically displays all nodes** registered in your Komari instance — no need to configure each node individually.

```yaml
widget:
  type: komari
  url: http://komari.host.or.ip:port
```

!!! note
    You only need **one** widget configuration. The widget automatically discovers and displays all nodes from your Komari deployment via the `/api/nodes` endpoint. There is no need to list individual nodes or UUIDs.

## Displayed Metrics

Each node card shows the following real-time metrics:

| Metric | Description |
|--------|-------------|
| Status | Online (green) / Offline (gray) indicator |
| CPU | Usage percentage with color-coded progress bar |
| RAM | Used / Total with progress bar |
| Disk | Used / Total with progress bar |
| Swap | Used / Total with progress bar (hidden when no swap) |
| Load | 1-minute load average |
| Network | Real-time upload ↑ and download ↓ speeds |
| Uptime | System uptime (days/hours/minutes) |
| Total Traffic | Cumulative upload and download bytes |

## Example Configuration

```yaml
- Server Monitoring:
    - Komari:
        icon: mdi-server-network
        href: https://your-komari-instance.com
        description: Multi-node server monitoring
        widget:
            type: komari
            url: https://your-komari-instance.com
```

This single entry will render a grid of cards — one per node — all within a single service widget.

## Behavior

- **Auto-refresh**: Data refreshes every **5 seconds**.
- **Sorting**: Online nodes appear first, then sorted by weight (as configured in Komari).
- **Filtering**: Nodes marked as `hidden` in Komari are automatically excluded.
- **No authentication required**: The widget uses Komari's public API endpoints (`/api/nodes` and `/api/rpc2`).
