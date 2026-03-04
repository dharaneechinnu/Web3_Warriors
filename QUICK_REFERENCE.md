# Mentorship Booking System - Quick Reference

## 🚀 At a Glance

| Feature | Status | Location |
|---------|--------|----------|
| Mentor Availability | ✅ New | `/mentor/availability` |
| Mentorship Requests | ✅ New | `/mentor/mentorship-requests` |
| Slot Booking | ✅ Updated | `/learner/book-session` |
| Video Integration | ✅ Existing | Unchanged |
| Email Notifications | ✅ Working | Existing service |

---

## 📦 Database Models

```
┌─────────────────────────────────────────────────────────┐
│           MENTOR AVAILABILITY SETUP                      │
├─────────────────────────────────────────────────────────┤
│ MentorAvailability                                       │
│  ├─ mentorId (FK → User)                                │
│  ├─ dayOfWeek (monday-sunday)                           │
│  ├─ startTime (18:00)                                   │
│  ├─ endTime (20:00)                                     │
│  └─ sessionDuration (30/45/60/90/120 min)               │
└─────────────────────────────────────────────────────────┘
                          ↓ AUTO-GENERATES ↓
┌─────────────────────────────────────────────────────────┐
│              AVAILABLE TIME SLOTS                        │
├─────────────────────────────────────────────────────────┤
│ MentorSlot                                              │
│  ├─ mentorId (FK → User)                                │
│  ├─ availabilityId (FK → MentorAvailability)            │
│  ├─ startTime (datetime)                                │
│  ├─ endTime (datetime)                                  │
│  └─ status (available / pending / booked)               │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│         LEARNER BOOKING WORKFLOW                         │
├─────────────────────────────────────────────────────────┤
│ MentorshipRequest                                        │
│  ├─ mentorId (FK → User)                                │
│  ├─ learnerId (FK → User)                               │
│  ├─ slotId (FK → MentorSlot)                            │
│  ├─ topic (React Hooks)                                 │
│  ├─ message (Optional note)                             │
│  └─ status (pending / accepted / rejected)              │
├─────────────────────────────────────────────────────────┤
│    ↓ ACCEPTED ↓                                          │
│ Session                                                  │
│  ├─ slotId (Links back to slot)                         │
│  ├─ mentorshipRequestId (Links to request)              │
│  ├─ roomId (Generated)                                  │
│  └─ status (confirmed)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow

### Mentor
```
1. Set Availability
   └─→ /mentor/availability
   └─→ Select day + time range + duration
   └─→ System generates slots automatically

2. Accept Requests
   └─→ /mentor/mentorship-requests
   └─→ Review pending requests
   └─→ Click "Accept" → Session created
   └─→ Match attends video call at scheduled time
```

### Learner
```
1. Find Mentor
   └─→ /learner/book-session
   └─→ Browse and select mentor

2. Book Slot
   └─→ Modal opens
   └─→ Slots load automatically
   └─→ Select available slot from list
   └─→ Enter topic + message
   └─→ Click "Send Request"

3. Wait for Approval
   └─→ Email notification when accepted
   └─→ Join video call at scheduled time
```

---

## 🔌 API Quick Commands

### Mentor: Create Availability
```bash
curl -X POST server/availability/{mentorId}/availability \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "dayOfWeek": "monday",
    "startTime": "18:00",
    "endTime": "20:00",
    "sessionDuration": 60
  }'
```

### Learner: Send Request for Slot
```bash
curl -X POST server/mentorship-requests/{learnerId}/send-request \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "slotId": "SLOT_ID",
    "topic": "React Hooks",
    "message": "Optional message"
  }'
```

### Mentor: Accept Request
```bash
curl -X PATCH server/mentorship-requests/{requestId}/accept \
  -H "Authorization: Bearer TOKEN" \
  -d '{"mentorId": "MENTOR_ID"}'
```

### Mentor: Reject Request
```bash
curl -X PATCH server/mentorship-requests/{requestId}/reject \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "mentorId": "MENTOR_ID",
    "rejectReason": "Outside my expertise"
  }'
```

---

## 📊 Status Transitions

### Request Lifecycle
```
pending  ─→  accepted  (✓ Accept button)
         └→  rejected  (✗ Reject button)
```

### Slot Lifecycle
```
available  ─→  pending   (Request sent)
           ├→  booked    (Request accepted)
           └→  available (Request rejected)
```

### Session Lifecycle
```
confirmed  ─→  completed  (After session)
```

---

## 🔔 Real-Time Events (Socket.IO)

```javascript
// Mentor receives
socket.on('new_mentorship_request', {
  requestId, learnerName, topic, slotId
});

// Learner receives
socket.on('mentorship_request_accepted', {
  requestId, roomId, slotDate, mentorName
});

socket.on('mentorship_request_rejected', {
  requestId, reason
});
```

---

## 📧 Email Notifications

| Event | Recipient | Trigger |
|-------|-----------|---------|
| New Request | Mentor | Learner sends request |
| Accepted | Learner | Mentor clicks accept |
| Rejected | Learner | Mentor clicks reject |

---

## 🛠️ Common Tasks

### Enable Test Mentorship (Dev)
```javascript
// 1. Create mentor with role
POST /auth/register { role: 'mentor', ... }

// 2. Set availability
POST /availability/{mentorId}/availability

// 3. Login as learner
POST /auth/login { role: 'learner', ... }

// 4. Book session
POST /mentorship-requests/{learnerId}/send-request
```

### Check Pending Requests (Dev)
```bash
GET /mentorship-requests/mentor/{mentorId}/pending
```

### View All Slots for Mentor
```bash
GET /availability/{mentorId}/available-slots
```

---

## 🐛 Troubleshooting

### No Slots Appearing?
- [ ] Mentor has set availability? `GET /availability/{mentorId}/availability`
- [ ] Slots generated? `POST /availability/{mentorId}/generate-slots`
- [ ] Check date range? Default is next 30 days

### Request Not Sending?
- [ ] Slot ID valid? Verify slot exists and status='available'
- [ ] Topic entered? Field is required
- [ ] Learner authenticated? Check token

### Email Not Received?
- [ ] Check spam folder
- [ ] Verify email address in profile
- [ ] Check server logs for email errors

### Can't Accept Request?
- [ ] Are you the mentor? Check mentorId
- [ ] Is request pending? Can't accept if already accepted/rejected
- [ ] Authorization token valid?

---

## 📁 File Map

```
KEY FILES TO MODIFY/REVIEW:

Backend:
├── Server/Model/
│   ├── MentorAvailabilityModel.js      (Availability schema)
│   ├── MentorSlotModel.js              (Slot schema)
│   └── MentorshipRequestModel.js       (Request schema)
├── Server/Controller/
│   ├── AvailabilityController.js       (Slot generation logic)
│   └── MentorshipController.js         (Request handling)
└── Server/Router/
    ├── AvailabilityRoutes.js           (Routes)
    └── MentorshipRequestRoutes.js      (Routes)

Frontend:
├── Client/src/pages/mentor/
│   ├── MentorAvailability.js           (Availability UI)
│   └── MentorMentorshipRequests.js     (Requests UI)
└── Client/src/pages/learner/
    └── BookSession.js                  (Updated slot booking)
```

---

## 💡 Key Concepts

### Auto-Slot Generation
When mentor sets `Mon 6PM-8PM, 60min`:
→ System creates slots: 6-7PM, 7-8PM
→ For all Mondays in next 30 days
→ Learner selects one

### Request Lifecycle
`Pending` (waiting for mentor) → `Accepted` (session created) or `Rejected` (slot freed)

### Slot Reuse
If mentor rejects request → Slot returns to `available` → Another learner can book

### Real-Time Updates
Socket.IO notifies instantly (no page refresh needed)

---

## ✅ Pre-Launch Checklist

- [ ] Database connections working
- [ ] Routes registered in Server.js
- [ ] Email service configured
- [ ] Socket.IO initialized with mentor/learner rooms
- [ ] Frontend components navigate correctly
- [ ] Test availability creation
- [ ] Test slot generation
- [ ] Test request workflow
- [ ] Test email notifications
- [ ] Test video room linking

---

## 📞 Contact & Docs

- **Implementation Guide**: `MENTORSHIP_BOOKING_IMPLEMENTATION.md`
- **User Guide**: `MENTORSHIP_BOOKING_USER_GUIDE.md`
- **API Reference**: `MENTORSHIP_BOOKING_API_GUIDE.md`
- **File Changes**: `FILES_CHANGED.md`

---

**Version**: 1.0
**Updated**: March 4, 2026
**Status**: ✅ Ready for Production
