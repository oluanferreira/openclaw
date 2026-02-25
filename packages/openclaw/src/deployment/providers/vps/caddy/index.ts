import { escapeShell } from "../sdk";

import { env } from "./env";

const toInstanceHost = (instanceId: string) =>
  `${instanceId}.${env.VPS_INSTANCE_DOMAIN_SUFFIX}`;

export const getInstanceUrl = (instanceId: string) =>
  `https://${toInstanceHost(instanceId)}`;

export const getProvisionRouteScript = (
  instanceId: string,
  _gatewayToken: string,
) => {
  const instanceHost = toInstanceHost(instanceId);

  return `
INSTANCE_HOST=${escapeShell(instanceHost)}
CADDY_ROUTES_DIR=${escapeShell(env.VPS_CADDY_ROUTES_DIR)}
CADDY_CONFIG_PATH=${escapeShell(env.VPS_CADDY_CONFIG_PATH)}

mkdir -p "$CADDY_ROUTES_DIR"
ROUTE_FILE="$CADDY_ROUTES_DIR/$INSTANCE_HOST.caddy"
ROUTES_IMPORT="import $CADDY_ROUTES_DIR/*.caddy"

cat > "$ROUTE_FILE" <<EOF
$INSTANCE_HOST {
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }

  reverse_proxy 127.0.0.1:$PORT
}
EOF

chmod 644 "$ROUTE_FILE"

if ! grep -Fq "$ROUTES_IMPORT" "$CADDY_CONFIG_PATH"; then
  printf "\n%s\n" "$ROUTES_IMPORT" >> "$CADDY_CONFIG_PATH"
fi

caddy validate --config "$CADDY_CONFIG_PATH"
caddy reload --config "$CADDY_CONFIG_PATH"

echo "instance_url=https://$INSTANCE_HOST"
`;
};
