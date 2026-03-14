# Database Seed Script

This script populates the ElderEase database with sample data for testing and development.

## What It Creates

The seed script creates:

### 👤 **Admin Users** (2)
- **Email:** admin@elderease.lk
- **Password:** admin123
- Role: admin

### 👨‍⚕️ **Caregivers** (5 approved + 3 pending)
**Approved Caregivers:**
1. Nimal Perera (8 years experience, rating 4.8)
2. Chamari Silva (5 years experience, rating 4.6)
3. Ruwan Fernando (10 years experience, rating 4.9, on-duty)
4. Sanduni Jayawardena (6 years experience, rating 4.7)
5. Kasun Wickramasinghe (3 years experience, inactive)

**Pending Requests:**
1. Dilshan Rajapaksa (4 years experience)
2. Nimali Dissanayake (2 years experience)
3. Pradeep Silva (7 years experience)

Each caregiver has:
- Complete profile with specializations and qualifications
- Document URLs (ID proof, police verification, medical certificate)
- Bio, languages, hourly rates
- Experience and rating information

### 👴 **Care Receivers** (4)
1. Kumudu Wijesinghe (78 years, female)
2. Priyantha Rajapaksa (82 years, male)
3. Ramani Fernando (75 years, female)
4. Susantha Gunawardena (85 years, male)

Each care receiver has:
- Medical conditions and medications
- Special requirements
- Emergency contact information
- Mobility level

### 💬 **Feedback Entries** (8)
- 6 caregiver reviews (4-5 star ratings)
- 2 platform feedback entries
- Mix of reviewed and pending status

### 💰 **Payment Records** (8)
- Completed payments: 6
- Pending payments: 1
- Failed payments: 1
- Payment methods: Card, Bank Transfer, Cash
- Amounts in LKR (ranging from 4,800 to 16,000)
- Dates spread over the past 10 days

## How to Run

### Prerequisites
- MongoDB must be running
- Backend environment configured (.env file with MONGODB_URI)

### Run the Seed Script

```bash
# From the backend directory
cd backend

# Run the seed script
npm run seed
```

### What Happens
1. ✅ Connects to MongoDB
2. 🗑️ Clears all existing data
3. 👤 Creates admin users
4. 👨‍⚕️ Creates caregivers with profiles
5. ⏳ Creates pending caregiver requests
6. 👴 Creates care receivers with profiles
7. 💬 Creates feedback entries
8. 💰 Creates payment records
9. 📊 Displays summary

### Output Example
```
🚀 ElderEase Database Seed Script

============================================================
✓ MongoDB Connected: localhost

🗑️  Clearing existing data...
✓ Database cleared

👤 Creating admin users...
✓ Created 2 admin users

👨‍⚕️ Creating caregivers...
✓ Created 5 caregivers with profiles

⏳ Creating pending caregiver requests...
✓ Created 3 pending caregiver requests

👴 Creating care receivers...
✓ Created 4 care receivers with profiles

💬 Creating feedback entries...
✓ Created 8 feedback entries

💰 Creating payment records...
✓ Created 8 payment records

============================================================

✅ Database population completed successfully!

📈 Summary:
   - Users: 14
   - Caregivers: 8
   - Care Receivers: 4
   - Feedback Entries: 8
   - Payment Records: 8

🔐 Admin Credentials:
   Email: admin@elderease.lk
   Password: admin123

============================================================

🎉 All done! You can now start the server and log in to test the application.
```

## Testing the Data

After running the seed script, you can:

1. **Login as Admin**
   - Email: admin@elderease.lk
   - Password: admin123

2. **View Dashboard**
   - See statistics (14 users, 8 caregivers, 4 care receivers)
   - View recent activities
   - Check revenue data (total: ~80,000 LKR)

3. **User Management**
   - View all 14 users
   - Filter by role (admin, caregiver, carereceiver)
   - View user details with profiles
   - Test activation/deactivation
   - Test user deletion with reason

4. **Pending Requests**
   - See 3 pending caregiver applications
   - View full details including documents
   - Test approval/rejection with reasons

5. **Feedback Management**
   - View 8 feedback entries
   - See mix of caregiver and platform feedback
   - Filter by status (pending/reviewed)
   - View ratings and comments

6. **Payment Management**
   - View 8 payment records
   - See different payment statuses
   - Filter by status, method, date
   - View amounts in LKR format

## Notes

- All users have the password: **password123** (except admins: **admin123**)
- All data is Sri Lankan themed (names, addresses, phone numbers)
- Phone numbers follow Sri Lankan format (+94...)
- Addresses include Sri Lankan cities (Colombo, Kandy, Galle, Negombo)
- Currency is in LKR (Sri Lankan Rupees)

## Clearing the Database

The seed script automatically clears all data before seeding. If you want to re-run it:

```bash
npm run seed
```

This will:
1. Delete all existing users, profiles, feedback, and payments
2. Recreate everything from scratch

## Customization

To modify the seed data, edit:
- `backend/scripts/seedDatabase.js`

You can:
- Add more users
- Change user details
- Modify ratings and feedback
- Adjust payment amounts
- Change dates and statuses
