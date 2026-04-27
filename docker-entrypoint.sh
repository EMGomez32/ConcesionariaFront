#!/bin/sh
set -e

# Si no se setea BACKEND_ORIGIN, lo derivamos de VITE_API_BASE_URL (eliminamos
# el path /api). Así con una sola env var en Coolify queda todo configurado.
if [ -z "${BACKEND_ORIGIN}" ] && [ -n "${VITE_API_BASE_URL}" ]; then
    BACKEND_ORIGIN=$(echo "${VITE_API_BASE_URL}" | sed -E 's|^(https?://[^/]+).*|\1|')
fi
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://localhost:3000}"

# Derivar variante WS por si la app usa websockets en el futuro.
WS_ORIGIN=$(echo "${BACKEND_ORIGIN}" | sed -E 's|^http(s?)://|ws\1://|')

export BACKEND_ORIGIN
export WS_ORIGIN

echo "[entrypoint] BACKEND_ORIGIN=${BACKEND_ORIGIN}"
echo "[entrypoint] WS_ORIGIN=${WS_ORIGIN}"

# Renderizar el template de nginx con las env vars resueltas.
envsubst '${BACKEND_ORIGIN} ${WS_ORIGIN}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

exec "$@"
