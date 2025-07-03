import { useState } from 'react'

function Profile({ user, onBack }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    skinType: user?.skinType || 'Normal',
    skinConcerns: user?.skinConcerns || [],
    age: user?.age || '',
    allergies: user?.allergies || ''
  })

  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']
  const skinConcerns = ['Acne', 'Aging', 'Dark Spots', 'Dryness', 'Sensitivity', 'Wrinkles', 'Pores']

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

  const handleSave = () => {
    // TODO: Save profile data to backend
    setIsEditing(false)
    console.log('Saving profile data:', profileData)
  }

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      skinType: user?.skinType || 'Normal',
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
