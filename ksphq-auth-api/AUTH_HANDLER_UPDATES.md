# Auth Handler Updates for Account Lockout

## Required Changes to `src/handlers/auth.js`

### 1. Add Imports (at top of file)

```javascript
import { checkAccountLockout, recordFailedLogin, resetFailedLoginCount } from '../utils/accountLockout.js';
import bcrypt from 'bcryptjs'; // For hashing session tokens
```

### 2. Update Login Function (lines 165-234)

Replace the login function with this enhanced version:

```javascript
/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
export async function login(request, env) {
  const { ipAddress, userAgent } = getClientMetadata(request);

  // Extract device fingerprint from header
  const deviceFingerprint = request.headers.get('X-Device-Fingerprint');

  // Rate limiting with device fingerprint
  await rateLimitLogin(env.DB, ipAddress, deviceFingerprint);

  // Parse and validate request
  const body = await request.json();
  const validation = validateData(body, loginSchema);

  if (!validation.success) {
    const message = env.ENVIRONMENT === 'development'
      ? validation.errors[0].message
      : 'Invalid request data. Please check your input and try again.';

    throw new AppError(
      message,
      400,
      env.ENVIRONMENT === 'development' ? { errors: validation.errors } : null
    );
  }

  const { email, password } = validation.data;

  // Find user
  const user = await findUserByEmail(env.DB, email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // **NEW: Check account lockout status**
  try {
    await checkAccountLockout(user);
  } catch (lockoutError) {
    // Record this failed login attempt due to lockout
    await recordFailedLogin(env.DB, user, ipAddress, deviceFingerprint, 'account_locked');
    throw lockoutError;
  }

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Account is disabled', 403);
  }

  // **NEW: Check if account is deleted**
  if (user.deleted_at) {
    throw new AppError('Account has been deactivated. Contact your administrator.', 403);
  }

  // Verify password
  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    // **NEW: Record failed login attempt and increment counter**
    await recordFailedLogin(env.DB, user, ipAddress, deviceFingerprint, 'invalid_password');
    // recordFailedLogin throws an AppError with the appropriate message
    return; // This line won't be reached
  }

  // **NEW: Reset failed login count on successful password verification**
  await resetFailedLoginCount(env.DB, user.id);

  // Generate tokens
  const { accessToken, refreshToken, userData } = await generateTokens(user, env, request);

  // **NEW: Create session record in user_sessions table**
  const sessionTokenHash = await bcrypt.hash(refreshToken, 10);
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Detect device name from user agent
  let deviceName = 'Unknown Device';
  if (userAgent) {
    if (userAgent.includes('Chrome')) deviceName = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceName = 'Firefox';
    else if (userAgent.includes('Safari')) deviceName = 'Safari';
    else if (userAgent.includes('Edge')) deviceName = 'Edge';

    if (userAgent.includes('Windows')) deviceName += ' on Windows';
    else if (userAgent.includes('Mac')) deviceName += ' on macOS';
    else if (userAgent.includes('Linux')) deviceName += ' on Linux';
    else if (userAgent.includes('Android')) deviceName += ' on Android';
    else if (userAgent.includes('iOS')) deviceName += ' on iOS';
  }

  await env.DB.prepare(
    `INSERT INTO user_sessions (
      user_id, session_token_hash, device_fingerprint, device_name,
      ip_address, user_agent, expires_at, last_activity_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    user.id,
    sessionTokenHash,
    deviceFingerprint,
    deviceName,
    ipAddress,
    userAgent,
    sessionExpiresAt
  ).run();

  // Update last login
  await updateLastLogin(env.DB, user.id);

  // Create audit log
  await createAuditLog(env.DB, {
    userId: user.id,
    action: 'login',
    ipAddress,
    userAgent,
  });

  // Set cookies and return response
  let response = successResponse({ user: userData });
  response = setCookie(response, 'access_token', accessToken, {
    maxAge: 15 * 60, // 15 minutes
  });
  response = setCookie(response, 'refresh_token', refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/auth/refresh',
  });

  return response;
}
```

## Summary of Changes

1. ✅ Added import statements for account lockout utilities
2. ✅ Check account lockout before attempting login
3. ✅ Record failed login attempts when password is wrong
4. ✅ Reset failed login count on successful login
5. ✅ Create session record in `user_sessions` table
6. ✅ Check for soft-deleted accounts (`deleted_at`)

## Testing the Changes

After applying these changes, test:

```bash
# Test account lockout (make 6 failed login attempts)
for i in {1..6}; do
  curl -X POST http://localhost:8787/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  echo "\nAttempt $i"
done

# Should see:
# Attempt 1-5: "Invalid credentials. X attempts remaining before account lockout."
# Attempt 6: "Account locked due to too many failed attempts. Please try again in 15 minutes."

# Test successful login after correct password
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correctpassword"}'

# Should reset failed_login_count to 0
```

## Database Verification

Check that sessions are being created:

```sql
SELECT * FROM user_sessions WHERE user_id = 'YOUR_USER_ID';
```

Check failed login attempts:

```sql
SELECT * FROM failed_login_attempts ORDER BY attempted_at DESC LIMIT 10;
```

Check user lockout status:

```sql
SELECT email, failed_login_count, locked_until FROM users WHERE email = 'test@example.com';
```
