# Mentorship Booking System - User Guide

## For Mentors

### Setting Up Your Availability

1. **Navigate to Availability Settings**
   - Go to your mentor dashboard
   - Click on "⏰ Availability Settings" menu item
   - Or visit: `/mentor/availability`

2. **Add Availability for a Day**
   - Click "➕ Add Availability" button
   - Select a day of the week
   - Set start time (e.g., 6:00 PM / 18:00)
   - Set end time (e.g., 8:00 PM / 20:00)
   - Choose session duration (30, 45, 60, 90, or 120 minutes)
   - Click "💾 Save Availability"

3. **System Will Auto-Generate Slots**
   - For example, if you set 6:00 PM - 8:00 PM with 60-min slots:
     - Slot 1: 6:00 PM - 7:00 PM
     - Slot 2: 7:00 PM - 8:00 PM
   - Slots are generated for the next 30 days automatically

4. **Edit or Delete Availability**
   - View all your availability settings on the same page
   - Click "✏️ Edit" to modify times or duration
   - Click "🗑️ Delete" to remove availability for a day

### Managing Mentorship Requests

1. **View Pending Requests**
   - Go to "📬 Mentorship Requests" page
   - Or visit: `/mentor/mentorship-requests`
   - See all pending requests in the "Pending" tab

2. **Review a Request**
   - See learner's name, profile, and email
   - See the requested topic and learner's message
   - See the exact time slot they requested

3. **Accept a Request**
   - Click "✓ Accept" button
   - System will:
     - Create a confirmed session
     - Generate a private video room
     - Mark the slot as booked
     - Send confirmation email to learner
   - Move to accepted list

4. **Decline a Request**
   - Click "✗ Decline" button
   - (Optional) Enter reason for declining
   - System will:
     - Mark slot as available again
     - Allow other learners to book this slot
     - Send decline notification to learner

5. **Track Your Sessions**
   - Go to "🤝 My Mentorship Sessions"
   - See pending requests, upcoming sessions, and completed sessions
   - Join video calls at scheduled time

## For Learners

### Discovering and Booking Mentors

1. **Browse Available Mentors**
   - Go to "🤝 Book a Mentorship" page
   - Or visit: `/learner/book-session`
   - Click "🔍 Find a Mentor" tab
   - See all available mentors with their profiles

2. **Search for Mentors**
   - Use search bar to filter by name, email, or skills
   - Examples: "React", "AI/ML", "Career coaching"

3. **Select a Mentor and Request Session**
   - Click "📧 Apply for Mentorship" button
   - Modal will open with mentor's details

4. **Fill in Request Details**
   - **Topic**: What do you want to learn? (required)
     - Examples: "React Hooks", "System Design", "Interview Prep"
   - **Message**: Any additional details? (optional)
     - Share your goals, experience level, or specific areas
   
5. **Select Available Time Slot**
   - Wait for available slots to load
   - See time slots displayed as radio options
   - Example: "📅 Mar 6 – 6:00 PM – 7:00 PM"
   - Click to select your preferred slot
   - ⚠️ If no slots show, mentor hasn't set availability yet

6. **Send Request**
   - Click "📧 Send Mentorship Request"
   - You'll see confirmation: "✅ Mentorship request sent!"
   - Request sent to mentor for review

### Tracking Your Mentorships

1. **View Your Requests**
   - Go to "📅 My Mentorships" tab
   - Or visit: `/learner/book-session` → "My Mentorships" tab
   - See all your mentorship requests and sessions

2. **Request Status Meanings**
   - **🟡 Pending**: Waiting for mentor to accept your request
   - **🔵 Confirmed**: Mentor accepted! You can now join the session
   - **❌ Rejected**: Mentor declined. Try requesting another mentor or mentor might have provided a reason
   - **✅ Completed**: Session finished. You can rate the mentor

3. **Join Video Session**
   - Once mentor accepts, click "📹 Join Video Call"
   - Opens private video room created by system
   - Only mentor and you can access this room

4. **After Session**
   - Rate your experience (1-5 stars)
   - Leave a review/comment about the mentorship
   - This helps other learners choose mentors

## Email Notifications

### Mentors Will Receive
- **📬 New Request Notification**: Someone requested mentorship
  - Includes: Learner name, topic, requested time, learner's message
  - Link to dashboard to accept/decline

- **✅ Booking Confirmed**: Session details and reminder

### Learners Will Receive
- **🔵 Request Received**: Confirmation that mentor received request

- **✅ Session Confirmed**: Mentor accepted your request
  - Includes: Session time, mentor name, join link

- **❌ Request Declined**: Mentor couldn't accept
  - May include reason from mentor
  - Suggested: Browse other mentors

## Tips and Best Practices

### For Mentors
1. **Set Regular Availability**: Users prefer mentors with consistent hours
2. **Be Responsive**: Check and respond to requests frequently
3. **Leave Clear Feedback**: If declining, explain why (schedule conflict, topic mismatch, etc.)
4. **Vary Your Availability**: Offer different times to reach different learners
5. **Monitor Your Calendar**: Don't overbook - accept only sessions you can commit to

### For Learners
1. **Be Specific About Topics**: Detailed topics help mentors accept faster
2. **Provide Context**: In your message, share your experience level and goals
3. **Book Early**: Popular mentors fill up quickly
4. **Show Up On Time**: Mentors appreciate punctuality
5. **Complete Sessions**: This builds profile and helps future bookings
6. **Leave Reviews**: Help community discover good mentors

## Troubleshooting

### No Available Slots Showing?
- **Reason**: Mentor hasn't set availability yet
- **Solution**: Try other mentors or check back later

### Can't Find a Mentor?
- **Reason**: Limited mentors available in that topic
- **Solution**: Use search for related skills, check availability

### Mentor Not Responding?
- **Reason**: Mentor may be busy or offline
- **Solution**: Try different mentor, or wait 24 hours

### Slot Disappeared After I Selected It?
- **Reason**: Another learner booked it at same time
- **Solution**: Select another available slot or wait for more slots

### Email Not Received?
- Check spam folder
- Verify email in profile is correct
- Contact support if issue persists

## Frequently Asked Questions

**Q: Can I change the time of my booked session?**
A: Not yet. Current system doesn't support rescheduling. Feature coming soon!

**Q: Can mentor see my full profile?**
A: Mentor sees: Name, email, and any message you write. They don't see your full learner profile.

**Q: How long are sessions?**
A: Duration is set by mentor. Usually 30-120 minutes. Check when selecting time slot.

**Q: What if I need to cancel?**
A: Reach out to mentor directly or cancel through dashboard (pending updates).

**Q: Can I book with same mentor multiple times?**
A: Yes! Complete first session, then book again.

**Q: Is the video call private?**
A: Yes! Each session gets a unique room ID. Only you and mentor can access it.

**Q: Can I invite others to the session?**
A: No, currently 1-on-1 only. Sessions are private between mentor and learner.
