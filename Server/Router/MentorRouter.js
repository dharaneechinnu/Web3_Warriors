require('dotenv').config();
const express = require('express');
const router = express.Router();

const mentorshipController= require("../Controller/MentorController");


// Route to add mentor details
router.post("/add", mentorshipController.addMentorshipDetails);

// Route to get mentorship details by mentorId
router.get("/getallmentor", mentorshipController.getMentorshipDetails);

router.get("/getMentor/:id", mentorshipController.getMentor);


router.post('/notifyMentor', async (req, res) => {
    try {
      const { transactionHash, mentorAddress } = req.body;
  
      // Fetch mentor details using mentorAddress
      const mentor = await User.findOne({ address: mentorAddress }); // Assuming mentor's address is stored in User model
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
  
      // Email sending logic using Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your email address
          pass: process.env.EMAIL_PASS, // Your email password or App-specific password
        },
      });
  
      // Email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: mentor.email, // Assuming mentor's email is in the database
        subject: 'Transaction Completed for Mentorship',
        text: `Hello ${mentor.name},\n\nYour mentorship transaction has been successfully completed. Here is the transaction hash: ${transactionHash}\n\nThank you for your contribution to Skill Exchange!\n\nBest regards,\nSkill Exchange Team`,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully to mentor' });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: 'Server error', error });
    }
  });


module.exports = router;
