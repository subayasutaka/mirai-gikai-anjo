#!/bin/zsh
# Double-click this file to start the private pilot on this Mac.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
ANJO_WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ANJO_WORKSPACE" || exit 1
if curl -fsS --max-time 3 http://localhost:3000/ >/dev/null 2>&1 && curl -fsS --max-time 3 http://localhost:3001/login >/dev/null 2>&1; then
  open http://localhost:3001/bills
  exit 0
fi
print 'みらい議会を起動します。このウィンドウは開いたままにしてください。'
print '起動後、管理画面 http://localhost:3001/bills を開いてください。'
exec npx --yes pnpm@10.33.0 dev
