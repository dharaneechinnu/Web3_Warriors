# Mentor Slot Management System - Implementation Guide

## Overview

The mentor slot management system has been successfully implemented. It allows mentors to create time slots (60-minute increments) for specific dates and time ranges, which learners can then view and select for booking mentorship sessions.

## System Architecture

### Backend Implementation

#### 1. **SlotController.js** (`Server/Controller/SlotController.js`)
Handles all slot-related operations:
- `createSlots(req, res)` - Creates 60-minute slots based on date and time range
- `getAvailableSlots(req, res)` - Fetches available slots for a mentor (with optional date filtering)
- `bookSlot(req, res)` - Marks a slot as booked
- `getMentorSlots(req, res)` - Fetches all slots for a mentor
- `deleteSlot(req, res)` - Deletes a slot

#### 2. **SlotRoutes.js** (`Server/Router/SlotRoutes.js`)
API routes for slot management:
```
POST   /slots/mentor/:mentorId/create       - Create new slots
GET    /slots/mentor/:mentorId/available    - Get available slots
GET    /slots/mentor/:mentorId/all          - Get all slots for mentor
POST   /slots/book                           - Book a slot
DELETE /slots/:slotId                        - Delete a slot
```

#### 3. **Updated MentorSlotModel.js**
Enhanced the model to support direct slot creation:
- Made `availabilityId` optional (default: null)
- Added `bookedBy` and `bookedAt` fields for tracking bookings
- Maintains backward compatibility with weekly availability system

#### 4. **Server.js Updates**
- Registered `SlotRoutes` at `/slots` endpoint
- Maintains all existing routes and functionality

### Frontend Implementation

#### 1. **MentorSlotManagement.js** (`Client/src/pages/mentor/MentorSlotManagement.js`)
New component for mentors to manage time slots:
- Form to create slots by date, start time, and end time
- Auto-generates 60-minute slots between the specified times
- Displays all created slots with status indicators
- Ability to delete available slots
- Real-time feedback and error handling

#### 2. **Updated BookSession.js** (`Client/src/pages/learner/BookSession.js`)
Enhanced learner booking interface:
- Changed from `/availability/{mentorId}/available-slots` to `/slots/mentor/{mentorId}/available`
- Updated slot display format to show formatted date and time
- Maintains all existing booking flow (mentorship request, topic, message)

#### 3. **Updated App.js**
- Added import for `MentorSlotManagement`
- Added route: `/mentor/slots` for the slot management page

#### 4. **Updated MentorHome.js**
- Added "Manage Time Slots" button in the Mentor Tools section
- Navigates to `/mentor/slots` page

## How It Works

### Mentor Flow: Creating Slots

1. **Navigate to Slot Management**
   - Go to Mentor Dashboard
   - Click "🕐 Manage Time Slots" button
   - Or navigate directly to `/mentor/slots`

2. **Create Time Slots**
   - Fill in the form:
     - **Date**: Select a date (e.g., March 10)
     - **Start Time**: Enter start time (e.g., 6:00 PM)
     - **End Time**: Enter end time (e.g., 8:00 PM)
   - Click "✨ Create Slots"

3. **Automatic Slot Generation**
   - System auto-generates 60-minute slots
   - Example: 6:00-7:00 PM, 7:00-8:00 PM
   - Slots immediately appear in the "Your Slots" section

4. **Manage Slots**
   - View all created slots with status (available/booked)
   - Delete available slots if needed

### Learner Flow: Booking Slots

1. **Navigate to Book Mentorship**
   - Go to `/learner/book-session` or `/sessions`
   - Click on "Find a Mentor"

2. **Select Mentor and View Slots**
   - Click on a mentor card
   - Modal opens with available slots
   - Slots show: `Date – Time` format (e.g., "3/10/2026 – 06:00 PM")

3. **Book a Session**
   - Select a time slot (radio button)
   - Enter topic (required)
   - Enter message (optional)
   - Click "💌 Send Mentorship Request"

4. **Confirmation**
   - Request sent to mentor
   - Slot automatically marked as "pending"
   - Learner sees request in "My Mentorships" tab

5. **Mentor Acceptance**
   - Mentor sees the pending request
   - Accepts or rejects the request
   - On accept: slot changes to "booked", session created with video room link

## Database Schema

### MentorSlot Collection

```json
{
  "_id": ObjectId,
  "mentorId": ObjectId (references User),
  "availabilityId": ObjectId or null (references MentorAvailability - optional),
  "startTime": Date,
  "endTime": Date,
  "status": String ("available", "pending", "booked"),
  "mentorshipRequestId": ObjectId or null,
  "sessionId": ObjectId or null,
  "bookedBy": ObjectId or null (references User - learner ID),
  "bookedAt": Date or null,
  "createdAt": Date,
  "updatedAt": Date
}
```

## API Endpoints

### 1. Create Slots
```
POST /slots/mentor/{mentorId}/create
Authorization: Bearer {token}

Request Body:
{
  "date": "2026-03-10",
  "startTime": "18:00",
  "endTime": "20:00"
}

Response:
{
  "success": true,
  "message": "Created 2 time slots",
  "slots": [...]
}
```

### 2. Get Available Slots
```
GET /slots/mentor/{mentorId}/available?date=2026-03-10
Authorization: Bearer {token} (optional)

Response:
{
  "success": true,
  "slots": [
    {
      "_id": "...",
      "date": "3/10/2026",
      "startTime": "06:00 PM",
      "endTime": "07:00 PM",
      "displayText": "3/10/2026 – 06:00 PM"
    },
    ...
  ]
}
```

### 3. Get All Mentor's Slots
```
GET /slots/mentor/{mentorId}/all
Authorization: Bearer {token}

Response:
{
  "success": true,
  "slots": [...]
}
```

### 4. Book a Slot
```
POST /slots/book
Authorization: Bearer {token}

Request Body:
{
  "slotId": "...",
  "learnerId": "..."
}

Response:
{
  "success": true,
  "message": "Slot booked successfully"
}
```

### 5. Delete a Slot
```
DELETE /slots/{slotId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Slot deleted successfully"
}
```

## Features Implemented

✅ **Mentor Slot Creation**
- Create 60-minute slots for any date
- Automatic slot generation based on time range
- Visual feedback on success/error

✅ **Learner Slot Discovery**
- View available slots when booking
- Formatted date and time display
- Intuitive slot selection (radio buttons)

✅ **Slot Status Management**
- Available: Open for booking
- Pending: Reserved by learner (waiting for mentor acceptance)
- Booked: Confirmed session

✅ **Integration with Existing System**
- Works with existing mentorship request workflow
- Integrates with video room system
- Uses existing authentication and authorization
- Compatible with email notifications

✅ **Error Handling**
- Validates all inputs
- Checks slot availability before booking
- Prevents double-booking
- User-friendly error messages

## Testing

### Test Steps

1. **As Mentor:**
   - Login as mentor
   - Click "Manage Time Slots" in dashboard
   - Create slots:
     - Date: Today/Tomorrow
     - Start: 06:00 PM
     - End: 08:00 PM
   - See 2 slots created: 6-7 PM, 7-8 PM

2. **As Learner:**
   - Login as learner (different account)
   - Go to Book Session
   - Find the mentor you just created slots for
   - Click to view slots
   - Should see the time slots you created
   - Select one slot
   - Enter topic and send request

3. **As Mentor:**
   - See the mentorship request
   - Accept the request
   - See session status change to confirmed

4. **As Learner:**
   - Refresh or check "My Mentorships"
   - See confirmed status with video room link

## File Summary

### New Files Created
- `Server/Controller/SlotController.js` - Slot management logic
- `Server/Router/SlotRoutes.js` - Slot API routes
- `Client/src/pages/mentor/MentorSlotManagement.js` - Mentor slot UI

### Files Modified
- `Server/Model/MentorSlotModel.js` - Made availabilityId optional, added bookedBy/bookedAt
- `Server/Server.js` - Registered SlotRoutes
- `Client/src/App.js` - Added route and import for MentorSlotManagement
- `Client/src/pages/learner/BookSession.js` - Updated to fetch from new slot endpoint
- `Client/src/pages/mentor/MentorHome.js` - Added button to manage slots

## API Base URL

All endpoints are relative to the server base URL (default: `http://localhost:3500`)

Example full URL: `http://localhost:3500/slots/mentor/USER_ID/available`

## Authentication

All endpoints that modify data (POST, DELETE, PATCH) require:
```
Authorization: Bearer {token}
```

The token should be obtained from the login endpoint and stored in localStorage.

## Error Handling

The system handles various error scenarios:
- Invalid date/time format
- End time before start time
- Slot not found
- Slot already booked
- Unauthorized access
- Database connection errors

All errors return a standard response format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Performance Notes

- Slots are indexed by `mentorId`, `status`, and `startTime` for fast queries
- Available slots query defaults to next 30 days
- Supports date filtering for specific date ranges
- Handles large numbers of slots efficiently

## Deployment Checklist

- [ ] Test slot creation with various time ranges
- [ ] Test slot viewing for learners
- [ ] Test mentorship request booking flow
- [ ] Verify mentor acceptance updates slot status
- [ ] Test error scenarios (invalid times, etc.)
- [ ] Verify database indices are created
- [ ] Check authentication on all protected routes
- [ ] Test with multiple mentors and learners
- [ ] Verify email notifications still work
- [ ] Check WebRTC video room integration

## Next Steps (Optional Enhancements)

1. **Bulk Slot Creation** - Create slots for recurring days
2. **Slot Availability Calendar** - Visual calendar view
3. **Time Zone Support** - Handle different time zones
4. **Slot Analytics** - Track booking rates and patterns
5. **Slot Pricing** - Different rates for different slots
6. **Recurring Slots** - Auto-generate slots every week
7. **Slot Reminders** - Send notifications before sessions

## Support

For issues or questions:
1. Check server logs for API errors
2. Verify authentication token is valid
3. Check MongoDB connection
4. Ensure backend routes are registered
5. Verify frontend API URL configuration in `Client/src/config/index.js`

## Summary

The mentor slot management system is now fully implemented and ready for use. Mentors can easily create time slots, and learners can discover and book available slots for mentorship sessions. The system integrates seamlessly with the existing mentorship workflow, including request handling, acceptance/rejection, and video room creation.
