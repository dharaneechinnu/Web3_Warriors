# Mentorship Booking API - Developer Reference

## Base URL
```
http://localhost:5000
```

## Authentication
All endpoints (except GET for availability) require Bearer token authorization:
```
Authorization: Bearer <token>
```

---

## Availability Management API

### 1. Set Mentor Availability

**Endpoint:** `POST /availability/:mentorId/availability`

**Description:** Create or update availability for a specific day.

**Parameters:**
- `mentorId` (URL): Mentor's user ID
- `dayOfWeek` (Body): Day of week (monday, tuesday, ..., sunday)
- `startTime` (Body): Start time in HH:MM format (24-hour)
- `endTime` (Body): End time in HH:MM format (24-hour)
- `sessionDuration` (Body): Duration in minutes (30, 45, 60, 90, 120)

**Request Example:**
```bash
curl -X POST http://localhost:5000/availability/669abcd1234567890abcdef1/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "dayOfWeek": "monday",
    "startTime": "18:00",
    "endTime": "20:00",
    "sessionDuration": 60
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Availability set successfully",
  "availability": {
    "_id": "669acd1234567890abcdef2",
    "mentorId": "669abcd1234567890abcdef1",
    "dayOfWeek": "monday",
    "startTime": "18:00",
    "endTime": "20:00",
    "sessionDuration": 60,
    "isActive": true,
    "createdAt": "2025-03-04T10:30:00.000Z",
    "updatedAt": "2025-03-04T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Start time must be before end time"
}
```

---

### 2. Get Mentor Availabilities

**Endpoint:** `GET /availability/:mentorId/availability`

**Description:** Retrieve all active availability settings for a mentor.

**Parameters:**
- `mentorId` (URL): Mentor's user ID

**Request Example:**
```bash
curl -X GET http://localhost:5000/availability/669abcd1234567890abcdef1/availability
```

**Response:**
```json
{
  "success": true,
  "availabilities": [
    {
      "_id": "669acd1234567890abcdef2",
      "mentorId": "669abcd1234567890abcdef1",
      "dayOfWeek": "monday",
      "startTime": "18:00",
      "endTime": "20:00",
      "sessionDuration": 60,
      "isActive": true
    },
    {
      "_id": "669acd1234567890abcdef3",
      "mentorId": "669abcd1234567890abcdef1",
      "dayOfWeek": "wednesday",
      "startTime": "17:00",
      "endTime": "19:00",
      "sessionDuration": 45,
      "isActive": true
    }
  ]
}
```

---

### 3. Delete Availability

**Endpoint:** `DELETE /availability/availability/:availabilityId`

**Description:** Soft-delete an availability slot (remains in DB, marked inactive).

**Parameters:**
- `availabilityId` (URL): Availability record ID
- `mentorId` (Body): Mentor's user ID (for authorization)

**Request Example:**
```bash
curl -X DELETE http://localhost:5000/availability/availability/669acd1234567890abcdef2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "mentorId": "669abcd1234567890abcdef1"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Availability deleted"
}
```

---

### 4. Get Available Slots

**Endpoint:** `GET /availability/:mentorId/available-slots`

**Description:** Fetch available time slots for a mentor (for learners to browse).

**Parameters:**
- `mentorId` (URL): Mentor's user ID
- `fromDate` (Query, optional): ISO date string (e.g., 2025-03-05)
- `toDate` (Query, optional): ISO date string
- Default: Next 30 days if not specified

**Request Example:**
```bash
curl -X GET "http://localhost:5000/availability/669abcd1234567890abcdef1/available-slots?fromDate=2025-03-05&toDate=2025-03-15"
```

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "_id": "669acd1234567890abcdef10",
      "mentorId": "669abcd1234567890abcdef1",
      "availabilityId": "669acd1234567890abcdef2",
      "startTime": "2025-03-05T18:00:00.000Z",
      "endTime": "2025-03-05T19:00:00.000Z",
      "status": "available",
      "mentorshipRequestId": null,
      "sessionId": null
    },
    {
      "_id": "669acd1234567890abcdef11",
      "mentorId": "669abcd1234567890abcdef1",
      "availabilityId": "669acd1234567890abcdef2",
      "startTime": "2025-03-05T19:00:00.000Z",
      "endTime": "2025-03-05T20:00:00.000Z",
      "status": "available",
      "mentorshipRequestId": null,
      "sessionId": null
    }
  ]
}
```

---

### 5. Generate Slots (Manual)

**Endpoint:** `POST /availability/:mentorId/generate-slots`

**Description:** Manually trigger slot generation for all active availabilities.

**Parameters:**
- `mentorId` (URL): Mentor's user ID
- `daysAhead` (Body, optional): Number of days to generate (default: 30)

**Request Example:**
```bash
curl -X POST http://localhost:5000/availability/669abcd1234567890abcdef1/generate-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "daysAhead": 45
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Slots generated for next 45 days"
}
```

---

## Mentorship Request API

### 1. Send Mentorship Request

**Endpoint:** `POST /mentorship-requests/:learnerId/send-request`

**Description:** Learner sends a mentorship request for a specific slot.

**Parameters:**
- `learnerId` (URL): Learner's user ID
- `slotId` (Body): The slot ID learner wants to book
- `topic` (Body): Topic of mentorship (required)
- `message` (Body, optional): Additional message from learner

**Request Example:**
```bash
curl -X POST http://localhost:5000/mentorship-requests/669abe1234567890abcdef20/send-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "slotId": "669acd1234567890abcdef10",
    "topic": "React Hooks and State Management",
    "message": "I am a beginner in React and want to understand hooks better."
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mentorship request sent successfully",
  "request": {
    "_id": "669ace1234567890abcdef30",
    "mentorId": "669abcd1234567890abcdef1",
    "learnerId": "669abe1234567890abcdef20",
    "slotId": "669acd1234567890abcdef10",
    "topic": "React Hooks and State Management",
    "message": "I am a beginner in React and want to understand hooks better.",
    "status": "pending",
    "createdAt": "2025-03-04T11:00:00.000Z"
  }
}
```

**Response (Error - Slot Not Available):**
```json
{
  "success": false,
  "message": "Slot is not available"
}
```

---

### 2. Get Pending Requests (Mentor)

**Endpoint:** `GET /mentorship-requests/mentor/:mentorId/pending`

**Description:** Get all pending mentorship requests for a mentor.

**Parameters:**
- `mentorId` (URL): Mentor's user ID

**Request Example:**
```bash
curl -X GET http://localhost:5000/mentorship-requests/mentor/669abcd1234567890abcdef1/pending \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "669ace1234567890abcdef30",
      "mentorId": "669abcd1234567890abcdef1",
      "learnerId": {
        "_id": "669abe1234567890abcdef20",
        "name": "John Doe",
        "email": "john@example.com",
        "profileImage": "https://..."
      },
      "slotId": {
        "_id": "669acd1234567890abcdef10",
        "startTime": "2025-03-05T18:00:00.000Z",
        "endTime": "2025-03-05T19:00:00.000Z"
      },
      "topic": "React Hooks",
      "message": "Beginner level",
      "status": "pending",
      "createdAt": "2025-03-04T11:00:00.000Z"
    }
  ]
}
```

---

### 3. Accept Mentorship Request

**Endpoint:** `PATCH /mentorship-requests/:requestId/accept`

**Description:** Mentor accepts a request, creating a confirmed session.

**Parameters:**
- `requestId` (URL): MentorshipRequest ID
- `mentorId` (Body): Mentor's user ID (for authorization)

**Request Example:**
```bash
curl -X PATCH http://localhost:5000/mentorship-requests/669ace1234567890abcdef30/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "mentorId": "669abcd1234567890abcdef1"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Request accepted and session created",
  "session": {
    "_id": "669acf1234567890abcdef40",
    "mentorId": "669abcd1234567890abcdef1",
    "learnerId": "669abe1234567890abcdef20",
    "title": "React Hooks",
    "topic": "React Hooks",
    "date": "2025-03-05T18:00:00.000Z",
    "scheduledAt": "2025-03-05T18:00:00.000Z",
    "duration": 60,
    "status": "confirmed",
    "roomId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "meetingLink": "/room/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
    "slotId": "669acd1234567890abcdef10",
    "mentorshipRequestId": "669ace1234567890abcdef30"
  }
}
```

---

### 4. Reject Mentorship Request

**Endpoint:** `PATCH /mentorship-requests/:requestId/reject`

**Description:** Mentor rejects a request.

**Parameters:**
- `requestId` (URL): MentorshipRequest ID
- `mentorId` (Body): Mentor's user ID (for authorization)
- `rejectReason` (Body, optional): Reason for rejection

**Request Example:**
```bash
curl -X PATCH http://localhost:5000/mentorship-requests/669ace1234567890abcdef30/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "mentorId": "669abcd1234567890abcdef1",
    "rejectReason": "Topic is outside my expertise"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Request rejected"
}
```

---

### 5. Get All Requests (Mentor)

**Endpoint:** `GET /mentorship-requests/mentor/:mentorId/all`

**Description:** Get all requests for a mentor (all statuses).

**Parameters:**
- `mentorId` (URL): Mentor's user ID
- `status` (Query, optional): Filter by 'pending', 'accepted', or 'rejected'

**Request Example:**
```bash
curl -X GET "http://localhost:5000/mentorship-requests/mentor/669abcd1234567890abcdef1/all?status=accepted" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "669ace1234567890abcdef30",
      "mentorId": "669abcd1234567890abcdef1",
      "learnerId": {...},
      "slotId": {...},
      "topic": "React Hooks",
      "message": "Beginner level",
      "status": "accepted",
      "respondedAt": "2025-03-04T11:05:00.000Z"
    }
  ]
}
```

---

### 6. Get Learner Requests

**Endpoint:** `GET /mentorship-requests/learner/:learnerId/requests`

**Description:** Get all mentorship requests sent by a learner.

**Parameters:**
- `learnerId` (URL): Learner's user ID
- `status` (Query, optional): Filter by status

**Request Example:**
```bash
curl -X GET "http://localhost:5000/mentorship-requests/learner/669abe1234567890abcdef20/requests" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "669ace1234567890abcdef30",
      "mentorId": {
        "_id": "669abcd1234567890abcdef1",
        "name": "Alice Smith",
        "email": "alice@example.com"
      },
      "learnerId": "669abe1234567890abcdef20",
      "slotId": {...},
      "topic": "React Hooks",
      "status": "accepted"
    }
  ]
}
```

---

## Error Codes & Handling

### Common Errors

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "dayOfWeek, startTime, endTime, and sessionDuration are required"
}
```

#### 403 - Unauthorized/Forbidden
```json
{
  "success": false,
  "message": "Only mentors can set availability"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Mentor not found"
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "message": "Internal server error details"
}
```

---

## Real-Time Events (Socket.IO)

### Mentor Events
User joins room: `mentor_<mentorId>`

**Event: `new_mentorship_request`**
```json
{
  "requestId": "669ace1234567890abcdef30",
  "learnerName": "John Doe",
  "topic": "React Hooks",
  "slotId": "669acd1234567890abcdef10"
}
```

**Event: `mentorship_request_rejected`**
```json
{
  "requestId": "669ace1234567890abcdef30",
  "reason": "Topic is outside my expertise"
}
```

### Learner Events
User joins room: `learner_<learnerId>`

**Event: `mentorship_request_accepted`**
```json
{
  "requestId": "669ace1234567890abcdef30",
  "roomId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "slotDate": "2025-03-05T18:00:00.000Z",
  "mentorName": "Alice Smith"
}
```

**Event: `mentorship_request_rejected`**
```json
{
  "requestId": "669ace1234567890abcdef30",
  "reason": "Topic is outside my expertise"
}
```

---

## Usage Examples

### Example 1: Complete Flow for Mentor Setup

```javascript
// 1. Mentor sets availability for Monday
POST /availability/MENTOR_ID/availability
{
  "dayOfWeek": "monday",
  "startTime": "18:00",
  "endTime": "20:00",
  "sessionDuration": 60
}

// 2. System auto-generates 2 slots via backend logic

// 3. Learner fetches available slots
GET /availability/MENTOR_ID/available-slots

// Returns slots for next 30 days
```

### Example 2: Complete Flow for Learner Booking

```javascript
// 1. Learner sends request
POST /mentorship-requests/LEARNER_ID/send-request
{
  "slotId": "SLOT_ID",
  "topic": "React Hooks",
  "message": "I want to learn hooks"
}
// Request status: "pending", Slot status: "pending"

// 2. Mentor sees notification and accepts
PATCH /mentorship-requests/REQUEST_ID/accept
{
  "mentorId": "MENTOR_ID"
}
// Request status: "accepted", Slot status: "booked", Session created

// 3. Learner can now join
GET /sessions/LEARNER_ID
// Sees session with roomId

// 4. Both join video call
navigate(/room/{roomId})
```

---

## Pagination & Filtering (Future)

Currently, all endpoints return full results. Future versions will support:

```bash
# Pagination
GET /mentorship-requests/learner/:learnerId/requests?page=1&limit=10

# Advanced filtering
GET /mentorship-requests/mentor/:mentorId/all?status=pending&createdAfter=2025-03-01
```

---

## Rate Limiting (Recommended)

Consider implementing in production:
- 100 requests/minute per user
- 10 mentorship requests/hour per learner
- 50 availability updates/day per mentor

---

## Webhooks (Future)

Future versions could emit webhooks:
- `mentorship.request.created`
- `mentorship.request.accepted`
- `mentorship.request.rejected`
- `session.scheduled`
- `session.completed`
