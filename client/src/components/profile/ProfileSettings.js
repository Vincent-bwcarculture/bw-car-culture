// client/src/components/profile/ProfileSettings.js - COPY WORKING IMAGE UPLOAD PATTERN
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './ProfileSettings.css';

const ProfileSettings = ({ profileData, refreshProfile }) => {
  const { user, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: profileData?.name || '',
    email: profileData?.email || '',
    phone: profileData?.profile?.phone || '',
    bio: profileData?.profile?.bio || '',
    location: profileData?.profile?.location || '',
    dateOfBirth: profileData?.profile?.dateOfBirth ? 
      new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : '',
    firstName: profileData?.profile?.firstName || '',
    lastName: profileData?.profile?.lastName || '',
    gender: profileData?.profile?.gender || '',
    nationality: profileData?.profile?.nationality || '',
    website: profileData?.profile?.website || ''
  });

  // Update form state when profileData changes
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.profile?.phone || '',
        bio: profileData.profile?.bio || '',
        location: profileData.profile?.location || '',
        dateOfBirth: profileData.profile?.dateOfBirth ? 
          new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : '',
        firstName: profileData.profile?.firstName || '',
        lastName: profileData.profile?.lastName || '',
        gender: profileData.profile?.gender || '',
        nationality: profileData.profile?.nationality || '',
        website: profileData.profile?.website || ''
      });
    }
  }, [profileData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // COPIED: Same pattern as working image uploads but for profile text
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Profile update data:', profileForm);

      // COPIED: Same URL pattern as working image uploads (but for profile update)
      const response = await fetch('/user/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileForm)
      });

      console.log('Profile update response status:', response.status);

      // COPIED: Same response handling as working image uploads
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // COPIED: Same JSON parsing as working image uploads
      let result;
      try {
        const text = await response.text();
        console.log('Profile update response text:', text);
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse profile update response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        console.log('Profile update successful:', result.data);
        
        // COPIED: Same data update pattern as working image uploads
        if (refreshProfile) {
          refreshProfile();
        }
        
        // COPIED: Same AuthContext update pattern as working image uploads
        if (user && setUser && result.data.user) {
          setUser({
            ...user,
            name: result.data.user.name,
            profile: result.data.user.profile
          });
          console.log('AuthContext user updated with new profile data');
        }
        
        showMessage('success', 'Profile updated successfully! ✨');
      } else {
        console.error('Profile update failed:', result.message);
        showMessage('error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="psettings-container">
      {/* Success/Error Messages */}
      {message.text && (
        <div className={`psettings-message psettings-message-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Settings Content - Focus on Profile Section Only */}
      <div className="psettings-content">
        <div className="psettings-section">
          <div className="psettings-section-header">
            <h3>Personal Information</h3>
            <p>Update your personal details and contact information</p>
          </div>
          
          <form onSubmit={handleProfileSubmit} className="psettings-form">
            <div className="psettings-form-row">
              <div className="psettings-form-group">
                <label htmlFor="name">Display Name</label>
                <div className="psettings-input-group">
                  <User size={18} />
                  <input
                    id="name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    placeholder="Enter your display name"
                    className="psettings-form-input"
                    required
                  />
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="psettings-input-group">
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    className="psettings-form-input"
                    disabled
                  />
                </div>
                <small className="psettings-form-note">Email cannot be changed</small>
              </div>
            </div>

            <div className="psettings-form-row">
              <div className="psettings-form-group">
                <label htmlFor="firstName">First Name</label>
                <div className="psettings-input-group">
                  <User size={18} />
                  <input
                    id="firstName"
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    placeholder="Enter your first name"
                    className="psettings-form-input"
                  />
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="lastName">Last Name</label>
                <div className="psettings-input-group">
                  <User size={18} />
                  <input
                    id="lastName"
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    placeholder="Enter your last name"
                    className="psettings-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="psettings-form-row">
              <div className="psettings-form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="psettings-input-group">
                  <Phone size={18} />
                  <input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="Enter your phone number"
                    className="psettings-form-input"
                  />
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="location">Location</label>
                <div className="psettings-input-group">
                  <MapPin size={18} />
                  <input
                    id="location"
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                    placeholder="Enter your location"
                    className="psettings-form-input"
                  />
                </div>
              </div>
            </div>

            <div className="psettings-form-row">
              <div className="psettings-form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <div className="psettings-input-group">
                  <Calendar size={18} />
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                    className="psettings-form-input"
                  />
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="gender">Gender</label>
                <div className="psettings-input-group">
                  <User size={18} />
                  <select
                    id="gender"
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                    className="psettings-form-select"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="psettings-form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                className="psettings-form-textarea"
                rows="4"
                maxLength="500"
              />
              <small className="psettings-form-note">
                {profileForm.bio.length}/500 characters
              </small>
            </div>

            <div className="psettings-form-row">
              <div className="psettings-form-group">
                <label htmlFor="website">Website</label>
                <div className="psettings-input-group">
                  <Globe size={18} />
                  <input
                    id="website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                    className="psettings-form-input"
                  />
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="nationality">Nationality</label>
                <div className="psettings-input-group">
                  <MapPin size={18} />
                  <input
                    id="nationality"
                    type="text"
                    value={profileForm.nationality}
                    onChange={(e) => setProfileForm({...profileForm, nationality: e.target.value})}
                    placeholder="Enter your nationality"
                    className="psettings-form-input"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="psettings-btn psettings-btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
