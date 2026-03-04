# Mentor Slot Management - Quick Start Testing Guide

## Prerequisites

1. Server running: `node Server.js` (port 3500)
2. Frontend running: `npm start` (port 3000)
3. MongoDB connected
4. Two test accounts: one mentor, one learner

## Quick Test (5 Minutes)

### Step 1: Login as Mentor
1. Go to `http://localhost:3000`
2. Click "Mentor Login" or navigate to `/mentor/login`
3. Login with mentor credentials
4. You should see the Mentor Dashboard

### Step 2: Create Time Slots
1. Look for "🕐 Manage Time Slots" button in the Mentor Tools section
2. Click it (or navigate to `/mentor/slots`)
3. Fill the form:
   - **Date**: Pick today or tomorrow (e.g., March 10, 2026)
   - **Start Time**: 18:00 (6:00 PM)
   - **End Time**: 20:00 (8:00 PM)
4. Click "✨ Create Slots"
5. You should see:
   - Success message: "✅ Created 2 time slots"
   - Two slots appear below:
     - `3/10/2026 06:00 PM` (available)
     - `3/10/2026 07:00 PM` (available)

### Step 3: Verify Slots in Database
Open MongoDB Compass or shell and check:
```javascript
db.mentorslots.find({
  mentorId: ObjectId("YOUR_MENTOR_ID"),
  status: "available"
}).pretty()
```

You should see 2 documents with startTime and endTime.

### Step 4: Login as Learner
1. Open **New Incognito/Private** browser window
2. Go to `http://localhost:3000`
3. Click "Learner Login" or navigate to `/learner/login`
4. Login with learner credentials

### Step 5: Book a Session
1. Navigate to `/sessions` (or click "Book a Mentorship" in dashboard)
2. Click "Find a Mentor"
3. Look for the mentor you created slots for
4. Click "Apply for Mentorship" on their card
5. A modal opens - you should see:
   - Input for "Topic" (required)
   - Input for "Message" (optional)
   - **"Available Time Slots"** section showing:
     ```
     Available Time Slots
     ( ) 3/10/2026 – 06:00 PM
     ( ) 3/10/2026 – 07:00 PM
     ```

### Step 6: Complete Booking
1. Select the first slot (radio button)
2. Enter Topic: "Test Mentorship"
3. Enter Message: "Testing the slot system" (optional)
4. Click "Send Mentorship Request"
5. You should see: "✅ Mentorship request sent!"
6. Auto-switches to "My Mentorships" tab
7. Shows request with ⏳ PENDING status

### Step 7: Verify Slot Status Changed
In MongoDB:
```javascript
db.mentorslots.findOne({
  status: "pending"
})
```

The slot should now have:
- status: "pending"
- mentorshipRequestId: (populated)

### Step 8: Mentor Accepts Request
1. Switch back to **Mentor** browser window
2. Look for mentorship requests (dashboard or dedicated page)
3. Find the request from the learner
4. Click "Accept" button
5. Slot status changes to ✅ CONFIRMED

### Step 9: Verify in Learner View
1. Switch to **Learner** browser window
2. Refresh the page
3. Check "My Mentorships" tab
4. Should see: ✅ CONFIRMED status
5. Video room link should appear

## Expected Results ✅

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as mentor | See mentor dashboard |
| 2 | Create slots | 2 slots created successfully |
| 3 | Check DB | Slots in mentorslots collection |
| 4 | Login as learner | See learner dashboard |
| 5 | Book session | See available time slots in modal |
| 6 | Complete booking | Request sent confirmation |
| 7 | Check DB | Slot status = "pending" |
| 8 | Mentor accepts | Slot status = "booked" |
| 9 | Learner checks | See confirmed status |

## Testing Different Scenarios

### Scenario A: Create Multiple Slots in One Day
```
Date: March 10
Start: 09:00
End: 12:00
Result: 3 slots (9-10, 10-11, 11-12)
```

### Scenario B: Create Slots for Different Day
```
Date: March 11
Start: 14:00
End: 18:00
Result: 4 slots (2-3 PM, 3-4 PM, 4-5 PM, 5-6 PM)
```

### Scenario C: Error - End Time Before Start Time
```
Date: March 12
Start: 18:00
End: 17:00
Result: Error message shown
```

### Scenario D: View Slots Without Booking
```
1. Create slots as mentor
2. Login as different learner
3. View same mentor's slots
4. Should see same time slots
```

## Troubleshooting

### Issue: No slots appear in learner's booking modal

**Solution:**
1. Check browser console (F12 → Console)
2. Look for API errors
3. Verify mentor ID matches
4. Check MongoDB for slots:
   ```javascript
   db.mentorslots.find({status: "available"}).count()
   ```
5. Check API endpoint is working:
   ```
   GET http://localhost:3500/slots/mentor/{MENTOR_ID}/available
   ```

### Issue: Button "Manage Time Slots" not visible

**Solution:**
1. Make sure you're logged in as mentor
2. Check if you're on the right page (`/mentor/slots` or mentor home)
3. Clear browser cache and refresh

### Issue: Error creating slots

**Solution:**
1. Check all fields are filled
2. Verify end time is after start time
3. Check MongoDB is connected
4. Check server logs for errors

### Issue: Slots show but can't select them

**Solution:**
1. Refresh the page
2. Check browser console for JavaScript errors
3. Verify you have proper authorization token

## API Testing with Curl

### Test Creating Slots
```bash
curl -X POST http://localhost:3500/slots/mentor/{MENTOR_ID}/create \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-10",
    "startTime": "18:00",
    "endTime": "20:00"
  }'
```

### Test Getting Available Slots
```bash
curl http://localhost:3500/slots/mentor/{MENTOR_ID}/available
```

### Test Booking a Slot
```bash
curl -X POST http://localhost:3500/slots/book \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "{SLOT_ID}",
    "learnerId": "{LEARNER_ID}"
  }'
```

## File Locations for Reference

| File | Purpose |
|------|---------|
| `Server/Controller/SlotController.js` | Backend logic |
| `Server/Router/SlotRoutes.js` | API routes |
| `Client/src/pages/mentor/MentorSlotManagement.js` | Mentor UI |
| `Client/src/pages/learner/BookSession.js` | Learner booking |
| `Server/Model/MentorSlotModel.js` | Database schema |

## Notes

- Server: http://localhost:3500
- Frontend: http://localhost:3000
- All times in 24-hour format (HH:MM)
- Dates in YYYY-MM-DD format
- Slots are automatically 60 minutes each
- Booked slots won't appear in learner view

## Success Indicators 🎉

✅ Mentor can create slots → Slots appear in dashboard
✅ Learner can see slots → Time slots show in booking modal
✅ Learner can select slot → Selection works (radio button)
✅ Booking sends request → Request appears in mentor dashboard
✅ Mentor can accept → Slot status changes to booked
✅ Learner sees confirmation → Status shows as confirmed

## Time Estimate

Total testing time: ~10 minutes
- Login/Navigation: 2 min
- Create slots: 2 min
- View slots: 1 min
- Send booking: 1 min
- Accept booking: 1 min
- Verification: 3 min

## Next: Advanced Testing

After basic testing works:
1. Test with multiple mentors
2. Test with multiple learners
3. Test delete slot functionality
4. Test error scenarios
5. Test database performance with many slots

---

**Ready to test?** Start with Step 1 above!
