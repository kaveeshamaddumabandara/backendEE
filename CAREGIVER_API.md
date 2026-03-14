# Caregiver API Endpoints

Backend server is running on `http://localhost:3001`

## Authentication
All endpoints require authentication token in header:
```
Authorization: Bearer <token>
```

## Dashboard Endpoints

### 1. Get Dashboard Stats
**Endpoint:** `GET /api/caregiver/dashboard/stats`

**Response:**
```json
{
  "status": "success",
  "data": {
    "earnings": 224000,
    "clients": 8,
    "hours": 64,
    "rating": 4.9
  }
}
```

### 2. Get Weekly Earnings
**Endpoint:** `GET /api/caregiver/dashboard/weekly-earnings`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "day": "Sun",
      "earnings": 17500,
      "hours": 5
    },
    {
      "day": "Mon",
      "earnings": 28000,
      "hours": 8
    }
    // ... for each day of the week
  ]
}
```

### 3. Get Performance Metrics
**Endpoint:** `GET /api/caregiver/dashboard/performance`

**Response:**
```json
{
  "status": "success",
  "data": {
    "taskCompletion": {
      "value": 98,
      "target": 95,
      "label": "Task Completion Rate"
    },
    "responseTime": {
      "value": 92,
      "target": 90,
      "label": "Response Time"
    },
    "clientRetention": {
      "value": 87,
      "target": 85,
      "label": "Client Retention"
    },
    "punctuality": {
      "value": 95,
      "target": 90,
      "label": "Punctuality Score"
    }
  }
}
```

### 4. Get Client Satisfaction
**Endpoint:** `GET /api/caregiver/dashboard/satisfaction`

**Response:**
```json
{
  "status": "success",
  "data": {
    "satisfaction": [
      {
        "category": "Excellent",
        "percentage": 56,
        "count": 45
      },
      {
        "category": "Good",
        "percentage": 35,
        "count": 28
      },
      {
        "category": "Average",
        "percentage": 8,
        "count": 6
      },
      {
        "category": "Poor",
        "percentage": 1,
        "count": 1
      }
    ],
    "averageRating": 4.9,
    "totalReviews": 80,
    "satisfactionRate": 91
  }
}
```

### 5. Get Recent Feedback
**Endpoint:** `GET /api/caregiver/dashboard/feedback?page=1&limit=3`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Response:**
```json
{
  "status": "success",
  "data": {
    "feedback": [
      {
        "_id": "...",
        "userId": {
          "name": "Sarah Johnson"
        },
        "rating": 5,
        "message": "Excellent care and very professional...",
        "createdAt": "2026-01-30T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 3,
      "total": 8,
      "pages": 3
    }
  }
}
```

### 6. Get Upcoming Schedule
**Endpoint:** `GET /api/caregiver/dashboard/schedule`

**Response:**
```json
{
  "status": "success",
  "data": []
}
```

## Profile Endpoints

### 1. Get Profile
**Endpoint:** `GET /api/caregiver/profile`

**Response:**
```json
{
  "status": "success",
  "data": {
    "caregiver": {
      "_id": "...",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+94771234567",
        "address": "...",
        "profileImage": "..."
      },
      "qualification": "Bachelor's in Nursing",
      "experience": 5,
      "specialization": ["Elderly Care", "Dementia Care"],
      "skills": ["First Aid", "CPR", "Patient Care"],
      "education": "Bachelor's in Nursing from University of Colombo",
      "certifications": [],
      "certificationsText": "Certified Nursing Assistant, First Aid Certified",
      "hourlyRate": 2500,
      "rating": 4.9,
      "totalReviews": 80,
      "languages": ["English", "Sinhala", "Tamil"],
      "bio": "Experienced caregiver with 5 years...",
      "status": "available",
      "assignedCareReceivers": [],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### 2. Update Profile
**Endpoint:** `PUT /api/caregiver/profile`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+94771234567",
  "qualification": "Bachelor's in Nursing",
  "experience": 5,
  "specialization": ["Elderly Care", "Dementia Care"],
  "skills": ["First Aid", "CPR", "Patient Care"],
  "education": "Bachelor's in Nursing from University of Colombo",
  "hourlyRate": 2500,
  "bio": "Experienced caregiver with passion for elderly care...",
  "languages": ["English", "Sinhala", "Tamil"],
  "certificationsText": "Certified Nursing Assistant, First Aid Certified"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "caregiver": {
      // Updated caregiver object
    }
  }
}
```

## Other Existing Endpoints

### Get Assigned Receivers
**Endpoint:** `GET /api/caregiver/assigned-receivers`

### Update Status
**Endpoint:** `PATCH /api/caregiver/status`

**Request Body:**
```json
{
  "status": "available" // or "on-duty" or "unavailable"
}
```

## Model Updates

### Caregiver Model
Added new fields:
- `skills`: Array of strings
- `education`: String

### Payment Model
Added new fields:
- `caregiverId`: Reference to Caregiver
- `hoursWorked`: Number (hours worked for this payment)
- `LKR` added to currency enum

## Testing the API

Use tools like Postman or curl to test endpoints:

```bash
# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"caregiver@example.com","password":"password123"}'

# Get dashboard stats
curl -X GET http://localhost:3001/api/caregiver/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PUT http://localhost:3001/api/caregiver/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "experience": 5,
    "hourlyRate": 2500,
    "bio": "Experienced caregiver..."
  }'
```

## Notes

1. **Weekly Earnings**: Calculated from Payment collection with `caregiverId` and date range
2. **Stats**: Aggregated from payments, assigned clients, and caregiver rating
3. **Satisfaction**: Calculated based on rating and total reviews
4. **Performance Metrics**: Currently returns mock data - can be enhanced with actual tracking
5. **Schedule**: Returns empty array - needs integration with scheduling system
6. **Currency**: Default changed to LKR (Sri Lankan Rupees)

## Frontend Integration

Update the API service in mobile app to use these endpoints:

```typescript
// Get dashboard stats
const stats = await ApiService.get('/caregiver/dashboard/stats');

// Get weekly earnings
const earnings = await ApiService.get('/caregiver/dashboard/weekly-earnings');

// Update profile
const updated = await ApiService.put('/caregiver/profile', profileData);
```
