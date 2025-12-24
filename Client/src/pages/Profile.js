import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import api from '../services/api';

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding-top: 100px;
`;

const ProfileHeader = styled.div`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Avatar = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
`;

const Section = styled.div`
  background: rgba(17, 17, 27, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(124, 58, 237, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #06b6d4, #d946ef, #f97316)'};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem 0.5rem 0.5rem 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  color: white;
  padding: 0.75rem;
  width: 100%;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #d946ef;
  }

  &::placeholder {
    color: rgba(255,255,255,0.5);
  }
`;

const TextArea = styled.textarea`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  color: white;
  padding: 0.75rem;
  width: 100%;
  margin-bottom: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #d946ef;
  }

  &::placeholder {
    color: rgba(255,255,255,0.5);
  }
`;

const StarRating = styled.div`
  display: flex;
  gap: 2px;
  margin: 0.5rem 0;
`;

const Star = styled.span`
  color: ${props => props.filled ? '#fbbf24' : '#374151'};
  font-size: 1.2rem;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
`;

const ShareButton = styled.button`
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
  }
`;

const RatingCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
`;

const CertificationCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const currentUserId = localStorage.getItem('userId');
  const isOwnProfile = !paramUserId || paramUserId === currentUserId;
  const viewingUserId = paramUserId || currentUserId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [],
    education: [],
    experience: '',
    portfolio: '',
    linkedin: '',
    github: ''
  });

  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    startYear: '',
    endYear: '',
    description: ''
  });

  const [newRating, setNewRating] = useState({
    rating: 0,
    review: '',
    category: 'mentorship' // mentorship or course
  });

  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRole] = useState(localStorage.getItem('userRole'));
  const [certifications, setCertifications] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchCertifications();
    fetchRatings();
  }, [fetchProfile, fetchCertifications, fetchRatings]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get(`/User/${viewingUserId}`);
      setProfile(response.data);
      setEditForm({
        name: response.data.name || '',
        email: response.data.email || '',
        bio: response.data.bio || '',
        skills: response.data.skills || [],
        education: response.data.education || [],
        experience: response.data.experience || '',
        portfolio: response.data.portfolio || '',
        linkedin: response.data.linkedin || '',
        github: response.data.github || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [viewingUserId]);

  const fetchCertifications = useCallback(async () => {
    try {
      const response = await api.get(`/User/${viewingUserId}/certifications`);
      setCertifications(response.data);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      setCertifications([]);
    }
  }, [viewingUserId]);

  const fetchRatings = useCallback(async () => {
    try {
      const response = await api.get(`/User/${viewingUserId}/ratings`);
      setRatings(response.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setRatings([]);
    }
  }, [viewingUserId]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/User/profile/${currentUserId}`, editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/User/profile/${currentUserId}/education`, newEducation);
      const updatedEducation = [...editForm.education, newEducation];
      setEditForm({ ...editForm, education: updatedEducation });
      setProfile({ ...profile, education: updatedEducation });
      setNewEducation({ institution: '', degree: '', field: '', startYear: '', endYear: '', description: '' });
      setShowEducationForm(false);
    } catch (error) {
      console.error('Error adding education:', error);
    }
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post(`/User/${viewingUserId}/ratings`, newRating, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRatings();
      setNewRating({ rating: 0, review: '', category: 'mentorship' });
      setShowRatingForm(false);
    } catch (error) {
      console.error('Error adding rating:', error);
    }
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${viewingUserId}`;
    navigator.clipboard.writeText(profileUrl);
    alert('Profile URL copied to clipboard!');
  };

  const renderStars = (rating, clickable = false, onStarClick = null) => {
    return (
      <StarRating>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            filled={star <= rating}
            clickable={clickable}
            onClick={clickable ? () => onStarClick(star) : undefined}
          >
            ★
          </Star>
        ))}
      </StarRating>
    );
  };

  if (loading) {
    return (
      <ProfileContainer>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProfileContainer>
    );
  }

  if (!profile) {
    return (
      <ProfileContainer>
        <div className="container mx-auto px-4 text-center">
          <h1>Profile not found</h1>
        </div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProfileHeader>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex flex-col items-center">
                <Avatar>
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                {isOwnProfile && (
                  <ShareButton onClick={handleShare}>
                    🔗 Share Profile
                  </ShareButton>
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate}>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Full Name"
                    />
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="Email"
                      type="email"
                    />
                    <TextArea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      placeholder="Bio / About yourself"
                    />
                    <Input
                      value={editForm.skills.join(', ')}
                      onChange={(e) => setEditForm({...editForm, skills: e.target.value.split(', ').filter(s => s.trim())})}
                      placeholder="Skills (comma separated)"
                    />
                    <Input
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={editForm.github}
                      onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                      placeholder="GitHub URL"
                    />
                    <Input
                      value={editForm.portfolio}
                      onChange={(e) => setEditForm({...editForm, portfolio: e.target.value})}
                      placeholder="Portfolio URL"
                    />
                    <div>
                      <Button type="submit">Save Changes</Button>
                      <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="text-4xl font-bold">{profile.name}</h1>
                      {isOwnProfile && (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                      )}
                    </div>
                    
                    <p className="text-xl text-gray-300 mb-2">{profile.role?.charAt(0)?.toUpperCase() + profile.role?.slice(1)}</p>
                    <p className="text-gray-400 mb-4">{profile.email}</p>
                    
                    {profile.bio && (
                      <p className="text-gray-300 mb-4">{profile.bio}</p>
                    )}
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-4 mb-4">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          LinkedIn
                        </a>
                      )}
                      {profile.github && (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300">
                          GitHub
                        </a>
                      )}
                      {profile.portfolio && (
                        <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
                          Portfolio
                        </a>
                      )}
                    </div>

                    {profile.role === 'mentor' && (
                      <div>
                        <p className="text-lg">Average Rating: {profile.averageRating || 0}/5</p>
                        {renderStars(Math.round(profile.averageRating || 0))}
                        <p className="text-sm text-gray-400">Total Reviews: {ratings.length}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ProfileHeader>
        </motion.div>

        {/* Education Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Section>
            <div className="flex justify-between items-center mb-4">
              <SectionTitle>Education</SectionTitle>
              {isOwnProfile && (
                <Button onClick={() => setShowEducationForm(!showEducationForm)}>
                  {showEducationForm ? 'Cancel' : 'Add Education'}
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showEducationForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddEducation}
                  className="mb-6 p-4 bg-gray-800 rounded-lg"
                >
                  <Input
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                    placeholder="Institution Name"
                    required
                  />
                  <Input
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                    placeholder="Degree"
                    required
                  />
                  <Input
                    value={newEducation.field}
                    onChange={(e) => setNewEducation({...newEducation, field: e.target.value})}
                    placeholder="Field of Study"
                    required
                  />
                  <div className="flex gap-4 mb-4">
                    <Input
                      value={newEducation.startYear}
                      onChange={(e) => setNewEducation({...newEducation, startYear: e.target.value})}
                      placeholder="Start Year"
                      type="number"
                      required
                    />
                    <Input
                      value={newEducation.endYear}
                      onChange={(e) => setNewEducation({...newEducation, endYear: e.target.value})}
                      placeholder="End Year (or expected)"
                      type="number"
                      required
                    />
                  </div>
                  <TextArea
                    value={newEducation.description}
                    onChange={(e) => setNewEducation({...newEducation, description: e.target.value})}
                    placeholder="Description (optional)"
                  />
                  <Button type="submit">Add Education</Button>
                </motion.form>
              )}
            </AnimatePresence>

            {editForm.education && editForm.education.length > 0 ? (
              editForm.education.map((edu, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-xl font-semibold">{edu.degree} in {edu.field}</h3>
                  <p className="text-lg text-cyan-400">{edu.institution}</p>
                  <p className="text-gray-400">{edu.startYear} - {edu.endYear}</p>
                  {edu.description && <p className="text-gray-300 mt-2">{edu.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No education information added yet.</p>
            )}
          </Section>
        </motion.div>

        {/* Certifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Section>
            <SectionTitle>Platform Certifications</SectionTitle>
            {certifications.length > 0 ? (
              certifications.map((cert, index) => (
                <CertificationCard key={index}>
                  <div>
                    <h3 className="text-xl font-semibold">{cert.courseName}</h3>
                    <p className="text-cyan-400">Completed on {new Date(cert.completedDate).toLocaleDateString()}</p>
                    <p className="text-gray-400">Instructor: {cert.mentorName}</p>
                  </div>
                  <div className="text-2xl">🏆</div>
                </CertificationCard>
              ))
            ) : (
              <p className="text-gray-400">No certifications earned yet.</p>
            )}
          </Section>
        </motion.div>

        {/* Ratings Section (for mentors) */}
        {profile.role === 'mentor' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Section>
              <div className="flex justify-between items-center mb-4">
                <SectionTitle>Reviews & Ratings</SectionTitle>
                {!isOwnProfile && userRole && (
                  <Button onClick={() => setShowRatingForm(!showRatingForm)}>
                    {showRatingForm ? 'Cancel' : 'Add Review'}
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showRatingForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddRating}
                    className="mb-6 p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="mb-4">
                      <label className="block mb-2">Rating:</label>
                      {renderStars(newRating.rating, true, (rating) => setNewRating({...newRating, rating}))}
                    </div>
                    
                    <select
                      value={newRating.category}
                      onChange={(e) => setNewRating({...newRating, category: e.target.value})}
                      className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 mb-4 w-full"
                    >
                      <option value="mentorship">Mentorship</option>
                      <option value="course">Course Teaching</option>
                    </select>

                    <TextArea
                      value={newRating.review}
                      onChange={(e) => setNewRating({...newRating, review: e.target.value})}
                      placeholder="Write your review..."
                      required
                    />
                    <Button type="submit">Submit Review</Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {ratings.length > 0 ? (
                ratings.map((rating, index) => (
                  <RatingCard key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{rating.userEmail || 'Anonymous'}</p>
                        <p className="text-sm text-gray-400">{rating.category} | {new Date(rating.date).toLocaleDateString()}</p>
                      </div>
                      {renderStars(rating.rating)}
                    </div>
                    <p className="text-gray-300">{rating.review}</p>
                  </RatingCard>
                ))
              ) : (
                <p className="text-gray-400">No reviews yet.</p>
              )}
            </Section>
          </motion.div>
        )}

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Section>
            <SectionTitle>Platform Statistics</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.role === 'mentor' ? (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{profile.coursesTaught || 0}</p>
                    <p className="text-gray-400">Courses Taught</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{ratings.length}</p>
                    <p className="text-gray-400">Reviews Received</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{profile.tokenBalance || 0}</p>
                    <p className="text-gray-400">Tokens Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{profile.averageRating?.toFixed(1) || 0}</p>
                    <p className="text-gray-400">Average Rating</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{profile.coursesCompleted || 0}</p>
                    <p className="text-gray-400">Courses Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{certifications.length}</p>
                    <p className="text-gray-400">Certifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{profile.tokenBalance || 0}</p>
                    <p className="text-gray-400">Tokens Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{profile.coursesEnrolled?.length || 0}</p>
                    <p className="text-gray-400">Enrolled Courses</p>
                  </div>
                </>
              )}
            </div>
          </Section>
        </motion.div>
      </div>
    </ProfileContainer>
  );
};

export default Profile;