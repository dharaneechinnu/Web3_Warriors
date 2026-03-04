# Mentorship Slot Generation - Testing & Verification Guide

## System Overview

The slot-based mentorship booking system works in 5 steps:

1. **Mentor Sets Availability** → `/availability/{mentorId}/availability` (POST)
2. **Slots Auto-Generate** → `/availability/{mentorId}/generate-slots` (POST)
3. **Learner Fetches Slots** → `/availability/{mentorId}/available-slots` (GET)
4. **Learner Sends Request** → `/mentorship-requests/{learnerId}/send-request` (POST)
5. **Mentor Accepts/Rejects** → Slots status changes from pending → booked

---

## Prerequisites Before Testing

### Server Status
```bash
# Verify Server is running on port 3500
curl http://localhost:3500/api/health
# Expected: Should return 200 OK
```

### Database Connection
- MongoDB should be running (Check MongoDB Compass)
- Collections needed: `MentorSlot`, `MentorAvailability`, `MentorshipRequest`, `users`

### Authentication
- Both user and mentor accounts should be created
- Get the tokens for both from localStorage after signin

---

## Step 1: Mentor Sets Availability

**UI Location**: `/mentor/availability`

**How It Works Now**:
1. Mentor clicks on a day (e.g., "Monday")
2. Fills in:
   - **Start Time**: e.g., 09:00
   - **End Time**: e.g., 17:00
   - **Session Duration**: 60 minutes
3. Clicks "Save Availability"

**What Should Happen**:
- ✅ Message: "⏳ Generating time slots for next 30 days..."
- ✅ Then: "✅ Availability saved! Time slots generated for learners to book."
- ✅ Availabilities list updates with the new entry

**API Call**:
```javascript
// Step 1: Save availability
POST /availability/{mentorId}/availability
{
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "sessionDuration": 60
}

// Step 2: Generate slots (automatic in UI)
POST /availability/{mentorId}/generate-slots
{
  "daysAhead": 30
}
```

---

## Step 2: Verify Slots Were Generated

### Frontend - Learner Side
**UI Location**: `/learner/book-session`

1. Go to "Find a Mentor" tab
2. Click on any mentor
3. Modal opens
4. Check "Available Time Slots" section

**What Should Appear**:
- ✅ List of slots like: "📅 Mon, Jan 9, 09:00 – 10:00"
- ✅ List of slots like: "📅 Mon, Jan 9, 10:00 – 11:00"
- ✅ For each Monday in the next 30 days

**If NO Slots Appear**:
The message shows: "⚠️ No available slots at the moment. Try checking back later."

---

## Step 3: Debug - Check Database

If slots don't appear, check MongoDB directly:

### Using MongoDB Compass:
1. Open MongoDB Compass
2. Navigate to: `Database → MentorSlot → Find`
3. Filter by mentor:
   ```json
   { "mentorId": "{YOUR_MENTOR_ID}", "status": "available" }
   ```
4. Should see documents like:
   ```json
   {
     "mentorId": "...",
     "availabilityId": "...",
     "startTime": "2024-01-09T09:00:00Z",
     "endTime": "2024-01-09T10:00:00Z",
     "status": "available",
     "createdAt": "2024-01-05T10:30:00Z"
   }
   ```

### Using Terminal Commands:

```bash
# SSH into your server or use mongo shell
mongo
use mentorshipdb
db.mentorslots.find({ mentorId: ObjectId("YOUR_MENTOR_ID"), status: "available" }).count()
# Should return > 0
```

---

## Step 4: API Testing - Postman/cURL

### Test Availability Creation:
```bash
curl -X POST http://localhost:3500/availability/{mentorId}/availability \
  -H "Authorization: Bearer {YOUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": "monday",
    "startTime": "09:00",
    "endTime": "17:00",
    "sessionDuration": 60
  }'
```

### Test Slot Generation:
```bash
curl -X POST http://localhost:3500/availability/{mentorId}/generate-slots \
  -H "Authorization: Bearer {YOUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "daysAhead": 30 }'
```

### Test Fetch Available Slots:
```bash
curl -X GET http://localhost:3500/availability/{mentorId}/available-slots \
  -H "Authorization: Bearer {YOUR_TOKEN}"
```

Expected Response:
```json
{
  "success": true,
  "slots": [
    {
      "_id": "...",
      "mentorId": "...",
      "startTime": "2024-01-09T09:00:00Z",
      "endTime": "2024-01-09T10:00:00Z",
      "status": "available"
    },
    ...
  ]
}
```

---

## Step 5: Complete Flow Test

### Scenario: Mentor → Slots → Learner → Request → Accept

**1. Mentor Setup** (as Mentor User):
- Go to `/mentor/availability`
- Set availability for Monday, 9am-5pm, 60-min sessions
- See confirmation message about slots generated
- See slots in database

**2. Learner Browse** (as Learner User):
- Go to `/learner/book-session`
- Click on the mentor you just configured
- Modal opens
- Verify slots appear (e.g., 5-9 slots for Monday)

**3. Learner Book** (as Learner User):
- Select one time slot
- Fill Topic: "JavaScript Fundamentals"
- Fill Message: "Need help with closures"
- Click "Send Mentorship Request"
- See success message

**4. Backend Verification**:
In MongoDB:
- Check `MentorshipRequest` collection: Should have 1 new request
- Check `MentorSlot` collection: That slot's status should be "pending"
- Check Mentor inbox at `/mentor/mentorships`: Should see pending request

**5. Mentor Accept** (as Mentor User):
- Go to `/mentor/mentorships` → "Pending Requests"
- Click "Accept"
- See confirmation

**6. Final Check**:
- Mentor sees "Confirmed" status
- Learner sees "Confirmed" status at `/learner/book-session` → "My Mentorships"
- Video room link appears with "Join Video Call" button

---

## Common Issues & Solutions

### Issue 1: "No available slots at the moment" appears

**Cause**: Slots not generating or not being fetched

**Debug Steps**:
1. Check browser console (F12 → Console tab) for API errors
2. Look for: "fetch slots error:" message
3. Check MongoDB for slots
4. Verify mentorId is correct

**Solution**:
```javascript
// In browser console, test API call directly:
const mentorId = "..."; // Get from /mentor/availability page
fetch('/availability/' + mentorId + '/available-slots')
  .then(r => r.json())
  .then(data => console.log(data));
```

### Issue 2: Mentor sees success message but slots don't appear

**Cause**: Slot generation completed silently but didn't parse properly

**Debug Steps**:
1. Check Server logs for errors during generateSlots
2. Check MongoDB for slots with correct status='available'
3. Verify time zones (slots might be in different timezone)

**Solution**:
```bash
# Manually trigger slot generation from backend
curl -X POST http://localhost:3500/availability/{mentorId}/generate-slots \
  -H "Authorization: Bearer {MENTOR_TOKEN}" \
  -d '{"daysAhead": 30}'
```

### Issue 3: Email notifications not sending

**Cause**: Email service not configured

**Note**: System still works without emails, confirmations happen in-app

**Check**: Server logs for email errors

### Issue 4: Socket.IO notifications not working

**Cause**: Socket connection issues

**Not Critical**: System still works, just without real-time notifications

**Check**: Browser console for Socket.IO connection messages

---

## File Structure Reference

Key files for debugging:

```
Frontend:
- Client/src/pages/mentor/MentorAvailability.js       (Mentor sets availability)
- Client/src/pages/learner/BookSession.js              (Learner views/books slots)
- Client/src/pages/mentor/MentorMentorshipRequests.js  (Mentor accepts/rejects)

Backend:
- Server/Controller/AvailabilityController.js          (Slot generation logic)
- Server/Controller/MentorshipController.js            (Request handling)
- Server/Router/AvailabilityRoutes.js                  (API endpoints)
- Server/Router/MentorshipRequestRoutes.js             (Request endpoints)
- Server/Model/MentorSlotModel.js                      (Slot schema)
- Server/Model/MentorAvailabilityModel.js              (Availability schema)
- Server/Model/MentorshipRequestModel.js               (Request schema)
```

---

## Full Request/Response Examples

### Mentor Saves Availability
```
POST /availability/60d5ec49c1234567890abcde/availability
Authorization: Bearer eyJhbGc...

Request Body:
{
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "sessionDuration": 60
}

Response:
{
  "success": true,
  "message": "Availability set for Monday",
  "availability": {
    "_id": "60d5ec49c4567890abcdef123",
    "mentorId": "60d5ec49c1234567890abcde",
    "dayOfWeek": "monday",
    "startTime": "09:00",
    "endTime": "17:00",
    "sessionDuration": 60
  }
}
```

### Mentor Triggers Slot Generation
```
POST /availability/60d5ec49c1234567890abcde/generate-slots
Authorization: Bearer eyJhbGc...

Request Body:
{
  "daysAhead": 30
}

Response:
{
  "success": true,
  "message": "Generated 5 slots",
  "slotsGenerated": 5,
  "generatedSlots": [
    {
      "mentorId": "60d5ec49c1234567890abcde",
      "availabilityId": "60d5ec49c4567890abcdef123",
      "startTime": "2024-01-08T09:00:00Z",
      "endTime": "2024-01-08T10:00:00Z",
      "status": "available"
    },
    ...
  ]
}
```

### Learner Fetches Slots
```
GET /availability/60d5ec49c1234567890abcde/available-slots
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "slots": [
    {
      "_id": "60d5ec49c5678901234ab901",
      "mentorId": "60d5ec49c1234567890abcde",
      "availabilityId": "60d5ec49c4567890abcdef123",
      "startTime": "2024-01-08T09:00:00Z",
      "endTime": "2024-01-08T10:00:00Z",
      "status": "available"
    },
    ...
  ]
}
```

### Learner Sends Mentorship Request
```
POST /mentorship-requests/60d5ec49c1111111111abcde/send-request
Authorization: Bearer eyJhbGc...

Request Body:
{
  "slotId": "60d5ec49c5678901234ab901",
  "topic": "JavaScript Closures",
  "message": "I'm struggling with closure concepts"
}

Response:
{
  "success": true,
  "message": "Mentorship request sent successfully",
  "request": {
    "_id": "60d5ec49c9999999999abcde",
    "mentorId": "60d5ec49c1234567890abcde",
    "learnerId": "60d5ec49c1111111111abcde",
    "slotId": "60d5ec49c5678901234ab901",
    "topic": "JavaScript Closures",
    "message": "I'm struggling with closure concepts",
    "status": "pending"
  }
}
```

---

## Performance Expectations

- **Slot Generation**: Should complete in <2 seconds for 30 days
- **Fetching Slots**: Should return within 500ms
- **Sending Request**: Should complete in <1 second
- **Available Slots Display**: Should render 30-60 slots without lag

---

## Next Steps After Successful Testing

1. ✅ Verify end-to-end flow works
2. ✅ Deploy to production
3. ✅ Set up email notifications (if desired)
4. ✅ Configure Socket.IO for real-time notifications
5. ✅ Add mentor availability calendar view
6. ✅ Add learner booking history

---

**Last Updated**: [Current Date]
**System Status**: ✅ Ready for Testing
