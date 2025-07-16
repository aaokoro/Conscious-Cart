import { useState } from 'react'
import './Login.css'
import { AUTH_CONFIG, ERROR_MESSAGES } from '../config/constants.js'

// This component shows the login form where users sign in
function Login({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, data.token)

        const userData = {
          email: formData.email,
          name: data.user?.name || formData.email.split('@')[0]
        }

        onLogin(userData)
      } else {
        setError(data.msg || ERROR_MESSAGES.INVALID_CREDENTIALS)
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.')
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
