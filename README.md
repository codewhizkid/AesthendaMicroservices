# Aesthenda Microservices Setup

## Overview
Aesthenda is a scalable, microservices-based salon booking system.

## 📂 Microservices Breakdown
- **User Service (GraphQL)**: Handles authentication and user profiles.
- **Appointment Service (GraphQL)**: Manages booking & scheduling.
- **Notification Service (RabbitMQ)**: Handles email/SMS notifications.
- **Payment Service (Future Integration)**: Manages transactions.
- **API Gateway**: Routes API calls to appropriate services.

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone YOUR_REPO_URL
cd AesthendaMiroservices
```

### 2️⃣ Start Services with Docker
```bash
docker-compose up --build
```

### 3️⃣ Access Services
- API Gateway: [http://localhost:4000](http://localhost:4000)
- User Service: [http://localhost:5001](http://localhost:5001)
- Appointment Service: [http://localhost:5002](http://localhost:5002)
- RabbitMQ Dashboard: [http://localhost:15672](http://localhost:15672) (User: guest, Pass: guest)

---

## 🔧 Next Steps
- Implement user authentication with OAuth 2.0 & JWT.
- Add real-time booking availability checks.
- Expand RabbitMQ messaging to support appointment confirmations.
