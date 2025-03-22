const Mentorship = require("../Model/Mentorship");
const userModel = require("../Model/UserModel");

exports.addMentorshipDetails = async (req, res) => {
    try {
        const { mentorId, name, token } = req.body;

        // Check if mentorId exists
        if (!mentorId) {
            return res.status(400).json({ message: "mentorId is required" });
        }

        // Find the mentor by mentorId
        const mentor = await userModel.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        // Create new mentorship record
        const mentorship = new Mentorship({
            mentorId,
            name,
            token
        });

        await mentorship.save();

        res.status(201).json({ message: "Mentorship details added successfully", mentorship });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get mentorship details by mentorId
exports.getMentorshipDetails = async (req, res) => {
    try {
      

        const mentorship = await Mentorship.find();

        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship details not found" });
        }

        res.status(200).json({ mentorship });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// Get mentorship details by mentorId
exports.getMentor = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure id is valid (Optional but recommended)
        if (!id) {
            return res.status(400).json({ message: "Mentor ID is required" });
        }

        const mentorship = await userModel.findOne({ _id: id }); // Corrected query

        if (!mentorship) {
            return res.status(404).json({ message: "Mentorship details not found" });
        }

        res.status(200).json({ mentorship });
    } catch (error) {
        console.error("Error fetching mentor details:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};



