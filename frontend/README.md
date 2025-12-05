# 📱 PairUp Frontend

React Native mobile application for the PairUp project partner matching platform.

## 🛠️ Tech Stack

- React Native (Expo)
- TypeScript
- React Navigation
- Axios
- AsyncStorage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo Go app on your mobile device
- Backend API running (see [backend repo](https://github.com/BACKEND_ACCOUNT/pairup-backend))

### Using Docker

1. Clone the repository:
\`\`\`bash
git clone https://github.com/FRONTEND_ACCOUNT/pairup-frontend.git
cd pairup-frontend
\`\`\`

2. Configure API URL in \`app/services/api.ts\`:
\`\`\`typescript
const BASE_URL = 'http://YOUR_BACKEND_IP:8000/api';
\`\`\`

3. Start Docker:
\`\`\`bash
docker-compose up -d --build
\`\`\`

4. Open http://localhost:19000 and scan QR code

### Local Development

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure API URL in \`app/services/api.ts\`

3. Start Expo:
\`\`\`bash
npx expo start
\`\`\`

4. Scan QR code with Expo Go app

## 📱 Running on Device

### iOS
1. Install Expo Go from App Store
2. Scan QR code with Camera app

### Android
1. Install Expo Go from Play Store
2. Scan QR code in Expo Go app

## 🔗 Backend Repository

[PairUp Backend](https://github.com/BACKEND_ACCOUNT/pairup-backend)

## 🤝 Contributing

Pull requests are welcome!

## 📄 License

MIT License