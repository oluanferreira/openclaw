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
ROUTES_IMPORT="import $CADDY_ROUTES_DIR/*.caddy"

cat > "$ROUTE_FILE" <<EOF
$INSTANCE_HOST {
  header {
    -X-Forwarded-User
  }

  forward_auth $AUTH_CHECK_ORIGIN {
    uri /api/openclaw/access
    header_up Host {upstream_hostport}
    header_up X-OpenClaw-Instance-Host {host}
    copy_headers X-Forwarded-User
  }

  reverse_proxy 127.0.0.1:$PORT {
    header_up X-Forwarded-User {header.X-Forwarded-User}
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
    header_up X-Forwarded-For {remote_host}
  }
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
