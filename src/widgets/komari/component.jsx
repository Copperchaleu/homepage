import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "K", "M", "G", "T"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)}${sizes[i]}`;
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec) return "0B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

function MiniBar({ percent, active = true }) {
  const pct = Math.min(100, Math.max(0, percent || 0));
  let barClass = "bg-emerald-500/70";
  if (active && pct > 90) barClass = "bg-red-500/80";
  else if (active && pct > 70) barClass = "bg-amber-500/70";
  else if (!active) barClass = "bg-theme-800/15 dark:bg-theme-200/15";

  return (
    <div className="w-full bg-theme-800/20 dark:bg-theme-200/10 rounded-full h-1 mt-0.5">
      <div
        className={`h-1 rounded-full transition-all duration-700 ${barClass}`}
        style={{ width: active ? `${pct}%` : "0%" }}
      />
    </div>
  );
}

function MetricCell({ label, value, percent, active = true }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-0.5">
        <span className="text-[0.55rem] text-theme-800 dark:text-theme-200 font-semibold uppercase leading-none">{label}</span>
        <span className="text-[0.55rem] text-theme-800 dark:text-theme-200 font-mono leading-none truncate">{active ? value : "-"}</span>
      </div>
      <MiniBar percent={percent} active={active} />
    </div>
  );
}

export default function Component({ service }) {
  const { widget } = service;
  const nodeUuid = widget.uuid;

  const { data: nodesData, error: nodesError } = useWidgetAPI(widget, "nodes");
  const { data: statusData, error: statusError } = useWidgetAPI(widget, "status", { refreshInterval: 5000 });

  if (nodesError || statusError) {
    return <Container service={service} error={nodesError ?? statusError} />;
  }

  if (!nodesData || !statusData) {
    return (
      <Container service={service}>
        <Block label="komari.loading" />
      </Container>
    );
  }

  // Parse nodes
  let nodes = [];
  try {
    const parsed = typeof nodesData === "string" ? JSON.parse(nodesData) : nodesData;
    nodes = parsed?.data || parsed || [];
  } catch {
    nodes = [];
  }

  // Parse status
  let statuses = {};
  try {
    const parsed = typeof statusData === "string" ? JSON.parse(statusData) : statusData;
    statuses = parsed?.result || parsed || {};
  } catch {
    statuses = {};
  }

  const node = nodes.find((n) => n.uuid === nodeUuid);
  const status = statuses[nodeUuid];
  const online = status?.online ?? false;

  if (!node) {
    return (
      <Container service={service}>
        <Block label="komari.not_found" value="N/A" />
      </Container>
    );
  }

  const cpu = status?.cpu ?? 0;
  const ramUsed = status?.ram ?? 0;
  const diskUsed = status?.disk ?? 0;
  const swapUsed = status?.swap ?? 0;
  const ramTotal = node.mem_total ?? 0;
  const diskTotal = node.disk_total ?? 0;
  const swapTotal = node.swap_total ?? 0;
  const ramPct = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;
  const diskPct = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;
  const swapPct = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;
  const hasSwap = swapTotal > 0;

  return (
    <div className="flex flex-col w-full gap-1 p-1">
      {/* Row 1: CPU / RAM / Disk / Swap with progress bars */}
      <div className="flex flex-row gap-1.5">
        <MetricCell label="CPU" value={`${cpu.toFixed(0)}%`} percent={cpu} active={online} />
        <MetricCell label="RAM" value={formatBytes(ramUsed)} percent={ramPct} active={online} />
        <MetricCell label="Disk" value={formatBytes(diskUsed)} percent={diskPct} active={online} />
        <MetricCell label="Swap" value={hasSwap ? formatBytes(swapUsed) : "-"} percent={swapPct} active={online && hasSwap} />
      </div>

      {/* Row 2: Load + Network + Traffic */}
      <div className="flex items-center justify-between gap-1 text-[0.55rem] font-mono text-theme-800 dark:text-theme-200 leading-none">
        {online ? (
          <>
            <span className="flex-shrink-0">
              <span className="font-semibold">Load:</span> {Number(status?.load ?? 0).toFixed(2)}/{Number(status?.load5 ?? 0).toFixed(2)}/{Number(status?.load15 ?? 0).toFixed(2)}
            </span>
            <span className="flex-shrink-0">
              <span className="font-semibold">Network:</span> ↑{formatSpeed(status?.net_out)} ↓{formatSpeed(status?.net_in)}
            </span>
            <span className="flex-shrink-0">
              <span className="font-semibold">Traffic:</span> ↑{formatBytes(status?.net_total_up)} ↓{formatBytes(status?.net_total_down)}
            </span>
          </>
        ) : (
          <span>Offline</span>
        )}
      </div>
    </div>
  );
}
