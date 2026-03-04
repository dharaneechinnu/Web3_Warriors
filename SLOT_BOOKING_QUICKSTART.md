# Quick Start: Testing Mentorship Slot Booking

## Prerequisites - MUST DO FIRST

### 1. Start MongoDB
```bash
# Windows
mongod

# OR if using MongoDB Atlas, ensure connection string is in Server config
```

### 2. Start Backend Server
```bash
cd Server
npm install  # if needed
node Server.js
```

**Expected Output**:
```
✅ Server running on port 3500
✅ Database connected
```

### 3. Start Frontend (in new terminal)
```bash
cd Client
npm start
# Opens http://localhost:3000
```

---

## 3-Minute Test Scenario

### Step 1: Create Test Accounts (if not exists)

**As Mentor**:
1. Go to http://localhost:3000
2. Sign up/Login as a mentor account
3. Note down your **Mentor ID** from browser console:
   ```javascript
   localStorage.getItem('userId')
   ```

**As Learner** (in different browser tab/window):
1. Go to http://localhost:3000 in Private/Incognito window
2. Sign up/Login as a learner account
3. Note down your **Learner ID**

### Step 2: Mentor Creates Availability (2 mins)

**Mentor Flow**:
1. Go to `/mentor/availability` page
2. Click on "Monday" or any day
3. Fill in:
   - **Start**: 09:00
   - **End**: 17:00 (5 PM)
   - **Duration**: 60 minutes
4. Click "💾 Save Availability"
5. **Wait for message**: "✅ Availability saved! Time slots generated..."

✅ **Step 2 Complete**: If you see the success message, slots have been generated!

### Step 3: Verify Slots (1 min)

**Check 1 - Frontend**:
1. Switch to Learner account (other browser tab)
2. Go to `/learner/book-session`
3. Click "Find a Mentor" tab
4. Find your mentor in the list
5. Click "Apply for Mentorship"
6. **Expected**: See 5-9 time slots like:
   - 📅 Mon, Jan 8, 09:00 – 10:00
   - 📅 Mon, Jan 8, 10:00 – 11:00
   - etc.

✅ **If slots appear**: Your system is working!

**Check 2 - Database** (if slots don't appear):
```bash
# Terminal command
mongosh
# Inside mongosh:
> db.mentorslots.countDocuments({mentorId: ObjectId("YOUR_MENTOR_ID")})
# Should show > 0
```

### Step 4: Complete a Full Request (1 min)

**Learner**:
1. In the slots modal, select any time
2. Fill "Topic": "Test Booking"
3. Fill "Message": "Testing the system"
4. Click "Send Mentorship Request"
5. See confirmation

**Mentor**:
1. Go to `/mentor/mentorships`
2. Click "Pending Requests" tab
3. Should see the learner's request
4. Click "✅ Accept"
5. See status change to "Confirmed"

**Learner**:
1. Go to `/learner/book-session`
2. Click "My Mentorships" tab
3. Should see "Confirmed" status with the mentor
4. Click "Join Video Call" if it's time

---

## Quick Debugging Checklist

**❌ Slots don't appear for learner?**

Check these in order:

1. **Browser Console** (F12 → Console):
   - Look for red errors
   - Check for: `fetch slots error: ...`
   - If you see an error, screenshot it

2. **Network Tab** (F12 → Network):
   - Click mentor again
   - Look for request: `available-slots`
   - Check "Response" tab:
     - Should show `"success": true`
     - Should have `"slots": [...]` array

3. **Database Check**:
   ```bash
   mongosh
   > use mentorshipdb
   > db.mentoravailability.find()
   # Should show your availability
   
   > db.mentorslots.find({status: "available"}).count()
   # Should show > 0
   ```

4. **API Direct Test**:
   ```bash
   # In new terminal, replace MENTOR_ID with actual ID
   curl http://localhost:3500/availability/MENTOR_ID/available-slots
   ```

---

## What's Working (What You Built)

✅ Mentor can set weekly availability  
✅ Backend auto-generates 30 days of slots  
✅ Learner can see available time slots  
✅ Learner can send booking request  
✅ Mentor can accept/reject requests  
✅ Slots update status (available → pending → booked)  
✅ Email notifications on request/accept  
✅ Video room integration  

---

## Super Quick Setup (Copy-Paste)

```bash
# Terminal 1: Backend
cd Server && node Server.js

# Terminal 2: Frontend  
cd Client && npm start

# Then go to http://localhost:3000 and test!
```

---

## Files Modified for Slot System

```
Frontend Changes:
✅ Client/src/pages/mentor/MentorAvailability.js       - Explicitly calls generateSlots
✅ Client/src/pages/learner/BookSession.js             - Shows available slots

Backend Changes:
✅ Server/Controller/AvailabilityController.js         - Generates slots
✅ Server/Controller/MentorshipController.js           - Handles requests
✅ Server/Router/AvailabilityRoutes.js                 - Availability endpoints
✅ Server/Router/MentorshipRequestRoutes.js            - Request endpoints
✅ Server/Model/MentorSlotModel.js                     - Slot schema
✅ Server/Model/MentorAvailabilityModel.js             - Availability schema
```

---

## Expected Slot Count

**Setup**: Monday, 9am-5pm, 60-min sessions  
**Expected slots per Monday**: 8 slots (9-10, 10-11, 11-12, 1-2, 2-3, 3-4, 4-5, 5-6)  
**Expected total for 30 days**: ~32-40 slots total (4-5 Mondays)  

---

## Still Having Issues?

Check [SLOT_GENERATION_TESTING_GUIDE.md](./SLOT_GENERATION_TESTING_GUIDE.md) for detailed debugging.

**Most Common Issues**:
1. MongoDB not running → Start MongoDB first
2. Server error during start → Check `node Server.js` output
3. Slots generate but don't display → Check browser console F12
4. Slots not generating → Check Server logs during availability save

---

**Ready to Test?** Start with Prerequisites and follow the 3-Minute Test!
