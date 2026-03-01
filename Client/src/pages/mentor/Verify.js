import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import axios from 'axios'
import { API_BASE_URL } from '../../config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthBackground from '@/components/ui/AuthBackground';
import { Heading2, Paragraph, GradientSpan } from '@/components/ui/Typography';

const Container = styled.div`min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden;`
const Card = styled.div`width:100%;max-width:480px;background:rgba(17,17,27,0.72);backdrop-filter:blur(20px);border-radius:1rem;padding:2.5rem;border:1px solid rgba(124,58,237,0.12);`

export default function VerifyMentor(){
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.message || null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email missing');
    if (!/^[0-9]{4}$/.test(otp)) return setError('Enter a valid 4-digit OTP');
    try{
      setError(null); setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/Auth/mentor/verify-otp`, { email, otp });
      if (res.data) {
        navigate('/login/mentor', { state: { message: 'Email verified. Please login.' } });
      }
    }catch(err){
      setError(err.response?.data?.message || 'Verification failed');
    }finally{setLoading(false)}
  }

  const resend = async () => {
    if (!email) return setError('Email missing');
    try{
      setError(null);
      const res = await axios.post(`${API_BASE_URL}/Auth/mentor/generate-otp`, { email });
      setMessage(res.data?.message || 'OTP resent');
    }catch(err){
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  }

  return (
    <Container>
      <AuthBackground />
      <Card>
        <Heading2 style={{textAlign:'center',marginBottom:16}}>Verify <GradientSpan>Email</GradientSpan></Heading2>
        {message && <Paragraph style={{color:'#9ae6b4'}}>{message}</Paragraph>}
        {error && <Paragraph style={{color:'#fda4af'}}>{error}</Paragraph>}

        <form onSubmit={handleVerify} style={{display:'grid',gap:12,marginTop:16}}>
          <Input type="email" name="email" placeholder="Email" value={email} disabled />
          <Input name="otp" value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="Enter 4-digit OTP" required />
          <div style={{display:'flex',gap:12}}>
            <Button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</Button>
            <Button type="button" variant="secondary" onClick={resend}>Resend OTP</Button>
          </div>
        </form>
      </Card>
    </Container>
  )
}
