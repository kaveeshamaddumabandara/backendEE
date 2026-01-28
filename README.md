# ElderEase Backend API

Backend API for ElderEase - Eldercare and Caregiver Management System

## Features

- User authentication (JWT-based)
- Three user roles: Admin, Caregiver, Care Receiver
- MongoDB database integration
- RESTful API architecture
- Role-based access control

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update MongoDB URI and other settings as needed

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the server:

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on http://localhost:5000

## Default Admin Credentials

- Email: admin@elderease.com
- Password: Admin@123

**Important:** Change these credentials after first login!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### Admin Routes (Protected)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/toggle-status` - Toggle user active status
- `GET /api/admin/caregivers` - Get all caregivers
- `GET /api/admin/carereceivers` - Get all care receivers

### Caregiver Routes (Protected)
- `GET /api/caregiver/profile` - Get caregiver profile
- `PUT /api/caregiver/profile` - Update profile
- `GET /api/caregiver/assigned-receivers` - Get assigned care receivers
- `PATCH /api/caregiver/status` - Update availability status

### Care Receiver Routes (Protected)
- `GET /api/carereceiver/profile` - Get care receiver profile
- `PUT /api/carereceiver/profile` - Update profile
- `GET /api/carereceiver/assigned-caregivers` - Get assigned caregivers

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── admin.controller.js  # Admin operations
│   ├── caregiver.controller.js
│   └── carereceiver.controller.js
├── middleware/
│   ├── auth.middleware.js   # JWT verification & authorization
│   └── validation.middleware.js
├── models/
│   ├── User.model.js        # User schema
│   ├── Caregiver.model.js   # Caregiver profile schema
│   └── CareReceiver.model.js # Care receiver profile schema
├── routes/
│   ├── auth.routes.js
│   ├── admin.routes.js
│   ├── caregiver.routes.js
│   └── carereceiver.routes.js
├── utils/
│   └── initAdmin.js         # Initialize default admin
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## Testing the API

Use Postman or any API client:

1. **Register a user:**
```json
POST http://localhost:5000/api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "caregiver",
  "phone": "1234567890"
}
```

2. **Login:**
```json
POST http://localhost:5000/api/auth/login
{
  "email": "admin@elderease.com",
  "password": "Admin@123"
}
```

3. **Use the returned token in Authorization header:**
```
Authorization: Bearer <your_token_here>
```

## License

ISC
