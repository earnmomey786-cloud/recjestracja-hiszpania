# Usar una imagen base de Node.js
FROM node:18-slim AS base

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci --omit=optional --no-audit --no-fund

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-slim AS production

# Establecer el directorio de trabajo
WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production

# Copiar archivos de dependencias para producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& npm ci --only=production --no-audit --no-fund \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm cache clean --force

# Copiar los archivos construidos desde la etapa base
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.* ./

# Exponer el puerto
EXPOSE 3000

# Crear usuario no-root y cambiar permisos
RUN useradd -m -s /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck sencillo (Dockploy puede usarlo)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para ejecutar la aplicación
CMD ["npm", "start"]