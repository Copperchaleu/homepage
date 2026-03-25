import genericProxyHandler from "utils/proxy/handlers/generic";
import { sendJsonRpcRequest } from "utils/proxy/handlers/jsonrpc";
import getServiceWidget from "utils/config/service-helpers";
import { formatApiCall } from "utils/proxy/api-helpers";
import widgets from "widgets/widgets";

export default async function komariProxyHandler(req, res) {
  const { group, service, endpoint, index } = req.query;

  if (!group || !service) {
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const widget = await getServiceWidget(group, service, index);
  if (!widget) {
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  if (endpoint === "common:getNodesLatestStatus") {
    // JSON-RPC call for node status
    const api = widgets?.[widget.type]?.api;
    if (!api) {
      return res.status(403).json({ error: "Service does not support API calls" });
    }

    const url = formatApiCall(api, { endpoint: "rpc2", ...widget });
    const [status, , data] = await sendJsonRpcRequest(url, "common:getNodesLatestStatus", {}, widget);
    return res.status(status).end(data);
  }

  if (endpoint === "nodes") {
    // REST GET call for node list - delegate to generic handler
    return genericProxyHandler(req, res);
  }

  return res.status(400).json({ error: "Invalid endpoint" });
}
