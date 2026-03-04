# Mentorship Booking System - Implementation Summary

## Overview
This document outlines the complete implementation of the new slot-based mentorship booking feature for the MERN stack platform.

## Architecture Changes

### Database Models Created

#### 1. **MentorAvailabilityModel.js**
Stores mentor availability preferences by day of week.

**Schema:**
- `mentorId` - Reference to User (mentor)
- `dayOfWeek` - Day of week (monday-sunday)
- `startTime` - Start time in HH:MM format (24-hour)
- `endTime` - End time in HH:MM format (24-hour)
- `sessionDuration` - Duration of each slot (30, 45, 60, 90, 120 minutes)
- `isActive` - Whether this availability is active
- `createdAt`, `updatedAt`

**Indexes:**
- Unique index on `(mentorId, dayOfWeek)` - One availability per day per mentor
- Index on `(mentorId, isActive)` for filtering

#### 2. **MentorSlotModel.js**
Auto-generated time slots based on mentor availability.

**Schema:**
- `mentorId` - Reference to User (mentor)
- `availabilityId` - Reference to MentorAvailability
- `startTime` - Full datetime of slot start
- `endTime` - Full datetime of slot end
- `status` - 'available', 'pending', 'booked'
- `mentorshipRequestId` - Reference to pending/processing request
- `sessionId` - Reference to Session after acceptance
- `createdAt`, `updatedAt`

**Indexes:**
- Multiple indexes for efficient querying by mentor, status, date

#### 3. **MentorshipRequestModel.js**
Stores learner requests for specific slots.

**Schema:**
- `mentorId` - Reference to User (mentor)
- `learnerId` - Reference to User (learner)
- `slotId` - Reference to MentorSlot
- `topic` - Mentorship topic
- `message` - Optional message from learner
- `status` - 'pending', 'accepted', 'rejected'
- `rejectReason` - Reason for rejection if applicable
- `createdAt`, `respondedAt`, `updatedAt`

#### 4. **SessionModel.js (Updated)**
Added new fields to link slots and requests:
- `slotId` - Reference to MentorSlot
- `mentorshipRequestId` - Reference to MentorshipRequest

### Backend API Endpoints

#### Availability Management Routes (`/availability`)

**POST** `/availability/:mentorId/availability`
- Mentor creates or updates availability for a day
- Body: `{ dayOfWeek, startTime, endTime, sessionDuration }`
- Automatically regenerates slots for that day

**GET** `/availability/:mentorId/availability`
- Get all active availabilities for a mentor
- Returns array of availability records

**DELETE** `/availability/availability/:availabilityId`
- Mentor deletes availability
- Body: `{ mentorId }`
- Deletes associated available slots

**POST** `/availability/:mentorId/generate-slots`
- Manually trigger slot generation
- Body: `{ daysAhead: 30 }` (optional, default 30 days)
- Generates slots for all active availabilities

**GET** `/availability/:mentorId/available-slots`
- Get available slots for a mentor
- Query: `?fromDate=...&toDate=...` (optional, default next 30 days)
- Returns array of available slots sorted by date

#### Mentorship Request Routes (`/mentorship-requests`)

**POST** `/mentorship-requests/:learnerId/send-request`
- Learner sends request for a specific slot
- Body: `{ slotId, topic, message }`
- Creates MentorshipRequest, updates slot to 'pending'
- Emits real-time notification to mentor

**GET** `/mentorship-requests/mentor/:mentorId/pending`
- Get pending requests for mentor
- Returns requests with learner details and slot info

**GET** `/mentorship-requests/mentor/:mentorId/all`
- Get all requests for mentor (all statuses)
- Query: `?status=pending|accepted|rejected` (optional)

**PATCH** `/mentorship-requests/:requestId/accept`
- Mentor accepts request
- Body: `{ mentorId }`
- Updates request status to 'accepted'
- Updates slot status to 'booked'
- Creates Session record with generated roomId
- Emits notification to learner
- Sends email confirmation

**PATCH** `/mentorship-requests/:requestId/reject`
- Mentor rejects request
- Body: `{ mentorId, rejectReason }`
- Updates request status to 'rejected'
- Resets slot status to 'available'
- Sends email to learner

**GET** `/mentorship-requests/learner/:learnerId/requests`
- Get learner's requests (all statuses)
- Query: `?status=pending|accepted|rejected` (optional)

### Backend Controllers

#### AvailabilityController.js
Manages mentor availability and slot generation.

**Key Functions:**
- `setAvailability()` - Create/update availability for a day
- `getAvailabilities()` - Fetch mentor's availabilities
- `deleteAvailability()` - Soft delete availability
- `generateSlots()` - Manual trigger for slot generation
- `getAvailableSlots()` - Fetch available slots for learner selection
- `regenerateSlots()` - Internal helper for auto-generating slots

**Slot Generation Logic:**
- Calculates available time windows based on availability settings
- Splits time window into sessions of specified duration
- Generates slots for next 30 days (configurable)
- Handles daylight saving time considerations

#### MentorshipController.js
Manages mentorship requests and workflow.

**Key Functions:**
- `sendMentorshipRequest()` - Learner sends request for slot
- `getPendingRequests()` - Get pending requests for mentor
- `getMentorRequests()` - Get all requests (with status filter)
- `acceptMentorshipRequest()` - Mentor accepts, creates session
- `rejectMentorshipRequest()` - Mentor rejects request
- `getLearnerRequests()` - Get learner's request history

**Real-time Notifications (Socket.IO):**
- Emits `new_mentorship_request` to mentor room
- Emits `mentorship_request_accepted` to learner room
- Emits `mentorship_request_rejected` to learner room

### Frontend Components

#### MentorAvailability.js (New Page)
Mentor dashboard to set availability.

**Features:**
- Day-of-week selection
- Time range input (start/end)
- Session duration selection (30, 45, 60, 90, 120 min)
- View current availability for all days
- Edit/delete individual availabilities
- Real-time form validation

**Route:** `/mentor/availability`

#### MentorMentorshipRequests.js (New Page)
Mentor dashboard to manage mentorship requests.

**Features:**
- Tabbed interface (Pending, Accepted, Rejected)
- Displays learner info (name, email, avatar)
- Shows requested topic and learner message
- Shows requested slot date/time
- Accept/Reject buttons with optional reason input
- Real-time badge badges for request counts
- Auto-refresh every 10 seconds

**Route:** `/mentor/mentorship-requests`

#### BookSession.js (Updated)
Updated learner page for booking mentorship.

**Changes:**
- REMOVED: Duration input field
- REMOVED: Manual date/time input field
- ADDED: Available slots display section
- CHANGED: Modal now fetches slots when mentor is selected
- CHANGED: Learner selects from available slots (radio buttons)
- UPDATED: Form submission sends slotId instead of manual times

**New State Variables:**
- `selectedSlot` - Currently selected slot
- `availableSlots` - Array of available slots for selected mentor
- `slotsLoading` - Loading state for slot fetching

**Key Functions:**
- `fetchAvailableSlots()` - Fetch slots when mentor selected
- `applyMentorship()` - Updated to send mentorship request

## Workflow Diagram

```
MENTOR SETUP
├── Visit /mentor/availability
├── Set availability (days, times, duration)
└── System auto-generates slots

LEARNER BOOKING
├── Visit /learner/book-session
├── Browse and select mentor
├── Modal opens, fetches available slots
├── Selects slot from available list
├── Enters topic and optional message
└── Sends mentorship request

MENTOR REVIEW
├── Visit /mentor/mentorship-requests
├── Reviews pending requests
├── Can accept or reject
│   ├── Accept: Creates session, sends confirmation email
│   └── Reject: Marks request rejected, frees up slot

SESSION MANAGEMENT
├── Accepted sessions appear in both dashboards
├── Both can join video call via button
└── Post-session rating and completion
```

## Data Flow for Single Request

1. **Learner sends request:**
   - POST `/mentorship-requests/:learnerId/send-request`
   - System creates MentorshipRequest (status: pending)
   - Updates MentorSlot.status to 'pending'
   - Emits Socket.IO notification to mentor
   - Sends email to mentor

2. **Mentor accepts:**
   - PATCH `/mentorship-requests/:requestId/accept`
   - Updates MentorshipRequest.status to 'accepted'
   - Updates MentorSlot.status to 'booked'
   - Creates new Session record
   - Generates unique roomId
   - Links session to slot and request
   - Emits Socket.IO notification to learner
   - Sends email to learner with join link

3. **Mentor rejects:**
   - PATCH `/mentorship-requests/:requestId/reject`
   - Updates MentorshipRequest.status to 'rejected'
   - Resets MentorSlot.status to 'available'
   - Slot becomes available for other learners
   - Sends rejection email to learner

## Integration with Existing System

### Video Call Integration
- The existing WebRTC video calling system is **NOT modified**
- When mentor accepts, a roomId is generated and stored in Session
- Learners join using the same `/room/:roomId` route
- All video functionality remains unchanged

### Email Service
- Uses existing `emailService.js` functions:
  - `sendBookingRequestEmail()` - Notify mentor of request
  - `sendBookingAcceptedEmail()` - Notify learner of acceptance
  - `sendBookingRejectedEmail()` - Notify learner of rejection

### Socket.IO Integration
- Added mentor/learner room joins in socket connection
- Emits real-time notifications for request updates
- Mentors alerted immediately when new requests arrive

### User Model Integration
- No changes to User model required
- Uses existing mentor/learner role system

## Testing Checklist

- [ ] Mentor can set availability for all days
- [ ] Mentor can edit/delete existing availability
- [ ] Slots are auto-generated for next 30 days
- [ ] Learner sees available slots when selecting mentor
- [ ] Learner can send request for specific slot
- [ ] Mentor receives request notification
- [ ] Mentor can accept request (creates session, frees slot)
- [ ] Mentor can reject request (keeps slot available)
- [ ] Learner receives confirmation email on acceptance
- [ ] Both can see "Upcoming Session" with Join button
- [ ] Join button opens existing video call system
- [ ] No slots available message displays correctly
- [ ] Conflicting requests handled properly

## Future Enhancements

1. **Timezone Support**
   - Store mentor timezone
   - Display slots in learner's timezone

2. **Recurring Availability**
   - Set availability template for multiple weeks
   - Auto-apply to future dates

3. **Buffer Time**
   - Add break time between sessions
   - Configurable mentor preference

4. **Cancellation Policy**
   - Define cancellation deadlines
   - Automatic refund rules

5. **Rescheduling**
   - Allow learner/mentor to reschedule sessions
   - Move to different available slot

6. **Batch Slot Import**
   - Import calendar from Google Calendar, Outlook
   - Sync with external calendars

## Deployment Notes

1. **Database Migration:**
   - Runs on server startup (collections created on first insert)
   - No manual migration needed

2. **Dependencies:**
   - Uses existing packages (mongoose, express)
   - No new npm packages required

3. **Environment Variables:**
   - No new environment variables needed
   - Uses existing MONGODB and email config

4. **Routes Registration:**
   - Added in Server.js under new routes section:
     ```javascript
     app.use("/availability", require("./Router/AvailabilityRoutes"));
     app.use("/mentorship-requests", require("./Router/MentorshipRequestRoutes"));
     ```

## Support for Both Old and New Flows

- Old session-based system still works
- New slot-based system is parallel
- Can coexist without conflicts
- Gradual migration to new system possible
