import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from '../../config';
import Web3 from "web3";
import { address } from "../../services/contractAddress";
import { contractabi } from "../../services/abi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthBackground from "@/components/ui/AuthBackground";
import { Heading2, Paragraph, GradientSpan } from "@/components/ui/Typography";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(79, 70, 229, 0.1));
`

/* background replaced by shared AuthBackground component */

const RegisterCard = styled(motion.div)`
  width: 100%;
  max-width: 500px;
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

const RegisterForm = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ButtonRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
`

/* legacy FormRow removed; using FormGrid + Column for layout */

const ErrorContainer = styled(motion.div)`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: rgb(239, 68, 68);
  font-size: 0.875rem;
`

const MessageContainer = styled(motion.div)`
  background: ${props => props.type === 'success' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'};
  border: 1px solid ${props => props.type === 'success' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)'};
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: ${props => props.type === 'success' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'};
  font-size: 0.875rem;
`

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: '',
    mobileNo: '',
    role: 'user'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/Auth/register`, formData);

      // Defensive checks: only treat as success when response.data.success === true
      // and the server message doesn't indicate an existing user (some APIs misuse success flag).
      const msg = response.data?.message || ''
      const looksLikeExists = /exist|already exists|already registered/i.test(msg)

      if (response.data && response.data.success === true && !looksLikeExists) {
        // show success message briefly, then navigate to login with message state
        setSuccess('Registration successful! Redirecting to login...');
        setLoading(false);
        // Attempt react-router navigation first
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        // Fallback: if navigation didn't happen (path unchanged), do a full-page redirect after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 800);
        return;
      }

      // If backend returned a message (e.g. "User with this email already exists"), show it as an error
      if (msg) {
        setError(msg)
        setSuccess(null)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      // leave loading false if we've already set success and are redirecting
      if (!success) setLoading(false);
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
    <RegisterContainer>
      <AuthBackground />
      <RegisterCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Heading2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Create your <GradientSpan>account</GradientSpan>
        </Heading2>
        
        <AnimatePresence mode="wait">
          {success && (
            <MessageContainer
              type="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {success}
            </MessageContainer>
          )}

          {error && (
            <ErrorContainer
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </ErrorContainer>
          )}
        </AnimatePresence>

        <RegisterForm onSubmit={handleSubmit}>
          <FormGrid>
            <Column>
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />

              <Input
                label="Password"
                type="password"
                showToggle
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                required
              />

              <Input
                label="Gender"
                type="select"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Input>
            </Column>

            <Column>
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
                label="Date of Birth"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Mobile Number"
                type="tel"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleInputChange}
                placeholder="Enter your mobile number"
                required
              />
            </Column>
          </FormGrid>

          <ButtonRow>
            <Button type="submit" disabled={loading || success}>
              {loading ? 'Creating Account...' : success ? 'Success' : 'Create Account'}
            </Button>
          </ButtonRow>
        </RegisterForm>

        <Paragraph style={{ textAlign: 'center', marginTop: '2rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </Paragraph>
      </RegisterCard>
    </RegisterContainer>
  );
}

export default Register;
