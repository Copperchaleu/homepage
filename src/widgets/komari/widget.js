import komariProxyHandler from "./proxy";

const widget = {
  api: "{url}/api/{endpoint}",
  proxyHandler: komariProxyHandler,

  mappings: {
    nodes: {
      endpoint: "nodes",
    },
    status: {
      endpoint: "common:getNodesLatestStatus",
    },
  },
};

export default widget;
