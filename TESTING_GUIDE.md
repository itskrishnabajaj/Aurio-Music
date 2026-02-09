# Testing Guide: Authentication Approval Flow

## Overview
This guide helps you test the critical authentication bug fix that now properly enforces admin approval for new users.

## Prerequisites
- Firebase Realtime Database configured
- Admin password set in Firebase environment
- Netlify deployment (or local server)

## Test Scenarios

### Scenario 1: New User Registration (Pending Approval)

#### Steps:
1. Navigate to the app home page
2. Click "Create Account" button
3. Enter test credentials:
   - Username: `testuser1`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
4. Click "Create Account"

#### Expected Behavior:
✅ User account created in Firebase with `status: 'pending'`
✅ User sees "Awaiting Approval" screen with message:
   - "Your account is awaiting admin approval"
   - Logout button displayed
✅ User cannot access the main app

#### Firebase Check:
```
/users/{uid}
  - username: "testuser1"
  - email: "testuser1@aurio.app"
  - status: "pending"
  - createdAt: [timestamp]
```

### Scenario 2: Login with Pending Account

#### Steps:
1. Logout if logged in
2. Click "Sign In"
3. Enter credentials:
   - Username: `testuser1`
   - Password: `Test123!`
4. Click "Sign In"

#### Expected Behavior:
✅ Authentication succeeds
✅ User sees "Awaiting Approval" screen (not main app)
✅ Logout button works

### Scenario 3: Admin Approves User

#### Steps:
1. Navigate to `/admin` or `/admin.html`
2. Enter admin password
3. Click "Users" tab
4. Find `testuser1` in the list
5. Verify status shows "Pending"
6. Click "Approve" button

#### Expected Behavior:
✅ Status updates to "Approved" immediately
✅ Approve button disappears
✅ Reject button appears
✅ No errors in console

#### Firebase Check:
```
/users/{uid}
  - status: "approved"
  - approved: true  (backwards compatibility)
```

### Scenario 4: Approved User Can Login

#### Steps:
1. Logout from pending user session
2. Click "Sign In"
3. Enter credentials:
   - Username: `testuser1`
   - Password: `Test123!`
4. Click "Sign In"

#### Expected Behavior:
✅ User successfully logs in
✅ Main app screen displays (not pending screen)
✅ Home tab shows with content
✅ Bottom navigation visible

### Scenario 5: Admin Rejects User

#### Steps:
1. Create another test account `testuser2`
2. Login to admin panel
3. Click "Users" tab
4. Find `testuser2` with "Pending" status
5. Click "Approve" (to test rejection after approval)
6. Click "Reject" button
7. Confirm the rejection

#### Expected Behavior:
✅ Confirmation dialog appears
✅ Status updates to "Rejected"
✅ Reject button disappears
✅ Approve button appears

#### Firebase Check:
```
/users/{uid}
  - status: "rejected"
  - approved: false
```

### Scenario 6: Rejected User Login Attempt

#### Steps:
1. Logout current session
2. Click "Sign In"
3. Enter rejected user credentials:
   - Username: `testuser2`
   - Password: `Test123!`
4. Click "Sign In"

#### Expected Behavior:
✅ Authentication succeeds
✅ User sees "Account Not Approved" screen with ❌ icon
✅ Message: "Sorry, your account request was not approved. Please contact the administrator for more information."
✅ Logout button displayed and functional
✅ User cannot access main app

### Scenario 7: Backwards Compatibility Test

#### Steps:
1. Manually create a user in Firebase with old schema:
```json
{
  "users": {
    "oldUserUID": {
      "username": "olduser",
      "email": "olduser@aurio.app",
      "approved": true,
      "createdAt": 1234567890
    }
  }
}
```
2. Try to login with `olduser` / `OldPass123!`

#### Expected Behavior:
✅ Login succeeds
✅ User can access main app
✅ System treats `approved: true` as `status: 'approved'`

## Edge Cases to Test

### Edge Case 1: User Data Doesn't Exist
**Scenario**: User authenticated but no database record
**Expected**: User record created with `status: 'pending'`, shows pending screen

### Edge Case 2: Database Error
**Scenario**: Firebase read fails during approval check
**Expected**: User shown auth screen, error logged to console

### Edge Case 3: Multiple Rapid Login Attempts
**Scenario**: User logs in multiple times while pending
**Expected**: Always shows pending screen, no race conditions

### Edge Case 4: Approval While User is Online
**Scenario**: User is on pending screen when admin approves
**Expected**: User must logout and login again to see approval (real-time sync is optional enhancement)

## Admin Panel Testing Checklist

### Users Tab Display
- [ ] Pending users show "Pending" badge (yellow/warning color)
- [ ] Approved users show "Approved" badge (green/success color)
- [ ] Rejected users show "Rejected" badge (red/danger color)
- [ ] Pending users have "Approve" button
- [ ] Approved users have "Reject" button
- [ ] Rejected users have "Approve" button

### Analytics Tab
- [ ] "Active Users" count only includes approved users
- [ ] Pending/rejected users not counted as active

## Browser Console Checks

### No Errors Should Appear
- ✅ No authentication errors
- ✅ No Firebase permission errors
- ✅ No null reference errors

### Expected Console Logs
```
✅ Aurio initialized
✅ User: testuser1@aurio.app
✅ User approval status checked
```

## Mobile Testing

Since this is a mobile-first PWA, test on:
- [ ] Chrome on Android
- [ ] Safari on iOS
- [ ] Mobile viewport in desktop browser

## Performance Checks

- [ ] Approval status check completes in < 500ms
- [ ] No visible lag when showing pending/rejected screens
- [ ] Logout from pending/rejected screens is instant

## Security Verification

### What Should NOT Be Possible:
- ❌ Bypass approval by manipulating client-side code
- ❌ Access app routes without approval
- ❌ Modify own approval status from client
- ❌ View other users' approval status (except admin)

### What Should Work:
- ✅ Admin can view all users' statuses
- ✅ Admin can approve/reject any user
- ✅ Status persists across sessions
- ✅ Backwards compatibility maintained

## Rollback Plan

If issues are found:

1. **Emergency Rollback**: Revert to previous commit
```bash
git revert HEAD
git push origin copilot/implement-mobile-ui-features
```

2. **Quick Fix for Existing Users**: Run Firebase migration script to set `status: 'approved'` for all users with `approved: true`

3. **Disable Approval Temporarily**: Set all new users to `status: 'approved'` until fix is deployed

## Success Criteria

✅ All 7 test scenarios pass
✅ All edge cases handled gracefully  
✅ Admin panel shows correct statuses
✅ No console errors
✅ Mobile experience is smooth
✅ Security checks pass
✅ Backwards compatibility verified

## Next Steps After Testing

1. Populate Firebase with test songs including mood/genre/tempo data
2. Test home tab sections with real data
3. Verify play tracking works
4. Test recently played section
5. Verify AI recommendations generate

## Support

For issues or questions:
- Check `IMPLEMENTATION_STATUS.md` for known issues
- Review browser console for error details
- Verify Firebase security rules allow user reads/writes
- Ensure Firebase is properly configured with auth and database
