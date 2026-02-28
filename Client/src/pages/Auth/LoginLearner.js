import React, { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import styled from "styled-components"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { API_BASE_URL } from '../../config';
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import AuthBackground from "../../components/ui/AuthBackground"
import { Heading2, Paragraph, GradientSpan } from "../../components/ui/Typography"

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(79, 70, 229, 0.04));
`

const LoginCard = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(124, 58, 237, 0.12);
  position: relative;
  z-index: 1;
`

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const MessageContainer = styled(motion.div)`
  background: rgba(0,0,0,0.35);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #fff;
`

function LoginLearner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const message = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/Auth/login`, formData);
      if (response.data) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('userType', 'learner');
        // store user name for UI
        try { localStorage.setItem('userName', response.data.user.name || response.data.user.email); } catch (e) { /* ignore */ }
        navigate('/learner-home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <LoginContainer>
      <AuthBackground />
      <LoginCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Heading2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Learner <GradientSpan>Sign In</GradientSpan>
        </Heading2>

        <AnimatePresence>
          {message && <MessageContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{message}</MessageContainer>}
          {error && <MessageContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</MessageContainer>}
        </AnimatePresence>

        <LoginForm onSubmit={handleSubmit}>
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          <Input label="Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
          <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </LoginForm>

        <Paragraph style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link to="/register/learner" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </Paragraph>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginLearner;
