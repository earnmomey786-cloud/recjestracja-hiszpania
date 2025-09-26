# Usar una imagen base de Node.js
FROM node:18-alpine AS base

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias para producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar los archivos construidos desde la etapa base
COPY --from=base /app/.next ./.next
COPY --from=base /app/next.config.* ./

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]