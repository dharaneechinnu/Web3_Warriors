import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthBackground from "@/components/ui/AuthBackground";
import { Heading2, Paragraph, GradientSpan } from "@/components/ui/Typography";

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(79, 70, 229, 0.04));
`;

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
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MessageContainer = styled(motion.div)`
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
  text-align: center;
`;

const ErrorContainer = styled(motion.div)`
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  text-align: center;
`;

const AuthLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const AuthLink = styled(Link)`
  color: rgba(124, 58, 237, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
  
  &:hover {
    color: #7c3aed;
  }
`;

function LoginMentor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const message = location.state?.message;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mentor-home');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      
      // Call the API directly since our AuthContext login expects the full response
      const response = await fetch('http://localhost:3500/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        // Use AuthContext login method
        const loginResult = login(data);
        
        if (loginResult.success) {
          const from = location.state?.from?.pathname || '/mentor-home';
          navigate(from, { replace: true });
        } else {
          setError(loginResult.error || 'Login failed');
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
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
      <LoginCard 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Heading2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Mentor <GradientSpan>Sign In</GradientSpan>
        </Heading2>

        <AnimatePresence>
          {message && (
            <MessageContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {message}
            </MessageContainer>
          )}
          {error && (
            <ErrorContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </ErrorContainer>
          )}
        </AnimatePresence>

        <LoginForm onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          
          <Input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          
          <Button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In as Mentor'}
          </Button>
        </LoginForm>

        <AuthLinks>
          <AuthLink to="/forgot-password">Forgot Password?</AuthLink>
          <AuthLink to="/register/mentor">Create Mentor Account</AuthLink>
          <AuthLink to="/login/learner">Sign in as Learner</AuthLink>
        </AuthLinks>
      </LoginCard>
    </LoginContainer>
  );
}

export default LoginMentor;