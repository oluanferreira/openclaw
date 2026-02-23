import { escapeShell } from "../sdk";

import { env } from "./env";

const toInstanceHost = (instanceId: string) =>
  `${instanceId}.${env.VPS_INSTANCE_DOMAIN_SUFFIX}`;

export const getInstanceUrl = (instanceId: string) =>
  `https://${toInstanceHost(instanceId)}`;

export const getProvisionRouteScript = (instanceId: string) => {
  const instanceHost = toInstanceHost(instanceId);

  return `
INSTANCE_HOST=${escapeShell(instanceHost)}
CADDY_ROUTES_DIR=${escapeShell(env.VPS_CADDY_ROUTES_DIR)}
CADDY_CONFIG_PATH=${escapeShell(env.VPS_CADDY_CONFIG_PATH)}
AUTH_CHECK_ORIGIN=${escapeShell(env.VPS_AUTH_CHECK_ORIGIN)}

mkdir -p "$CADDY_ROUTES_DIR"
ROUTE_FILE="$CADDY_ROUTES_DIR/$INSTANCE_HOST.caddy"

cat > "$ROUTE_FILE" <<EOF
$INSTANCE_HOST {
  forward_auth $AUTH_CHECK_ORIGIN {
    uri /api/openclaw/access
    header_up X-OpenClaw-Instance-Host {host}
  }

  reverse_proxy 127.0.0.1:$PORT
}
EOF

chmod 644 "$ROUTE_FILE"
caddy reload --config "$CADDY_CONFIG_PATH"

echo "instance_url=https://$INSTANCE_HOST"
`;
};
