FROM node:18-alpine
WORKDIR /app

# 1) Copia os arquivos de definição do projeto
COPY package.json package-lock.json ./

# 2) Instala dependências produção
RUN npm ci --omit=dev

# 3) Copia o restante do código (server.js entre outros)
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
