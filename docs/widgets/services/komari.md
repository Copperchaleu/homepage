---
title: Komari
description: Komari Server Monitoring Widget Configuration
---

Learn more about [Komari](https://github.com/komari-monitor/komari).

Each server node is configured as an individual service entry using its `uuid`. You can find the UUID of each node in your Komari admin panel or by visiting the `/api/nodes` endpoint.

Allowed fields: `["cpu", "ram", "disk", "swap", "load", "net", "traffic"]`.

```yaml
widget:
  type: komari
  url: http://komari.host.or.ip:port
  uuid: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Example Configuration

```yaml
- Server Monitoring:
    - My Server:
        href: https://your-komari-instance.com/instance/your-uuid
        description: i5-13600KF · Ubuntu
        widget:
            type: komari
            url: https://your-komari-instance.com
            uuid: your-uuid
            fields: ["cpu", "ram", "disk", "load"] # optional, defaults to all 6
            highlight:
                cpu:
                    numeric:
                        - { level: danger, when: gte, value: 80 }
                        - { level: warn, when: gte, value: 50 }
                        - { level: good, when: lt, value: 50 }
                ram:
                    numeric:
                        - { level: danger, when: gte, value: 80 }
                        - { level: warn, when: gte, value: 50 }
                        - { level: good, when: lt, value: 50 }
```

## Highlight Values

The widget passes numeric `highlightValue` to each Block, enabling [Block Highlights](https://gethomepage.dev/configs/services/#block-highlights). The values used for comparison are:

| Field | Value Type | Range |
|-------|-----------|-------|
| `cpu` | CPU usage percentage | 0 - 100 |
| `ram` | RAM usage percentage | 0 - 100 |
| `disk` | Disk usage percentage | 0 - 100 |
| `swap` | Swap usage percentage | 0 - 100 |
| `load` | 1-minute load average | 0+ (raw value, not percentage) |
| `net` | Network speed string | N/A (no highlight) |
| `traffic` | Total traffic string (↑upload ↓download) | N/A (no highlight) |

## Behavior

- **Single-node mode**: Each service entry corresponds to one server node via `uuid`.
- **Auto-refresh**: Status data refreshes every **5 seconds**.
- **Offline detection**: If a node is offline, the widget shows "Offline" with dashes for metrics.
- **No authentication required**: The widget uses Komari's public API endpoints (`/api/nodes` and `/api/rpc2`).
