# 🚀 PairUp Backend API

Laravel-based REST API for the PairUp project partner matching application.

## 🛠️ Tech Stack

- Laravel 10
- PHP 8.2
- MySQL 8.0
- Docker

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone the repository:
\`\`\`bash
git clone https://github.com/BACKEND_ACCOUNT/pairup-backend.git
cd pairup-backend
\`\`\`

2. Create .env file:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Start Docker containers:
\`\`\`bash
docker-compose up -d --build
\`\`\`

4. Access API at: http://localhost:8000

### Local Development

1. Install dependencies:
\`\`\`bash
composer install
\`\`\`

2. Setup environment:
\`\`\`bash
cp .env.example .env
php artisan key:generate
\`\`\`

3. Run migrations:
\`\`\`bash
php artisan migrate
php artisan db:seed
\`\`\`

4. Start server:
\`\`\`bash
php artisan serve
\`\`\`

## 📚 API Endpoints

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed endpoint information.

## 🤝 Contributing

Pull requests are welcome!

## 📄 License

MIT License