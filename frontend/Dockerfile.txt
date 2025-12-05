FROM node:18-alpine

WORKDIR /app

# Install Expo CLI
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project
COPY . .

# Expose ports
EXPOSE 8081 19000 19001 19002

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "--tunnel"]