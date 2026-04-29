#!/usr/bin/env bash
set -euo pipefail

# make-db-url.sh
# Build a MySQL DATABASE_URL from DB_* env vars, URL-encode password safely,
# and optionally write/update values in .env.

# Sensible defaults (can be overridden by exported env vars)
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-primewayz-lpageuk}"
DB_PASS="${DB_PASS:-}"
ENV_FILE="${ENV_FILE:-.env}"
WRITE_ENV="${WRITE_ENV:-false}"
WRITE_FULL_ENV="${WRITE_FULL_ENV:-false}"
PROMPT_PASSWORD="${PROMPT_PASSWORD:-false}"

error() {
  echo "Error: $*" >&2
  exit 1
}

# Prompt password securely if requested and DB_PASS not already provided.
if [[ -z "$DB_PASS" && "$PROMPT_PASSWORD" == "true" ]]; then
  read -r -s -p "Enter MySQL password (DB_PASS): " DB_PASS
  echo
fi

# DB_PASS is required explicitly.
[[ -n "$DB_PASS" ]] || error "DB_PASS is required. Export DB_PASS or set PROMPT_PASSWORD=true."
[[ -n "$DB_USER" ]] || error "DB_USER is required."
[[ -n "$DB_HOST" ]] || error "DB_HOST is required."
[[ -n "$DB_PORT" ]] || error "DB_PORT is required."
[[ -n "$DB_NAME" ]] || error "DB_NAME is required."

# URL-encode password using Node.js (core project runtime).
if ! command -v node >/dev/null 2>&1; then
  error "Node.js is required for safe URL encoding of DB_PASS."
fi
ENCODED_PASS="$(node -e 'const v = process.argv[1] || ""; process.stdout.write(encodeURIComponent(v));' "$DB_PASS")"

DATABASE_URL="mysql://${DB_USER}:${ENCODED_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Print the final value (be careful: this includes credentials).
echo "DATABASE_URL=${DATABASE_URL}"

quote_for_env() {
  # Escape backslash and double quotes for .env double-quoted values.
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

update_or_append_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  local tmp_file
  tmp_file="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN { replaced = 0 }
    $0 ~ ("^" key "=") {
      if (replaced == 0) {
        print key "=" value
        replaced = 1
      }
      next
    }
    { print }
    END {
      if (replaced == 0) {
        print key "=" value
      }
    }
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
}

if [[ "$WRITE_ENV" == "true" || "$WRITE_FULL_ENV" == "true" ]]; then
  [[ -f "$ENV_FILE" ]] || touch "$ENV_FILE"
  update_or_append_env "DATABASE_URL" "$(quote_for_env "$DATABASE_URL")" "$ENV_FILE"
fi

if [[ "$WRITE_FULL_ENV" == "true" ]]; then
  update_or_append_env "DB_HOST" "$DB_HOST" "$ENV_FILE"
  update_or_append_env "DB_PORT" "$DB_PORT" "$ENV_FILE"
  update_or_append_env "DB_USER" "$DB_USER" "$ENV_FILE"
  update_or_append_env "DB_PASSWORD" "$(quote_for_env "$DB_PASS")" "$ENV_FILE"
  update_or_append_env "DB_NAME" "$DB_NAME" "$ENV_FILE"
fi
