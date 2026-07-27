bun run webui --no-build
bun run webui --no-build --remote
sub dominio
aiou.mysaasplace.com

new_password=$(curl -fsS -X POST http://127.0.0.1:25819/api/webui/reset-password | sed -n 's/.*"new_password":"\([^"]*\)".*/\1/p'); if [[ -z "$new_password" ]]; then echo RESET_FAILED; exit 1; fi; printf 'NEW_PASSWORD:%s\n' "$new_password"