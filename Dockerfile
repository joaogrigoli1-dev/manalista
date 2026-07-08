# Multi-stage: build Next.js then create runtime with Node + Python
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
# Install Python 3 + pip + reportlab + wget (for healthcheck) — precisa de
# root, então é feito ANTES de trocar para o usuário não-privilegiado abaixo.
RUN apk add --no-cache python3 py3-pip wget && \
    pip3 install --break-system-packages reportlab==4.4.10
# C.4 fix: cria usuário/grupo não-privilegiado (equivalente ao "nextjs"
# recomendado pelo Next.js) para o processo final não rodar como root.
RUN addgroup -S app && adduser -S app -G app
# Copy built app — chown já no COPY para os arquivos pertencerem a "app"
# desde a criação, sem precisar de um RUN chown -R extra depois.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/scripts ./scripts
ENV NODE_ENV=production
ENV PORT=3000
# HOSTNAME=0.0.0.0 garante que Next.js standalone escute em todas interfaces (default seria o hostname do container)
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1
# Troca para o usuário não-privilegiado antes de executar o processo da app.
USER app
CMD ["node", "server.js"]