"use client"

import React, { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import styled, { keyframes, css } from "styled-components"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import { Heading2, Paragraph, GradientSpan } from "../../components/ui/Typography"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(79, 70, 229, 0.1));
`

const LoginBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.15), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.15), transparent 40%);
  z-index: 0;
  filter: blur(80px);
`

const LoginCard = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  position: relative;
  z-index: 1;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #4f46e5, #7c3aed);
    border-radius: 1.5rem 1.5rem 0 0;
  }
  
  @media (max-width: 640px) {
    padding: 2rem;
    margin: 1rem;
  }
`

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const MessageContainer = styled(motion.div)`
  background: ${props => props.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: ${props => props.type === 'success' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'};
  font-size: 0.875rem;
`

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const message = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:3500/Auth/login', formData);
      
      if (response.data) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('userRole', response.data.user.role || "user");
        localStorage.setItem('userId', response.data.user._id);
        localStorage.setItem('tokencoin', response.data.user.tokenBalance);
        navigate('/dashboard');
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <LoginContainer>
      <LoginBackground />
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Heading2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Welcome <GradientSpan>back</GradientSpan>
        </Heading2>

        <AnimatePresence mode="wait">
          {message && (
            <MessageContainer
              type="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {message}
            </MessageContainer>
          )}
          
          {error && (
            <MessageContainer
              type="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </MessageContainer>
          )}
        </AnimatePresence>

        <LoginForm onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />
          
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />
          
          <Button
            type="submit"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </LoginForm>

        <Paragraph style={{ textAlign: 'center', marginTop: '2rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </Paragraph>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
