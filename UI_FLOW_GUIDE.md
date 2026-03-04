# Mentorship Slot Booking - User Interface Flow Guide

## 🎯 Quick Visual Reference

### Mentor UI Flow

```
MENTOR PORTAL
└─ Dashboard
   └─ "⏰ Availability Settings" Page
      │
      ├─ [Browse Your Availabilities]
      │  └─ Show existing: "Monday 9:00-17:00 (60 min sessions)"
      │     [Edit] [Delete]
      │
      └─ [Add New Availability Form]
         │
         ├─ Day Select: "Monday" ▼
         │
         ├─ Start Time: "09:00" 🕘
         │
         ├─ End Time: "17:00" 🕕
         │
         ├─ Duration: "60 minutes" ▼
         │
         ├─ [💾 Save Availability]
         │
         └─ Status Messages:
            │
            ├─ (Saving...) "⏳ Saving..."
            │
            ├─ (Generating) "⏳ Generating time slots for next 30 days..."
            │
            └─ (Success!) "✅ Availability saved! Time slots generated 
                           for learners to book"

         └─ What happens behind the scenes:
            1. Saves availability to database
            2. Auto-generates 30-day slots (Mon 9-10, 10-11, ..., 5-6)
            3. Shows confirmation message
            4. Learners can NOW see these slots!
```

---

### Learner UI Flow

```
LEARNER PORTAL
└─ "🤝 Book a Mentorship" Page
   │
   ├─ Tabs: [🔍 Find a Mentor] [📋 My Mentorships]
   │
   └─ [Find a Mentor Tab]
      │
      ├─ Search Box: "Search by name, skill..." 🔍
      │
      ├─ [Mentor Card 1]
      │  ├─ Profile Photo / Avatar
      │  ├─ Name: "John Doe"
      │  ├─ Email: "john@example.com"
      │  ├─ Bio: "10+ years in web development"
      │  ├─ Experience: "Senior Software Engineer"
      │  ├─ Skills: [JavaScript] [React] [Node.js]
      │  ├─ Rating: ⭐⭐⭐⭐⭐ 4.8 (28 reviews)
      │  └─ [💌 Apply for Mentorship]
      │     │
      │     └─ Opens Modal ↓
      │
      └─ [Apply Modal]
         │
         ├─ Header: "Apply for Mentorship with John Doe"
         │
         ├─ Info Box: 📧 "Your request will be sent to the mentor. 
         │            You'll get email & in-app notification when 
         │            they accept."
         │
         ├─ Topic Field: *
         │  └─ Input: "e.g. React hooks, System design..."
         │  └─ Example: "JavaScript Closures"
         │
         ├─ Message Field: (optional)
         │  └─ Textarea: "Tell them your goals..."
         │  └─ Example: "I'm learning JS and struggling with closures"
         │
         ├─ Available Time Slots: * (AUTO-LOADED!)
         │  │
         │  ├─ ⏳ Loading available slots...
         │  │
         │  OR
         │  │
         │  ├─ ⚠️ No available slots at the moment. 
         │  │     Try checking back later.
         │  │
         │  OR (EXPECTED RESULT ON SUCCESS)
         │  │
         │  ├─ [○] 📅 Mon, Jan 8, 09:00 – 10:00
         │  ├─ [○] 📅 Mon, Jan 8, 10:00 – 11:00
         │  ├─ [○] 📅 Mon, Jan 8, 11:00 – 12:00
         │  ├─ [●] 📅 Mon, Jan 8, 01:00 – 02:00  ← Selected
         │  ├─ [○] 📅 Mon, Jan 8, 02:00 – 03:00
         │  ├─ [○] 📅 Mon, Jan 8, 03:00 – 04:00
         │  ├─ [○] 📅 Mon, Jan 8, 04:00 – 05:00
         │  └─ [○] 📅 Mon, Jan 8, 05:00 – 06:00
         │  └─ [+ scroll for more...]
         │
         ├─ Action Buttons:
         │  ├─ [🔵 💌 Send Mentorship Request] (primary)
         │  └─ [Cancel]
         │
         └─ After Sending:
            └─ "✅ Mentorship request sent! You'll be notified 
               once the mentor responds."
            
            Then auto-switches to:
            
            └─ "📋 My Mentorships" Tab
               └─ Shows request with ⏳ Pending status (yellow)
```

---

### Learner - My Mentorships View

```
"📋 My Mentorships" Tab
│
├─ View 1: No mentorships yet
│  └─ "📋 No mentorships yet"
│  └─ "Browse mentors and send a mentorship request to get started!"
│  └─ [🔍 Find a Mentor →]
│
└─ View 2: Has requests/sessions
   │
   ├─ Pending Request Card (Yellow):
   │  ├─ Badge: ⏳ PENDING
   │  ├─ 🎯 Topic: "JavaScript Closures"
   │  ├─ 👨‍🏫 Mentor: John Doe  •  ⏱ 60 min
   │  ├─ 📅 Scheduled: Monday, January 8, 2024 at 1:00 PM
   │  ├─ 💬 Message: "I'm struggling with closure concepts"
   │  └─ Info: "⏳ Waiting for mentor to accept your request..."
   │
   ├─ Confirmed Session Card (Green):
   │  ├─ Badge: ✅ CONFIRMED
   │  ├─ 🎯 Topic: "React Hooks"
   │  ├─ 👨‍🏫 Mentor: Jane Smith  •  ⏱ 60 min
   │  ├─ 📅 Scheduled: Tuesday, January 9, 2024 at 2:00 PM
   │  └─ [📹 Join Video Call] ← Click to start session
   │
   └─ Completed Session Card (Purple):
      ├─ Badge: ✔️ COMPLETED
      ├─ 🎯 Topic: "System Design"
      ├─ 👨‍🏫 Mentor: Bob Wilson
      ├─ Rating: ⭐⭐⭐⭐⭐
      └─ Feedback: "Great session! Learned a lot"
```

---

### Mentor - Mentorship Requests View

```
MENTOR PORTAL
└─ "📫 Your Mentorships" Page
   │
   ├─ Tabs: [📋 All Requests] [⏳ Pending] [✅ Accepted]
   │
   └─ [⏳ Pending Requests Tab]
      │
      ├─ Request Card (Yellow):
      │  ├─ Badge: ⏳ PENDING
      │  ├─ Learner Info:
      │  │  ├─ Avatar / Name: "Alice Johnson"
      │  │  ├─ Email: "alice@example.com"
      │  │  └─ 📊 This is their 1st request from you
      │  │
      │  ├─ Request Details:
      │  │  ├─ Topic: "🎯 JavaScript Closures"
      │  │  ├─ Slot: "📅 Mon, Jan 8 • 01:00 PM - 02:00 PM"
      │  │  └─ Message: 💬 "I'm learning JS and struggling with 
      │  │                closures. Can you help me understand 
      │  │                this concept better?"
      │  │
      │  └─ Actions:
      │     ├─ [✅ Accept] 
      │     └─ [❌ Decline]
      │
      └─ After Accepting:
         └─ Request Card (Green):
            ├─ Badge: ✅ ACCEPTED
            ├─ Learner: "Alice Johnson"
            ├─ Topic: "JavaScript Closures"
            ├─ Room Link: [⏱ Starts in 2 hours 30 minutes]
            ├─ [📹 Join Video Call] ← Available 5min before start
            └─ Alice receives:
               ├─ 📧 Email: "Your Mentorship Was Accepted!"
               ├─ 🔔 In-app notification
               └─ Video room link sent
```

---

## 📊 Complete Happy Path Scenario

### Timeline

```
TIME: Real World                System Action
════════════════════════════════════════════════════════════════

🕙 Monday 9:00 AM
Mentor: "I want to be available 
        Monday-Friday 9am-5pm"    

        ↓
Mentor: Opens /mentor/availability
        Fills form:
        - Day: Monday
        - Start: 09:00
        - End: 17:00
        - Duration: 60 min
        
        ↓
Mentor: Clicks "Save Availability"
                                    BE: Save availability
                                    BE: Generate 30 days of slots
                                    - Mon Jan 8: 9-10, 10-11, 11-12, ...
                                    - Mon Jan 15: 9-10, 10-11, 11-12, ...
                                    etc
                                    FE: Show success ✅

🕙 Monday 10:30 AM
Learner: "I want to book with John"
         Opens /learner/book-session
                                    FE: Loads mentor list
                                    
Learner: Finds "John Doe"
         Clicks "Apply for Mentorship"
                                    FE: Fetches available slots
                                    BE: Query MentorSlots where 
                                        status='available' 
                                    BE: Returns 30+ slots
                                    FE: Display in modal

Learner: Sees time slots:
         📅 Mon, Jan 8, 09:00 - 10:00
         📅 Mon, Jan 8, 10:00 - 11:00
         ... and many more
         
Learner: Selects "Mon, Jan 8, 01:00 PM"
         Types topic: "Closures"
         Types msg: "Help me understand"
         
Learner: Clicks "Send Request"
                                    BE: Create MentorshipRequest
                                    BE: Update slot: pending
                                    BE: Send email to mentor
                                    BE: Emit Socket.IO notification
                                    
Learner: See: "✅ Request sent!"
         Switches to "My Mentorships"
         Sees: ⏳ PENDING


🕙 Monday 11:00 AM
Mentor: Gets notification/email
        "Alice wants to book your 
         Monday 1pm slot"
         
        Opens /mentor/mentorships
                                    FE: Loads pending requests
                                    
Mentor: Sees Alice's request
        "Topic: Closures"
        "Message: Help me understand..."
        
Mentor: Reviews and clicks "✅ Accept"
                                    BE: Create Session with roomId
                                    BE: Update slot: booked
                                    BE: Send confirmation email
                                    BE: Socket.IO notify learner
                                    
Mentor: Sees: "✅ CONFIRMED"
        Shows: "Alice Johnson"
        Shows: Mon Jan 8, 1:00 PM

🕙 Monday 12:50 PM (10 min before)
Learner: Gets notification/email
         "Your mentorship is in 10 min!"
         
         Refreshes /learner/book-session
         Sees: ✅ CONFIRMED
         Sees: [📹 Join Video Call]

🕙 Monday 1:00 PM (Session Time)
Both:    Click [📹 Join Video Call]
                                    FE: Navigate to /room/{roomId}
                                    BE: Start WebRTC connection
                                    
Mentor & Learner: 
         See each other on video
         Start discussing closures
         
         ✅ MENTORSHIP SESSION ACTIVE!
```

---

## 🎨 Color/Status Reference

```
Status Badges:

⏳ PENDING (Yellow/Amber)
   - Awaiting mentor response
   - Slot is "reserved" but not confirmed
   - Email sent to mentor
   - Learner sees: "Waiting for mentor to accept..."

✅ CONFIRMED (Green)
   - Mentor accepted
   - Session created with video room
   - Both can join video call
   - Email sent to learner
   - [📹 Join Video Call] button visible

❌ REJECTED (Red)
   - Mentor declined the request
   - Slot returned to available
   - Learner gets email with reason
   - Can request another time slot

✔️ COMPLETED (Purple)
   - Session finished
   - Both can rate the session
   - Shows duration and feedback
```

---

## 🔧 Form Validation

### Mentor Availability Form

```
Validation Rules:

□ Day of Week: Required
  └─ Options: Monday, Tuesday, ..., Sunday

□ Start Time: Required
  └─ Format: HH:MM (09:00, 14:30, etc.)
  └─ Validation: Cannot be same as end time

□ End Time: Required  
  └─ Format: HH:MM
  └─ Validation: Must be AFTER start time
  └─ Error: "Start time must be before end time"

□ Session Duration: Required
  └─ Options: 30, 45, 60, 90, 120 minutes
  └─ Validation: Time range must be divisible
                 (e.g., 9am-5pm = 8 hours = 8 × 60 min slots ✓)

Success: Slot generation shows:
         "✅ Availability saved! Time slots generated
             for learners to book"
```

### Learner Booking Form

```
Validation Rules:

□ Mentor Selection: Required
  └─ Click mentor card to open modal

□ Topic: Required (*)
  └─ Min length: 5 characters
  └─ Max length: 100 characters
  └─ Error if empty: "Please enter a topic"
  └─ Placeholder: "e.g. React hooks, System design..."

□ Message: Optional
  └─ Max length: 500 characters
  └─ Helps mentor understand your needs
  └─ Placeholder: "Tell them your goals..."

□ Time Slot: Required (*)
  └─ Must select one radio button
  └─ Error if none selected: "Please select an available time slot"
  └─ Shows formatted date/time: "📅 Mon, Jan 8, 09:00 – 10:00"

Success: Shows confirmation and switches to:
         "✅ Mentorship request sent! You'll be notified
             once the mentor responds."
```

---

## ⚡ Real-Time Features

### Socket.IO Events

```
MENTOR receives:
├─ When learner sends request:
│  └─ Event: new_mentorship_request
│     Data: { 
│       requestId: "...",
│       learnerName: "Alice",
│       topic: "Closures",
│       slotId: "..."
│     }
│     Action: Notification badge updates
│
└─ When learner joins video:
   └─ Event: learner_joined_call
      Data: { learnerId, roomId }
      Action: Mentor notified

LEARNER receives:
├─ When mentor accepts:
│  └─ Event: mentorship_accepted
│     Data: { 
│       mentorshipId: "...",
│       sessionId: "...",
│       roomId: "...",
│       scheduledTime: "..."
│     }
│     Action: Status changes to ✅ CONFIRMED
│
└─ When mentor rejects:
   └─ Event: mentorship_rejected
      Data: { 
        mentorshipId: "...",
        reason: "..."
      }
      Action: Status shows ❌ REJECTED with reason
```

---

## 📱 Responsive Design

```
Desktop (1024px+):
├─ Multiple mentor cards in grid
├─ Modal width: 500px
└─ Slots list: 250px height with scroll

Tablet (768px-1023px):
├─ Mentor cards in 2-column grid
├─ Modal width: 90% of screen
└─ Slots: scrollable

Mobile (320px-767px):
├─ Mentor cards: full width (stacked)
├─ Modal: Full screen height
├─ Can scroll through available slots
└─ Touch-friendly buttons (48px min height)
```

---

## ✨ UX Polish

```
Loading States:
├─ Mentor form: "⏳ Saving..." → "✅ Generated ✓"
├─ Learner slots: "⏳ Loading available slots..."
└─ Request send: "⏳ Sending Request..." → "✅ Sent!"

Error States:
├─ No mentors: "🤷 No mentors available right now"
├─ No slots: "⚠️ No available slots at the moment"
└─ Form error: Red alert box with message

Success States:
├─ Mentor saves: "✅ Availability saved! Time slots generated"
├─ Learner books: "✅ Mentorship request sent!"
└─ Mentor accepts: "✅ CONFIRMED - Ready to start!"

Animations:
├─ Cards: Fade in + slide up on appear
├─ Modals: Scale 0.92 → 1.0 (bounce effect)
├─ Status badges: Color transition on change
└─ Buttons: Hover effect + opacity on click
```

---

## 🎯 Expected User Experience

### Happy Path (Everything Works)

```
Mentor:
- Sets availability in 30 seconds
- Sees confirmation message
- Learners immediately see slots (in their browser)
✅ System: Working as designed

Learner:
- Opens page, sees mentors list in 2 seconds
- Clicks mentor, slots load in 1 second
- Selects slot, fills topic, sends request in 1 minute
- Gets confirmation immediately
✅ System: Working as designed

Mentor Accepts:
- Sees request notification in real-time
- Clicks accept
- Session created with video room
- Learner gets email + in-app notification
✅ System: Working as designed
```

---

This guide shows mentors and learners exactly what they should see and expect from the system!
