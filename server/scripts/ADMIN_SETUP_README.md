# ADMIN001 Setup Script

## Overview

This script creates or overwrites the ADMIN001 (sudo admin) user in the database using credentials from the `.env` file.

## Usage

### Quick Start

```bash
cd server
npm run setup-admin
```

### What it does

1. Reads admin credentials from `.env` file:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_NAME`
   - `ADMIN_EMPLOYEE_ID`
   - `ADMIN_SCHOOL`
   - `ADMIN_DEPARTMENT`

2. Creates or overwrites the ADMIN001 user in the database
3. Hashes the password using bcrypt
4. Sets role to "admin"
5. Displays login credentials

### Required Environment Variables

Make sure these are set in your `.env` file:

```env
ADMIN_EMAIL=project.scopecc@vit.ac.in
ADMIN_PASSWORD=Vitadmin@123
ADMIN_NAME=Main Admin
ADMIN_EMPLOYEE_ID=ADMIN001
ADMIN_SCHOOL=SCOPE
ADMIN_DEPARTMENT=CSE
```

### Example Output

```
=== Creating/Updating ADMIN001 ===
Email: project.scopecc@vit.ac.in
Employee ID: ADMIN001
Name: Main Admin
School: SCOPE
Department: CSE
================================

✅ SUCCESS: ADMIN001 created/updated successfully!
   ID: 507f1f77bcf86cd799439011
   Email: project.scopecc@vit.ac.in
   Employee ID: ADMIN001
   Name: Main Admin
   Role: admin
   School: SCOPE

✅ You can now login with:
   Email: project.scopecc@vit.ac.in
   Password: Vitadmin@123
```

### When to Use

- **Initial Setup**: When setting up the application for the first time
- **Password Reset**: If you forget the ADMIN001 password
- **Credential Update**: When you need to change ADMIN001 credentials
- **Database Migration**: After migrating to a new database

### Safety Features

- Uses `findOneAndUpdate` with `upsert: true` to safely create or update
- Automatically hashes passwords with bcrypt
- Validates required environment variables before execution
- Provides clear success/error messages

### Notes

- This script will **overwrite** the existing ADMIN001 user if it exists
- The password in `.env` should be the plain text password (it will be hashed)
- ADMIN001 is the only user who can manage other admins
- Make sure your `.env` file is not committed to version control

## Troubleshooting

### Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set

**Solution**: Add the required variables to your `.env` file

### Error: MongoDB Connection Failed

**Solution**: Check your `MONGO_URI` in `.env` file

### Error: Validation Failed

**Solution**: Ensure email ends with `@vit.ac.in` and all required fields are provided
