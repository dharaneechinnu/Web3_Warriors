import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Animations ────────────────────────────────────────────────────────────────
const gradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// ── Styled Components ─────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  background-size: 200% 200%;
  animation: ${gradientShift} 10s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const Card = styled(motion.div)`
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1);
`;

const LogoWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  border-radius: 1.25rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 0.4rem;
`;

const Subtitle = styled.p`
  color: rgba(255,255,255,0.5);
  text-align: center;
  font-size: 0.9rem;
  margin-bottom: 2rem;
`;

const FieldGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  margin-bottom: 0.5rem;
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconSlot = styled.span`
  position: absolute;
  left: 1rem;
  color: rgba(255,255,255,0.35);
  display: flex;
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 0.75rem;
  color: #fff;
  padding: 0.8rem 1rem 0.8rem 2.8rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder { color: rgba(255,255,255,0.25); }

  &:focus {
    border-color: rgba(139, 92, 246, 0.6);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  }
`;

const ToggleBtn = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  padding: 0;
  display: flex;
  &:hover { color: rgba(255,255,255,0.7); }
`;

const SubmitBtn = styled(motion.button)`
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  border: none;
  border-radius: 0.75rem;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  padding: 0.8rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  color: #fca5a5;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const AdminLogin = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Already logged-in admin → skip login
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleChange = (e) => {
    setError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/Auth/login', {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Server returns { accessToken, user } on success — no `success` flag
      if (!data.accessToken || !data.user) {
        setError(data.message || 'Login failed.');
        return;
      }

      const userRole = data.user?.role || data.role;
      if (userRole !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      login({ accessToken: data.accessToken || data.token, user: data.user });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <LogoWrap>
          <Shield size={32} color="#fff" />
        </LogoWrap>

        <Title>Admin Portal</Title>
        <Subtitle>Sign in with your administrator credentials</Subtitle>

        {error && (
          <ErrorBox
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <AlertCircle size={16} />
            {error}
          </ErrorBox>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Label htmlFor="email">Email address</Label>
            <InputWrap>
              <IconSlot><Mail size={16} /></IconSlot>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </InputWrap>
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="password">Password</Label>
            <InputWrap>
              <IconSlot><Lock size={16} /></IconSlot>
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <ToggleBtn
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </ToggleBtn>
            </InputWrap>
          </FieldGroup>

          <SubmitBtn
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <><Spinner /> Signing in…</> : 'Sign In to Admin Panel'}
          </SubmitBtn>
        </form>
      </Card>
    </PageWrapper>
  );
};

export default AdminLogin;
