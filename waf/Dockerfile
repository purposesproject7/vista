FROM nginx:1.25-alpine AS base

RUN apk add --no-cache \
    pcre-dev \
    zlib-dev \
    build-base \
    git \
    openssl-dev \
    libxml2-dev \
    libmaxminddb-dev \
    yajl-dev \
    curl-dev \
    linux-headers

WORKDIR /tmp

ARG MODSEC_VERSION=3.0.12
ARG OWASP_CRS_VERSION=4.4.0

RUN git clone --depth 1 -b v${MODSEC_VERSION} https://github.com/owasp-modsecurity/ModSecurity.git && \
    cd ModSecurity && \
    git submodule init && \
    git submodule update && \
    ./build.sh && \
    ./configure --with-yajl --with-lmdb --with-curl --with-maxmind --with-geoip --enable-static-yajl && \
    make -j$(nproc) && \
    make install

RUN git clone --depth 1 -b v${MODSEC_VERSION} https://github.com/owasp-modsecurity/ModSecurity-nginx.git

RUN wget https://nginx.org/download/nginx-1.25.5.tar.gz && \
    tar -xzf nginx-1.25.5.tar.gz && \
    cd nginx-1.25.5 && \
    ./configure --with-compat --add-dynamic-module=../ModSecurity-nginx && \
    make modules && \
    cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules/

FROM nginx:1.25-alpine

RUN apk add --no-cache \
    libmaxminddb \
    yajl \
    libxml2 \
    curl \
    ca-certificates \
    tzdata

ARG OWASP_CRS_VERSION=4.4.0

COPY --from=base /etc/nginx/modules/ngx_http_modsecurity_module.so /etc/nginx/modules/ngx_http_modsecurity_module.so
COPY --from=base /usr/local/modsecurity /usr/local/modsecurity
COPY --from=base /usr/local/lib/libmodsecurity.so* /usr/local/lib/

RUN ldconfig /usr/local/lib

RUN mkdir -p /etc/nginx/owasp-crs && \
    wget -qO /tmp/crs.tar.gz \
      https://github.com/coreruleset/coreruleset/archive/refs/tags/v${OWASP_CRS_VERSION}.tar.gz && \
    tar -xzf /tmp/crs.tar.gz -C /tmp && \
    mv /tmp/coreruleset-${OWASP_CRS_VERSION}/rules /etc/nginx/owasp-crs/rules && \
    mv /tmp/coreruleset-${OWASP_CRS_VERSION}/plugins /etc/nginx/owasp-crs/plugins && \
    cp /tmp/coreruleset-${OWASP_CRS_VERSION}/crs-setup.conf.example /etc/nginx/owasp-crs/crs-setup.conf && \
    rm -rf /tmp/crs.tar.gz /tmp/coreruleset-${OWASP_CRS_VERSION}

COPY nginx.conf /etc/nginx/nginx.conf
COPY modsecurity-rules.conf /etc/nginx/modsecurity-rules.conf
COPY blocked-user-agents.data /etc/nginx/blocked-user-agents.data

RUN mkdir -p /var/log/nginx && \
    mkdir -p /var/cache/nginx && \
    touch /var/log/nginx/error.log && \
    touch /var/log/nginx/access.log && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /etc/nginx

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

USER nginx

EXPOSE 80 443

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
