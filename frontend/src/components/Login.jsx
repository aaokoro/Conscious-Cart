// Import React tools we need
import { useState } from 'react'
import './Login.css'

// This component shows the login form where users sign in
function Login({ onLogin, onSwitchToRegister }) {
  // State to store what user types in the form
  const [formData, setFormData] = useState({
    email: '',    // User's email address
    password: ''  // User's password
  })

  const [error, setError] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  function handleChange(event) {
    const inputName = event.target.name
    const inputValue = event.target.value

    const newFormData = {
      email: formData.email,       
      password: formData.password 
    }

    newFormData[inputName] = inputValue

    setFormData(newFormData)
  }

  async function handleSubmit(event) {
    event.preventDefault() 
    setError('') 
    setIsLoading(true) 

    try {
      if (formData.email && formData.password) {
        const userData = {
          id: 1,
          name: formData.email.split('@')[0], 
          email: formData.email
        }

        localStorage.setItem('authToken', 'demo-token-123')

        onLogin(userData)
      } else {
        setError('Please fill in all fields')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header section with title and description */}
        <div className="login-header">
          <h1>Welcome to Skinfluence</h1>
          <p>Sign in to get personalized skincare recommendations</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Show error message if there is one */}
          {error && <div className="error-message">{error}</div>}

          {/* Email input field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer with link to register */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
export default Login
