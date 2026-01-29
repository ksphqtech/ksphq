# Admin Pages Documentation

Complete documentation for the Business Info, Users, and Permissions pages.

## Overview

Three new administrative pages have been added to the KSP HQ platform:

1. **Business Info** - Company details and settings
2. **Users** - User management and role assignment
3. **Permissions** - Granular tool access control

All pages feature:
- Clean, compact, professional design
- Role-based access control
- Real-time localStorage integration
- Responsive mobile layouts
- Toast notifications for actions

---

## 1. Business Info Page

**Route:** `/business-info`
**Access:** All authenticated users (Admin can edit, Manager/User read-only)

### Features

- **Company Details Section**
  - Company name
  - Industry
  - Founded date
  - Employee count
  - Description

- **Contact Information Section**
  - Email
  - Phone
  - Website

- **Address Section**
  - Street address
  - City, State, ZIP
  - Country

- **Business Settings Section**
  - Timezone
  - Currency

### User Experience

- **Admins:** Click "Edit Information" to modify any field
- **Managers/Users:** View-only with "Read Only" badge
- Data stored in `localStorage.businessInfo`
- Toast confirmation on save

### Default Data

```javascript
{
  companyName: 'KSP HQ Demo Company',
  industry: 'Logistics & Warehousing',
  foundedDate: '2020-01-15',
  address: '123 Business Park Drive',
  city: 'Enterprise City',
  state: 'CA',
  zipCode: '90210',
  country: 'United States',
  phone: '+1 (555) 123-4567',
  email: 'contact@ksphq.com',
  website: 'https://ksphq.com',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
  employeeCount: '50-100'
}
```

---

## 2. Users Page

**Route:** `/users`
**Access:** Admin (full CRUD), Manager (view-only)

### Features

- **Statistics Dashboard**
  - Total users count
  - Admins count
  - Managers count
  - Users count

- **User Table**
  - Avatar with initials
  - Email address
  - Role badge (color-coded)
  - Created date
  - Action buttons

- **Search Functionality**
  - Real-time search by email
  - Filter results instantly

- **User Actions (Admin Only)**
  - Edit user role
  - Delete user (except own account)

### User Management

#### Edit User Role

1. Click edit icon (pencil)
2. Modal appears with role options:
   - **Admin:** Full access to all features
   - **Manager:** Access to tools and view users
   - **User:** Limited access based on permissions
3. Select new role
4. Click "Save Changes"
5. Permissions automatically updated to role defaults

#### Delete User

1. Click delete icon (trash)
2. Confirmation dialog appears
3. Cannot delete your own account
4. Confirm to permanently remove user

### Data Source

- Reads from `localStorage.users` array
- Displays actual user data in real-time
- Updates persist immediately

---

## 3. Permissions Page

**Route:** `/permissions`
**Access:** Admin only

### Features

- **Per-User Permission Management**
  - View all non-admin users
  - Toggle access for each tool
  - Visual indicators (checkmark/X)
  - Enable/Disable all buttons

- **Tools with Granular Control**
  - Workforce Control
  - Dock Control
  - Project Control
  - HQ Tickets

- **Bulk Actions**
  - Enable All: Grant access to all tools
  - Disable All: Revoke access to all tools

### User Experience

1. Each user displayed in a card
2. Four toggle buttons (one per tool)
3. Green border = enabled, gray border = disabled
4. Changes tracked, "Save Changes" button appears
5. Click "Save" to persist to localStorage
6. Click "Cancel" to discard changes

### Permission Logic

- **Admins:** Automatically have all permissions (not shown in list)
- **Managers:** Can be granted/revoked tool access
- **Users:** Can be granted/revoked tool access
- Permissions stored in user object: `user.permissions.toolName`

### Access Denied

Regular users and managers see:
- Shield icon
- "Access Denied" message
- "Only administrators can manage permissions"

---

## Role-Based Navigation

### Navigation Visibility

| Page | Admin | Manager | User |
|------|-------|---------|------|
| Dashboard | ✓ | ✓ | ✓ |
| Business Info | ✓ | ✓ | ✓ |
| Users | ✓ | ✓ (view) | ✗ |
| Permissions | ✓ | ✗ | ✗ |

### Side Navigation

- **Dashboard:** Always visible
- **Business Info:** Always visible
- **Users:** Visible to Admin & Manager
- **Permissions:** Visible to Admin only

---

## Data Flow

### Business Info Flow

```
User clicks "Edit" → Form becomes editable → User changes fields
→ Click "Save" → updateBusinessInfo() → localStorage.businessInfo updated
→ State updated → Toast notification → Form returns to read-only
```

### Users Flow

```
Page loads → getUsers() from localStorage → Display in table
→ Admin clicks "Edit" → Modal opens → Select new role
→ Click "Save" → updateUser() → localStorage.users updated
→ Reload users → Close modal → Toast notification
```

### Permissions Flow

```
Page loads → getUsers() → Filter out admins → Display cards
→ Admin toggles permission → Track in pendingChanges state
→ "Save Changes" button appears → Click "Save"
→ Loop through pendingChanges → updateUser() for each
→ localStorage updated → Clear pendingChanges → Toast notification
```

---

## Technical Implementation

### File Structure

```
src/
├── lib/
│   └── businessInfo.js          # Business info utilities
├── components/
│   └── users/
│       ├── EditUserDialog.jsx   # Edit user modal
│       └── DeleteUserDialog.jsx # Delete confirmation modal
└── pages/
    ├── BusinessInfoPage.jsx     # Business info page
    ├── UsersPage.jsx            # Users management page
    └── PermissionsPage.jsx      # Permissions management page
```

### Key Components

**BusinessInfoPage**
- Form with conditional editing
- Role-based edit button visibility
- localStorage integration
- Responsive 2-column grid

**UsersPage**
- Statistics cards
- Searchable user table
- Edit/Delete modals
- Role badge variants

**PermissionsPage**
- User permission matrix
- Toggle-based UI
- Pending changes tracker
- Bulk action buttons

---

## Usage Examples

### Example 1: Creating a New Manager

1. Admin creates new user via signup: `manager@company.com`
2. Navigate to `/users`
3. Find the user in table
4. Click edit icon
5. Select "Manager" role
6. Click "Save Changes"
7. User now has manager permissions

### Example 2: Granting Tool Access

1. Admin navigates to `/permissions`
2. Finds user: `john@company.com`
3. Clicks on "Workforce Control" (gray → green)
4. Clicks on "Dock Control" (gray → green)
5. Click "Save Changes" button at top
6. User can now access those two tools

### Example 3: Updating Company Info

1. Admin navigates to `/business-info`
2. Click "Edit Information"
3. Update company name to "New Company Name"
4. Update phone number
5. Click "Save Changes"
6. Toast confirms update
7. All users see updated info

---

## Mobile Responsiveness

All three pages are fully responsive:

- **Desktop (>768px):**
  - Full table layouts
  - 2-column grids
  - Spacious cards

- **Tablet (768-1024px):**
  - Responsive grids
  - Scrollable tables
  - Adjusted padding

- **Mobile (<768px):**
  - Stacked layouts
  - Horizontal table scroll
  - Full-width forms
  - Touch-friendly buttons

---

## Testing Guide

### Test Business Info

1. Login as admin
2. Navigate to Business Info
3. Click "Edit Information"
4. Change company name
5. Click "Save Changes"
6. Verify toast appears
7. Refresh page → changes persist
8. Logout and login as manager → verify read-only

### Test Users

1. Login as admin
2. Create test user via signup page
3. Navigate to Users page
4. Verify user appears in table
5. Search for user email
6. Edit user role to "Manager"
7. Try to delete own account (should be disabled)
8. Delete test user → verify removed
9. Check localStorage → user gone

### Test Permissions

1. Login as admin
2. Navigate to Permissions
3. Find a manager or user
4. Toggle all permissions off
5. Click "Save Changes"
6. Logout and login as that user
7. Verify tools are locked on dashboard
8. Login as admin again
9. Enable permissions → Save
10. User now has access

---

## Future Enhancements

Potential improvements for production:

1. **Audit Log**
   - Track all permission changes
   - Who changed what and when

2. **Bulk User Management**
   - Import users via CSV
   - Bulk role assignment
   - Bulk permission updates

3. **Advanced Permissions**
   - Custom permission sets
   - Time-based access
   - IP-based restrictions

4. **User Invitations**
   - Send invite emails
   - Pre-assign roles
   - Onboarding workflow

5. **Business Info History**
   - Track changes over time
   - Revert to previous values
   - Change notifications

---

## Troubleshooting

### Users page shows "No users found"
- Check `localStorage.users` in DevTools
- Run reset-storage.html to reinitialize
- Ensure admin user exists

### Cannot edit business info
- Verify logged in as admin
- Check console for errors
- Clear localStorage and reinitialize

### Permissions not saving
- Check browser console for errors
- Verify user has permissions object
- Ensure admin role

### Navigation links missing
- Check user role in DevTools
- Permissions page only shows for admin
- Users page shows for admin + manager

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
