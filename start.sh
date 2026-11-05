#!/data/data/com.termux/files/usr/bin/bash
# =============================================================
#  个人网站 · Android 平板一键启动脚本（在 Termux 里运行）
#
#  用法：
#    bash start.sh            # 默认：Python 内置服务器，最省事
#    bash start.sh nginx      # 进阶：用 Nginx 托管，更适合长期后台
#    PORT=9000 bash start.sh  # 自定义端口（默认 8080）
#
#  停止：按 Ctrl + C
# =============================================================
set -u

MODE="${1:-python}"
PORT="${PORT:-8080}"
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"

line() { printf '\033[38;5;205m──────────────────────────────────────────\033[0m\n'; }

get_lan_ip() {
  if command -v ip >/dev/null 2>&1; then
    ip -4 addr 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {sub(/\/.*/,"",$2); print $2; exit}'
  elif command -v ifconfig >/dev/null 2>&1; then
    ifconfig 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {sub(/addr:/,"",$2); print $2; exit}'
  fi
}

show_urls() {
  local ip
  ip="$(get_lan_ip)"
  line
  printf '\033[1m  ✅ 网站已启动\033[0m\n'
  printf '  本机浏览器打开： \033[36mhttp://127.0.0.1:%s\033[0m\n' "$PORT"
  if [ -n "$ip" ]; then
    printf '  同一 WiFi 下别的设备打开： \033[36mhttp://%s:%s\033[0m\n' "$ip" "$PORT"
  else
    printf '  局域网 IP 没查到，可在「设置 → WLAN」里查看本机 IP 后拼上端口\n'
  fi
  printf '  网站目录： %s\n' "$SITE_DIR"
  printf '  按 \033[1mCtrl + C\033[0m 停止服务\n'
  line
}

ensure_pkg() {
  local bin="$1" pkg="$2"
  if ! command -v "$bin" >/dev/null 2>&1; then
    printf '  首次运行，正在安装 %s ...\n' "$pkg"
    pkg install -y "$pkg" || { printf '  安装失败，请检查网络后重试\n'; exit 1; }
  fi
}

case "$MODE" in
  python)
    ensure_pkg python3 python
    show_urls
    cd "$SITE_DIR" || exit 1
    exec python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$SITE_DIR"
    ;;

  nginx)
    ensure_pkg nginx nginx
    CONF="$SITE_DIR/.nginx-runtime.conf"
    cat > "$CONF" <<EOF
worker_processes 1;
error_log  /dev/null crit;
pid        $SITE_DIR/.nginx.pid;
events { worker_connections 256; }
http {
    include       $PREFIX/etc/nginx/mime.types;
    default_type  application/octet-stream;
    access_log    off;
    sendfile      on;
    server {
        listen       $PORT;
        server_name  localhost;
        root         $SITE_DIR;
        index        index.html;
        charset      utf-8;
        location / { try_files \$uri \$uri/ /index.html; }
        location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|webp)\$ {
            expires 1h;
            add_header Cache-Control "public";
        }
    }
}
EOF
    show_urls
    exec nginx -p "$SITE_DIR" -c "$CONF" -g 'daemon off;'
    ;;

  *)
    printf '未知模式：%s\n用法：bash start.sh [python|nginx]\n' "$MODE"
    exit 1
    ;;
esac
