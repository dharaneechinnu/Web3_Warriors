"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import Button from "./ui/Button"
import styled, { keyframes, css } from "styled-components"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`

const NavbarContainer = styled.header`
  ${props => css`animation: ${fadeIn} 0.6s ease-out;`}
  background: rgba(15, 23, 42, 0.8); // Slate-900 with opacity
  backdrop-filter: blur(10px);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
`

const NavInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  
  span {
    background: linear-gradient(to right, #06b6d4, #d946ef, #f97316); // Cyan to Fuchsia to Orange
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const LogoIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 1.25rem;
  box-shadow: 0 5px 15px rgba(217, 70, 239, 0.4);
`

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    display: none;
  }
`

const NavLink = styled(Link)`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover, &.active {
    color: white;
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }
  
  &:hover:after, &.active:after {
    transform: scaleX(1);
    transform-origin: left;
  }
`

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 1024px) {
    display: none;
  }
`

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 1024px) {
    display: block;
  }
`

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 300px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  z-index: 200;
  padding: 2rem;
  transform: ${(props) => (props.isOpen ? "translateX(0)" : "translateX(100%)")};
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
`

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 3rem;
`

const MobileNavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(217, 70, 239, 0.2);
`

const MobileAuthButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 150;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transition: all 0.3s ease;
`

const UserMenu = styled.div`
  position: relative;
`

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
`

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
`

const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 200px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0.5rem;
  border: 1px solid rgba(217, 70, 239, 0.2);
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transform: ${(props) => (props.isOpen ? "translateY(0)" : "translateY(-10px)")};
  transition: all 0.2s ease;
  z-index: 10;
`

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(217, 70, 239, 0.2);
  }
`

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.25rem 0;
`

const TokenBalance = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: white;
  font-weight: 500;
  
  span {
    background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }
`

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [tokenBalance, setTokenBalance] = useState(0)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsLoggedIn(true)
      // Get user name initial for avatar
      const userId = localStorage.getItem("userId")
      if (userId) {
        // This is just a placeholder. In a real app, you'd fetch the user's name
        setUserName("User")
      }

      // Get token balance
      const tokens = localStorage.getItem("tokencoin")
      if (tokens) {
        setTokenBalance(tokens)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("tokencoin")
    setIsLoggedIn(false)
    navigate("/login")
  }

  return (
    <>
      <NavbarContainer>
        <NavInner>
          <Logo to="/">
            <LogoIcon>W3</LogoIcon>
            <span>Web3Warriors</span>
          </Logo>

          <NavLinks>
            <NavLink to="/" className={location.pathname === "/" ? "active" : ""}>
              Home
            </NavLink>
            {isLoggedIn && (
              <>
                <NavLink to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                  Dashboard
                </NavLink>
              </>
            )}
          </NavLinks>

          {isLoggedIn ? (
            <UserMenu>
              <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <UserAvatar>{userName.charAt(0)}</UserAvatar>
              </UserButton>

              <UserDropdown isOpen={userMenuOpen}>
                <TokenBalance>
                  Balance: <span>{tokenBalance}</span> tokens
                </TokenBalance>
                <DropdownDivider />
                <DropdownItem to="/dashboard">Dashboard</DropdownItem>
                <DropdownDivider />
                <DropdownItem as="button" onClick={handleLogout}>
                  Logout
                </DropdownItem>
              </UserDropdown>
            </UserMenu>
          ) : (
            <AuthButtons>
              <Button variant="secondary" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/register")}>Register</Button>
            </AuthButtons>
          )}

          <MobileMenuButton onClick={() => setMobileMenuOpen(true)}>☰</MobileMenuButton>
        </NavInner>
      </NavbarContainer>

      <Overlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />

      <MobileMenu isOpen={mobileMenuOpen}>
        <CloseButton onClick={() => setMobileMenuOpen(false)}>✕</CloseButton>

        <Logo to="/" onClick={() => setMobileMenuOpen(false)}>
          <LogoIcon>W3</LogoIcon>
          <span>Web3Warriors</span>
        </Logo>

        <MobileNavLinks>
          <MobileNavLink to="/" onClick={() => setMobileMenuOpen(false)}>
            Home
          </MobileNavLink>
          {isLoggedIn && (
            <>
              <MobileNavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/sessions" onClick={() => setMobileMenuOpen(false)}>
                Live Sessions
              </MobileNavLink>
              <MobileNavLink to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                Wallet
              </MobileNavLink>
            </>
          )}
        </MobileNavLinks>

        {isLoggedIn ? (
          <MobileAuthButtons>
            <Button onClick={handleLogout}>Logout</Button>
          </MobileAuthButtons>
        ) : (
          <MobileAuthButtons>
            <Button
              variant="secondary"
              onClick={() => {
                navigate("/login")
                setMobileMenuOpen(false)
              }}
            >
              Login
            </Button>
            <Button
              onClick={() => {
                navigate("/register")
                setMobileMenuOpen(false)
              }}
            >
              Register
            </Button>
          </MobileAuthButtons>
        )}
      </MobileMenu>
    </>
  )
}

export default Navbar
