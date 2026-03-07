import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from '../../config';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthBackground from "@/components/ui/AuthBackground";
import { Heading2, Paragraph, GradientSpan } from "@/components/ui/Typography";

const Container = styled.div`min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden;`
const Card = styled(motion.div)`width:100%;max-width:520px;background:rgba(17,17,27,0.72);backdrop-filter:blur(20px);border-radius:1.5rem;padding:3rem;border:1px solid rgba(124,58,237,0.12);`
const Form = styled.form`display:grid;gap:1rem;`
const Row = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:1rem;@media(max-width:640px){grid-template-columns:1fr}`
const Msg = styled(motion.div)`padding:1rem;border-radius:0.75rem;margin-bottom:1rem;color:#fff;background:rgba(0,0,0,0.35);`

function RegisterMentor(){
  const navigate = useNavigate();
  const [formData,setFormData] = useState({name:'',email:'',password:'',dob:'',gender:'',mobileNo:'',role:'mentor'});
  const [error,setError] = useState(null);
  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e)=>{
    e.preventDefault();
    try{
      setError(null);setLoading(true);
      // DOB validation: not future, and age >= 18
      if (!formData.dob) {
        setError('Please enter your date of birth');
        setLoading(false);
        return;
      }
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        setError('Date of birth cannot be in the future');
        setLoading(false);
        return;
      }
      const age = (() => {
        let diff = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) diff--;
        return diff;
      })();
      if (age < 18) {
        setError('You must be at least 18 years old to register');
        setLoading(false);
        return;
      }

      const payload = { ...formData };
      const response = await axios.post(`${API_BASE_URL}/Auth/mentor/register`, payload);
      if (response.data && (response.data.success === true || response.status === 200)) {
        // Redirect to OTP verification page with email
        navigate('/verify/mentor', { state: { email: formData.email, message: response.data.message || 'Registration successful. Enter the OTP sent to your email.' } });
      } else {
        setError(response.data?.message || 'Registration failed');
      }
    }catch(err){
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed');
    }finally{setLoading(false)}
  }

  const handleChange = (e)=>{const {name,value}=e.target; setFormData(prev=>({...prev,[name]:value}));}

  return (
    <Container>
      <AuthBackground />
      <Card initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
        <Heading2 style={{textAlign:'center',marginBottom:'0.5rem'}}>Mentor <GradientSpan>Register</GradientSpan></Heading2>
        <Paragraph style={{textAlign:'center',marginBottom:'1.25rem',color:'rgba(255,255,255,0.8)'}}>Create your mentor account — we'll send an OTP to verify your email.</Paragraph>
        <AnimatePresence>
          {error && <Msg initial={{opacity:0}} animate={{opacity:1}}>{error}</Msg>}
        </AnimatePresence>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required aria-label="Full name" />
            <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required aria-label="Email address" />
          </Row>
          <Row>
            <Input type="password" showToggle name="password" placeholder="Password" value={formData.password} onChange={handleChange} required aria-label="Password" />
            <Input type="tel" name="mobileNo" placeholder="Mobile Number" value={formData.mobileNo} onChange={handleChange} required aria-label="Mobile number" inputMode="tel" />
          </Row>
          <Row>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <label style={{fontSize:'0.875rem',fontWeight:500,color:'rgba(255,255,255,0.9)'}}>Date of Birth</label>
              <Input type="date" name="dob" placeholder="Date of Birth" value={formData.dob} onChange={handleChange} required aria-label="Date of birth" />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <label style={{fontSize:'0.875rem',fontWeight:500,color:'rgba(255,255,255,0.9)'}}>Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange} 
                required
                style={{
                  height:'2.5rem',
                  width:'100%',
                  borderRadius:'0.375rem',
                  border:'1px solid rgba(124,58,237,0.2)',
                  background:'rgba(17,17,27,0.5)',
                  padding:'0 0.75rem',
                  color:'#fff',
                  fontSize:'0.875rem'
                }}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </Row>
          <Button type="submit" disabled={loading} style={{marginTop:'0.25rem'}}>{loading ? 'Creating Account...' : 'Create Account'}</Button>
        </Form>

        <Paragraph style={{textAlign:'center',marginTop:'1rem'}}>Already have an account? <a href="/login/mentor" style={{color:'#7c3aed'}}>Sign in</a></Paragraph>
      </Card>
    </Container>
  )
}

export default RegisterMentor;
