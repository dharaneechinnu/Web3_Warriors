require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require("../Model/UserModel")
const mentorshipController= require("../Controller/MentorController");


const nodemailer = require('nodemailer');
// Route to add mentor details
router.post("/add", mentorshipController.addMentorshipDetails);

// Route to get mentorship details by mentorId
router.get("/getallmentor", mentorshipController.getMentorshipDetails);

router.get("/getMentor/:id", mentorshipController.getMentor);



router.post('/notifyMentor', async (req, res) => {
    try {
        const { mentorAddress } = req.body;

        // Fetch mentor details using mentor's email or wallet address
        const mentor = await User.findOne({ email: mentorAddress }); // Change to { email: mentorAddress } if needed
        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }
console.log("Emntor : ",mentor);
        // Nodemailer transport setup
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "dharaneedharanchinnusamy@gmail.com", // Your email
                pass: process.env.PASS, // Use environment variable for security
            },
        });

        // Email options
        const mailOptions = {
            from: "dharaneedharanchinnusamy@gmail.com",
            to: mentor.email, // Corrected
            subject: 'Transaction Completed for Mentorship',
            text: `Hello ${mentor.name},\n\nYour mentorship transaction has been successfully completed.\n\nThank you for your contribution to Skill Exchange!\n\nBest regards,\nSkill Exchange Team`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log("Success: Email sent");

        res.status(200).json({ message: 'Email sent successfully to mentor' });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;


module.exports = router;
