FROM owasp/modsecurity-crs:nginx-alpine

USER root

RUN apk add --no-cache curl

COPY modsecurity-rules.conf /etc/nginx/modsecurity-rules.conf
COPY blocked-user-agents.data /etc/nginx/blocked-user-agents.data
COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run /etc/nginx

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

USER nginx

EXPOSE 80 443

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
