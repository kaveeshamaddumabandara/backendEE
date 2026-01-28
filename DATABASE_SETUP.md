# Quick Start - Database Setup

## Populate Database with Sample Data

To quickly populate your database with test data for all admin pages:

```bash
npm run seed
```

This will create:
- ✅ 2 Admin users
- ✅ 5 Active caregivers with full profiles
- ✅ 3 Pending caregiver requests
- ✅ 4 Care receivers with medical information
- ✅ 8 Feedback entries (reviews and ratings)
- ✅ 8 Payment records (completed, pending, failed)

### Admin Login Credentials
```
Email: admin@elderease.lk
Password: admin123
```

### What You Can Test

After seeding, you can test all admin features:

**Dashboard**
- View user statistics
- See recent activities
- Check revenue data (~80,000 LKR total)

**User Management**
- Browse 14 users (2 admins, 8 caregivers, 4 care receivers)
- View detailed user profiles
- Change user status (active/inactive)
- Delete users with reason tracking

**Pending Requests**
- Review 3 pending caregiver applications
- View caregiver documents and qualifications
- Approve or reject with reasons

**Feedback Management**
- View 8 feedback entries
- See ratings and comments
- Filter by status (pending/reviewed)

**Payment Management**
- View 8 payment transactions
- See different payment statuses and methods
- Filter by date, status, amount

### Re-running the Seed Script

The seed script automatically clears existing data before populating. You can run it multiple times safely:

```bash
npm run seed
```

For detailed information, see: `scripts/SEED_README.md`
