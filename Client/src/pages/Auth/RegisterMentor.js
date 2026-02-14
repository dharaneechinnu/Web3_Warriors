import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import AuthBackground from "../../components/ui/AuthBackground";
import { Heading2, Paragraph, GradientSpan } from "../../components/ui/Typography"

const Container = styled.div`min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden;`
const Card = styled(motion.div)`width:100%;max-width:520px;background:rgba(17,17,27,0.72);backdrop-filter:blur(20px);border-radius:1.5rem;padding:3rem;border:1px solid rgba(124,58,237,0.12);`
const Form = styled.form`display:grid;gap:1rem;`
const Row = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:1rem;@media(max-width:640px){grid-template-columns:1fr}`
const Msg = styled(motion.div)`padding:1rem;border-radius:0.75rem;margin-bottom:1rem;color:#fff;background:rgba(0,0,0,0.35);`

function RegisterMentor(){
  const navigate = useNavigate();
  const [formData,setFormData] = useState({name:'',email:'',password:'',dob:'',gender:'',mobileNo:'',role:'mentor',skills:''});
  const [error,setError] = useState(null);
  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e)=>{
    e.preventDefault();
    try{
      setError(null);setLoading(true);
      const payload = { ...formData };
      await axios.post('http://localhost:3500/Auth/register', payload);
      navigate('/login/mentor', { state: { message: 'Registration successful. Please login.' } });
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
        <Heading2 style={{textAlign:'center',marginBottom:'1.5rem'}}>Mentor <GradientSpan>Register</GradientSpan></Heading2>
        <AnimatePresence>
          {error && <Msg initial={{opacity:0}} animate={{opacity:1}}>{error}</Msg>}
        </AnimatePresence>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          </Row>
          <Row>
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
            <Input label="Mobile Number" type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} required />
          </Row>
          <Row>
            <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} required />
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
          <Input label="Skills (comma separated)" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, Blockchain" />
          <Button type="submit" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</Button>
        </Form>

        <Paragraph style={{textAlign:'center',marginTop:'1rem'}}>Already have an account? <a href="/login/mentor" style={{color:'#7c3aed'}}>Sign in</a></Paragraph>
      </Card>
    </Container>
  )
}

export default RegisterMentor;
