import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const SuccessMessage = styled(motion.div)`
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
  text-align: center;
  font-size: 0.9rem;
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

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const response = await api.post('/Auth/reset-password', { email });
      if (response.data.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your email. Please check your inbox.');
      }
    } catch (err) {
      console.error('OTP generation error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    navigate('/reset-password', { state: { email, otp } });
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
          {otpSent ? 'Enter ' : 'Forgot '}
          <GradientSpan>{otpSent ? 'OTP' : 'Password'}</GradientSpan>
        </Heading2>

        <AnimatePresence>
          {success && (
            <SuccessMessage initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {success}
            </SuccessMessage>
          )}
          {error && (
            <ErrorMessage initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error}
            </ErrorMessage>
          )}
        </AnimatePresence>

        <Form onSubmit={otpSent ? handleVerifyOtp : handleGenerateOtp}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={otpSent}
            placeholder="Enter your email"
          />

          {otpSent && (
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter 4-digit OTP"
              maxLength={4}
            />
          )}

          <Button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? (otpSent ? 'Verifying...' : 'Sending OTP...')
              : (otpSent ? 'Verify & Continue' : 'Send Reset OTP')}
          </Button>
        </Form>

        <AuthLinks>
          <AuthLink to="/login/learner">Login as Learner</AuthLink>
          <AuthLink to="/login/mentor">Login as Mentor</AuthLink>
        </AuthLinks>
      </Card>
    </PageContainer>
  );
}

export default ForgotPassword;
