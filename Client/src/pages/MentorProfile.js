"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import styled, { keyframes, css } from "styled-components"
import { motion } from "framer-motion"
import Web3 from "web3"
import api from "../services/api"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import Badge from "../components/ui/Badge"
import { Heading2, Heading3, Paragraph } from "../components/ui/Typography"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

const ProfileContainer = styled.div`
  padding: 2rem;
  margin-top: 4rem;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  min-height: 100vh;
  background: rgb(15, 23, 42);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const BackgroundGrid = styled.div`
  position: fixed;
  inset: 0;
  background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  pointer-events: none;
`

const BackgroundGradient = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom, rgba(6, 182, 212, 0.2), rgba(217, 70, 239, 0.2), rgba(249, 115, 22, 0.2));
  pointer-events: none;
`

const ProfileCard = styled(Card)`
  animation: ${css`${fadeIn}`} 0.5s ease-out;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`

const ProfileAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  border: 3px solid rgba(255, 255, 255, 0.2);
`

const ProfileInfo = styled.div`
  margin-bottom: 2rem;
`

const ProfileField = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.25rem;
  }
  
  p {
    color: white;
    font-size: 1rem;
  }
`

const SkillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const Skill = styled(Badge)`
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
`

const SuccessMessage = styled.div`
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
`

const MentorProfile = () => {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchMentorProfile()
  }, [])

  const fetchMentorProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`mentorship/getMentor/${id}`)
      setProfile(response.data)
    } catch (err) {
      console.error("Error fetching mentor profile:", err)
      setError("Failed to load mentor profile")
    } finally {
      setLoading(false)
    }
  }

  const transferForMentorship = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!")
        return
      }

      const web3 = new Web3(window.ethereum)
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const accounts = await web3.eth.getAccounts()
      const sender = accounts[0]

      const contractAddress = "YOUR_CONTRACT_ADDRESS"
      const contractABI = [
        {
          constant: false,
          inputs: [
            { name: "_to", type: "address" },
            { name: "_amount", type: "uint256" },
          ],
          name: "transferForMentorship",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ]

      const contract = new web3.eth.Contract(contractABI, contractAddress)
      const amountToSend = web3.utils.toWei("0.01", "ether")

      await contract.methods
        .transferForMentorship(profile.mentorship.walletAddress, amountToSend)
        .send({ from: sender })
      setSuccess("Transaction successful!")

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Transaction failed:", err)
      setError("Transaction failed. Please try again.")
    }
  }

  if (loading && !profile) {
    return (
      <ProfileContainer>
        <BackgroundGrid />
        <BackgroundGradient />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-2xl text-white">Loading...</div>
        </div>
      </ProfileContainer>
    )
  }

  return (
    <ProfileContainer>
      <BackgroundGrid />
      <BackgroundGradient />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <ProfileCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <Heading2>Mentor Profile</Heading2>
            <Button onClick={transferForMentorship}>Pay for Mentorship</Button>
          </div>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <TwoColumnLayout>
            <div>
              <ProfileHeader>
                <ProfileAvatar>
                  {profile?.mentorship?.name ? profile.mentorship.name.charAt(0).toUpperCase() : "M"}
                </ProfileAvatar>
                <Heading3>{profile?.mentorship?.name}</Heading3>
              </ProfileHeader>

              <ProfileField>
                <label>Wallet Address</label>
                <p>{profile?.mentorship?.walletAddress || "Not available"}</p>
              </ProfileField>

              <div style={{ marginTop: "2rem" }}>
                <Button style={{ width: "100%" }} onClick={transferForMentorship}>
                  Book a Session
                </Button>
              </div>
            </div>

            <div>
              <ProfileInfo>
                <ProfileField>
                  <label>Skills</label>
                  <SkillsContainer>
                    {profile?.mentorship?.skills?.map((skill, index) => (
                      <Skill key={index} variant="primary">
                        {skill}
                      </Skill>
                    )) || "No skills listed"}
                  </SkillsContainer>
                </ProfileField>

                <ProfileField>
                  <label>Experience</label>
                  <p>{profile?.mentorship?.experience || "Not specified"}</p>
                </ProfileField>

                <ProfileField>
                  <label>About</label>
                  <p>{profile?.mentorship?.about || "No information provided"}</p>
                </ProfileField>
              </ProfileInfo>

              <div>
                <Heading3>Mentorship Sessions</Heading3>
                <Paragraph>
                  Book a mentorship session with {profile?.mentorship?.name} to get personalized guidance on your learning
                  journey.
                </Paragraph>
              </div>
            </div>
          </TwoColumnLayout>
        </ProfileCard>
      </motion.div>
    </ProfileContainer>
  )
}

export default MentorProfile
