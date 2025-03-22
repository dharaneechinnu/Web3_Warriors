const User = require("../Model/UserModel");


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
    const { name, mobileNo, UserWalletAddress, skills, gender, dob } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (mobileNo) user.mobileNo = mobileNo;
    if (UserWalletAddress) user.UserWalletAddress = UserWalletAddress;
    if (skills) user.skills = skills;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;

    // Save updated user details
    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log("Error While Update : ",error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { getUserProfile,updateUserProfile, getUserDashboard };
