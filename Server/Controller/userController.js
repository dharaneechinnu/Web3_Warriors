const User = require("../Model/UserModel");
const CertificationModel = require("../Model/CertificationModel");


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};



const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const dashboardData = {
      name: user.name,
      email: user.email,
      tokens: user.tokens,
      skills: user.skills,
      coursesCompleted: user.coursesCompleted,
      coursesTaught: user.coursesTaught,
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};




const updateUserProfile = async (req, res) => {
  try {
    const {userId} = req.params; 
    console.log(userId)
    const { 
      name, 
      mobileNo, 
      UserWalletAddress, 
      skills, 
      gender, 
      dob, 
      bio, 
      experience, 
      portfolio, 
      linkedin, 
      github, 
      email 
    } = req.body;

    // Find user by ID
    const user = await User.findById({_id:userId});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobileNo) user.mobileNo = mobileNo;
    if (UserWalletAddress) user.UserWalletAddress = UserWalletAddress;
    if (skills) user.skills = skills;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (bio !== undefined) user.bio = bio;
    if (experience !== undefined) user.experience = experience;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;

    // Save updated user details
    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log("Error While Update : ",error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add education to user profile
const addEducation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { institution, degree, field, startYear, endYear, description } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.education.push({
      institution,
      degree,
      field,
      startYear,
      endYear,
      description
    });

    await user.save();
    res.status(200).json({ message: "Education added successfully", education: user.education });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user certifications
const getUserCertifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const certifications = await CertificationModel.find({ userId }).sort({ completedDate: -1 });
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add rating to a mentor
const addRating = async (req, res) => {
  try {
    const { userId } = req.params; // mentor's userId
    const { rating, review, category } = req.body;
    const raterUserId = req.user?._id; // from auth middleware
    const raterEmail = req.user?.email; // from auth middleware

    const mentor = await User.findById(userId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (mentor.role !== 'mentor') {
      return res.status(400).json({ message: "User is not a mentor" });
    }

    // Check if user has already rated this mentor
    const existingRating = mentor.ratings.find(r => 
      r.userId && r.userId.toString() === raterUserId.toString()
    );

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this mentor" });
    }

    // Add new rating
    mentor.ratings.push({
      userId: raterUserId,
      userEmail: raterEmail,
      rating,
      review,
      category
    });

    // Calculate new average rating
    const totalRating = mentor.ratings.reduce((sum, r) => sum + r.rating, 0);
    mentor.averageRating = totalRating / mentor.ratings.length;

    await mentor.save();
    res.status(200).json({ message: "Rating added successfully", averageRating: mentor.averageRating });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user ratings
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('ratings');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.ratings.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { 
  getUserProfile,
  updateUserProfile, 
  getUserDashboard,
  addEducation,
  getUserCertifications,
  addRating,
  getUserRatings
};
