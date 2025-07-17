import { useState } from 'react'
import './Profile.css'
import { AUTH_CONFIG } from '../config/constants.js'

function Profile({ user, onBack }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    skinType: user?.skinType || 'normal',
    skinConcerns: user?.skinConcerns || [],
    age: user?.age || '',
    allergies: user?.allergies || ''
  })

  const skinTypes = ['normal', 'dry', 'oily', 'combination', 'sensitive']
  const skinConcerns = ['acne', 'aging', 'hyperpigmentation', 'dryness', 'sensitivity', 'redness']

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleConcernToggle = (concern) => {
    setProfileData(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(concern)
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern]
    }))
  }

  const handleSave = async () => {
    try {
      // Get the token from localStorage using the correct key
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);

      // Prepare the data to match the backend model structure
      const profilePayload = {
        skinType: profileData.skinType,
        skinConcerns: profileData.skinConcerns,
        sustainabilityPreference: false // Default value since we don't have this in the form
      };

      // Save profile data to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/skincare-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profilePayload)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        // Update the local state with the response from the server
        setProfileData(updatedProfile);
        setIsEditing(false);

        // Show success message
        alert('Profile updated successfully!');

        // Refresh the page to update recommendations based on new profile
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to update profile: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    }
  }

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      skinType: user?.skinType || 'normal',
      skinConcerns: user?.skinConcerns || [],
      age: user?.age || '',
      allergies: user?.allergies || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h2>Your Profile</h2>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <div className="section-header">
            <h3>Personal Information</h3>
            {!isEditing && (
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label>Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p>{profileData.name || 'Not provided'}</p>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <p>{profileData.email}</p>
            </div>

            <div className="form-group">
              <label>Age</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="13"
                  max="120"
                />
              ) : (
                <p>{profileData.age || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Skin Profile</h3>

          <div className="form-group">
            <label>Skin Type</label>
            {isEditing ? (
              <select
                value={profileData.skinType}
                onChange={(e) => handleInputChange('skinType', e.target.value)}
              >
                {skinTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <p>{profileData.skinType}</p>
            )}
          </div>

          <div className="form-group">
            <label>Skin Concerns</label>
            {isEditing ? (
              <div className="checkbox-group">
                {skinConcerns.map(concern => (
                  <label key={concern} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={profileData.skinConcerns.includes(concern)}
                      onChange={() => handleConcernToggle(concern)}
                    />
                    {concern}
                  </label>
                ))}
              </div>
            ) : (
              <p>{profileData.skinConcerns.length > 0 ? profileData.skinConcerns.join(', ') : 'None selected'}</p>
            )}
          </div>

          <div className="form-group">
            <label>Allergies or Sensitivities</label>
            {isEditing ? (
              <textarea
                value={profileData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="List any known allergies or ingredient sensitivities"
                rows="3"
              />
            ) : (
              <p>{profileData.allergies || 'None reported'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export default Profile
