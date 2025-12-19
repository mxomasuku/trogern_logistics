# Create Admin User Script - Production

This script creates an admin user in the **production** Firebase environment.

## ⚠️ Important Safety Notes

- This script connects to **PRODUCTION** Firebase (not emulators)
- It includes a 3-second safety delay before execution
- Make sure your `.env.production` file has the correct Firebase credentials
- The script will explicitly remove any emulator environment variables

## Prerequisites

1. Ensure `.env.production` exists with the following variables:
   ```
   FIREBASE_PROJECT_ID=your-production-project-id
   # Add other Firebase credentials as needed
   ```

2. Ensure you have proper Firebase service account credentials configured

## Usage

### Basic Usage (using default values)

```bash
npm run create-admin-user-production
```

This will create a user with default values:
- Email: `admin@trogern.com`
- Password: `founder666!`
- Name: `Mxolisi Masuku`
- Role: `founder`

### Custom Usage (with command-line arguments)

```bash
npm run create-admin-user-production -- <email> <password> <name> <role>
```

Example:
```bash
npm run create-admin-user-production -- admin@trogern.com SecurePass123! "Admin User" admin
```

## What the Script Does

1. Loads `.env.production` file
2. Removes any emulator environment variables
3. Displays user details and warns about production environment
4. Waits 3 seconds (allows you to cancel with Ctrl+C)
5. Creates the user in Firebase Authentication
6. Sets custom claims (`adminRole`)
7. Creates a document in the `admin-users` Firestore collection

## Output

The script will display:
- Progress messages at each step
- The created user's UID
- Credentials (save these securely!)
- Reminder to change password after first login

## Roles

Available roles (customize in your domain package):
- `founder` - Highest level admin
- `admin` - Standard admin
- `manager` - Limited admin permissions

## Troubleshooting

If the script fails:
1. Verify `.env.production` has correct Firebase credentials
2. Ensure you have proper Firebase Admin SDK permissions
3. Check if the email already exists (script will update if it does)
4. Verify your Firebase project ID is correct

## Security Best Practices

1. **Never commit** `.env.production` to version control
2. **Change the default password** immediately after first login
3. **Use strong passwords** for production admin accounts
4. **Limit admin users** to only those who need access
5. **Audit admin users** regularly
