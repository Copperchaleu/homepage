import { useTranslation } from "next-i18next";

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
  if (!bytesPerSec) return "0 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

export default function Component({ service }) {
  const { t } = useTranslation();
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
        <Block label="komari.cpu" />
        <Block label="komari.ram" />
        <Block label="komari.disk" />
        <Block label="komari.swap" />
        <Block label="komari.load" />
        <Block label="komari.net" />
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
        <Block label="komari.status" value="N/A" />
      </Container>
    );
  }

  if (!online) {
    return (
      <Container service={service}>
        <Block label="komari.status" value={t("komari.offline")} />
        <Block label="komari.cpu" value="-" />
        <Block label="komari.ram" value="-" />
        <Block label="komari.disk" value="-" />
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

  return (
    <Container service={service}>
      <Block label="komari.cpu" value={t("common.percent", { value: cpu.toFixed(1) })} />
      <Block label="komari.ram" value={t("common.percent", { value: ramPct.toFixed(0) })} />
      <Block label="komari.disk" value={t("common.percent", { value: diskPct.toFixed(0) })} />
      <Block label="komari.swap" value={swapTotal > 0 ? t("common.percent", { value: swapPct.toFixed(0) }) : "-"} />
      <Block label="komari.load" value={`${Number(status?.load ?? 0).toFixed(2)}/${Number(status?.load5 ?? 0).toFixed(2)}/${Number(status?.load15 ?? 0).toFixed(2)}`} />
      <Block label="komari.net" value={`↑${formatSpeed(status?.net_out)} ↓${formatSpeed(status?.net_in)}`} />
    </Container>
  );
}
