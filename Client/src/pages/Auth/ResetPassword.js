import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthBackground from '@/components/ui/AuthBackground';
import { Heading2, Paragraph, GradientSpan } from '@/components/ui/Typography';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(79, 70, 229, 0.04));
`;

const Card = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  position: relative;
  z-index: 1;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const ErrorMessage = styled(motion.div)`
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  text-align: center;
  font-size: 0.9rem;
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
  &:hover { color: #7c3aed; }
`;

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.email && location.state?.otp) {
      setFormData(prev => ({
        ...prev,
        email: location.state.email,
        otp: location.state.otp
      }));
    } else {
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const response = await api.patch('/Auth/resetpass-otp', {
        token: formData.otp,
        pwd: formData.newPassword
      });

      if (response.data.success) {
        navigate('/login/learner', { state: { message: 'Password reset successful! Please login.' } });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <PageContainer>
      <AuthBackground />
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Heading2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Reset <GradientSpan>Password</GradientSpan>
        </Heading2>

        <AnimatePresence>
          {error && (
            <ErrorMessage initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error}
            </ErrorMessage>
          )}
        </AnimatePresence>

        <Form onSubmit={handleSubmit}>
          <Input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            required
            placeholder="Enter new password"
          />

          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            placeholder="Confirm new password"
          />

          <Button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </Form>

        <AuthLinks>
          <AuthLink to="/forgot-password">Back to Forgot Password</AuthLink>
          <AuthLink to="/login/learner">Login as Learner</AuthLink>
          <AuthLink to="/login/mentor">Login as Mentor</AuthLink>
        </AuthLinks>
      </Card>
    </PageContainer>
  );
}

export default ResetPassword;
