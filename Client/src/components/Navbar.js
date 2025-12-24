"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import styled, { keyframes, css } from "styled-components"
import { useAuth } from "../contexts/AuthContext"
import TokenStorage from "../utils/tokenStorage"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`

const NavbarContainer = styled.header`
  ${props => css`animation: ${fadeIn} 0.6s ease-out;`}
  background: ${props => (props.scrolled ? 'rgba(15, 23, 42, 0.98)' : 'transparent')};
  backdrop-filter: ${props => (props.scrolled ? 'blur(12px)' : 'none')};
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid ${props => (props.scrolled ? 'rgba(255, 255, 255, 0.08)' : 'transparent')};
  box-shadow: ${props => (props.scrolled ? '0 6px 30px rgba(0,0,0,0.45)' : 'none')};
  transition: background 0.25s ease, backdrop-filter 0.25s ease, box-shadow 0.25s ease, border-bottom 0.25s ease;
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

/* Auth buttons removed: login/register are not shown */

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

/* Mobile auth buttons removed */

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

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`

const NotificationButton = styled.button`
  position: relative;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 1024px) {
    display: none;
  }
`

const NotificationBadge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(15, 23, 42, 0.98);
`

const NotificationModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: rgba(17, 17, 27, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 2000;
  overflow: hidden;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`

const NotificationModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.3);
`

const NotificationModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const NotificationModalClose = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`

const NotificationModalContent = styled.div`
  padding: 1.5rem 2rem;
  max-height: calc(80vh - 80px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #06b6d4, #d946ef);
    border-radius: 4px;
  }
`

const NotificationItem = styled.div`
  background: rgba(30, 41, 59, 0.4);
  border-radius: 0.8rem;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => {
    if (props.type === 'feedback') return '#06b6d4';
    if (props.type === 'approval') return '#22c55e';
    if (props.type === 'credential') return '#d946ef';
    return '#f97316';
  }};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateX(5px);
    background: rgba(30, 41, 59, 0.6);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  }
`

const NotificationItemTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.3rem 0;
`

const NotificationItemMessage = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
`

const NotificationItemTime = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`

const EmptyNotifications = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
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
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const { isAuthenticated, user, logout, loading } = useAuth();
  const location = useLocation()
  const navigate = useNavigate()

  // Mock notifications data - replace with actual API call
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "feedback",
      title: "Mentor Feedback Received",
      message: "Dr. Sarah Johnson provided feedback on your React project",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      type: "approval",
      title: "Course Approved",
      message: "Your submission for Node.js Microservices has been approved",
      time: "5 hours ago",
      read: false
    },
    {
      id: 3,
      type: "credential",
      title: "Credential Issued",
      message: "You earned a new credential: React Fundamentals",
      time: "1 day ago",
      read: true
    },
    {
      id: 4,
      type: "tokens",
      title: "Tokens Credited",
      message: "50 tokens credited for completing React Fundamentals",
      time: "1 day ago",
      read: true
    }
  ]);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get user data from auth context or fallback to localStorage
  const userName = user?.name || user?.email?.charAt(0).toUpperCase() || "U";
  const userRole = user?.role || localStorage.getItem('userRole') || 'learner';
  const tokenBalance = user?.tokenBalance || localStorage.getItem('tokencoin') || '0';

  // Keep token balance in sync with storage (for real-time updates)
  const [displayTokenBalance, setDisplayTokenBalance] = useState(tokenBalance);

  useEffect(() => {
    setDisplayTokenBalance(tokenBalance);
  }, [tokenBalance]);

  // Listen for storage changes for real-time balance updates
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'tokencoin') {
        setDisplayTokenBalance(e.newValue || '0');
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    // initialize
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    // Clear all local storage keys related to auth and navigate to landing page
    try {
      TokenStorage.clearAll()
    } catch (err) {
      console.warn('TokenStorage.clearAll() failed', err)
    }

    // Call AuthContext logout (if it exists) to clear any in-memory state
    try { logout(); } catch (err) { /* ignore */ }

    // Ensure user lands on public landing page after logout
    navigate('/landingpage', { replace: true })
  }

  // Only redirect to landing page when user is unauthenticated AND
  // they're trying to access a protected area. Allow public auth routes
  // (login/register/landing/verify) to be visited without redirection.
  useEffect(() => {
    const token = TokenStorage.getToken()

    if (token && isAuthenticated) return // logged in, nothing to do

    const publicPrefixes = [
      '/landingpage',
      '/login',
      '/register',
      '/verify',
      '/reset-password',
      '/forgot-password'
    ]

    const isPublic = publicPrefixes.some(prefix => location.pathname === prefix || location.pathname.startsWith(prefix))

    if (!token || !isAuthenticated) {
      if (!isPublic && location.pathname !== '/landingpage') {
        navigate('/landingpage', { replace: true })
      }
    }
  }, [isAuthenticated, location.pathname])

  return (
    <>
      <NavbarContainer scrolled={scrolled}>
        <NavInner>
          <Logo>
            <LogoIcon>W3</LogoIcon>
            <span>Web3Warriors</span>
          </Logo>

         

          {isAuthenticated && (
            <>
              <NavLinks>
                {userRole === 'mentor' ? (
                  <>
                    <NavLink to="/mentor-home">Home</NavLink>
                    <NavLink to="#" onClick={(e)=>{e.preventDefault(); navigate('/course-upload')}}>Upload</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/learner-home">Home</NavLink>
                    <NavLink to="/learner-dashboard">My Courses</NavLink>
                    <NavLink to="/courses">Browse</NavLink>
                    <NavLink to="#" onClick={(e)=>{e.preventDefault(); navigate('/dashboard', { state: { tab: 'mentorship' } })}}>Mentorship</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                  </>
                )}
                <NavLink to="#" onClick={(e)=>{e.preventDefault(); handleLogout()}}>Logout</NavLink>
              </NavLinks>

              <RightSection>
                <NotificationButton onClick={() => setNotificationOpen(true)}>
                  🔔
                  {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
                </NotificationButton>

                <UserMenu>
                  <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                    <UserAvatar>{userName.charAt(0)}</UserAvatar>
                  </UserButton>

                  <UserDropdown isOpen={userMenuOpen}>
                    <TokenBalance>
                      Balance: <span>{displayTokenBalance}</span> tokens
                    </TokenBalance>
                    <DropdownDivider />
                    <DropdownItem to={user.role === 'mentor' ? '/mentor-profile-dashboard' : '/learner-dashboard'}>
                      {user.role === 'mentor' ? 'My Courses' : 'Learning Dashboard'}
                    </DropdownItem>
                    <DropdownItem to="/profile">Profile</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem as="button" onClick={handleLogout}>
                      Logout
                    </DropdownItem>
                  </UserDropdown>
                </UserMenu>
              </RightSection>
            </>
          )}

          <MobileMenuButton onClick={() => setMobileMenuOpen(true)}>☰</MobileMenuButton>
        </NavInner>
      </NavbarContainer>

      {/* Notification Modal Overlay */}
      <Overlay isOpen={notificationOpen} onClick={() => setNotificationOpen(false)} />

      {/* Notification Modal */}
      <NotificationModal isOpen={notificationOpen}>
        <NotificationModalHeader>
          <NotificationModalTitle>🔔 Notifications</NotificationModalTitle>
          <NotificationModalClose onClick={() => setNotificationOpen(false)}>
            ✕
          </NotificationModalClose>
        </NotificationModalHeader>
        <NotificationModalContent>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                type={notification.type}
                onClick={() => {
                  // Mark as read when clicked
                  setNotifications(notifications.map(n => 
                    n.id === notification.id ? { ...n, read: true } : n
                  ));
                }}
              >
                <NotificationItemTitle>{notification.title}</NotificationItemTitle>
                <NotificationItemMessage>{notification.message}</NotificationItemMessage>
                <NotificationItemTime>{notification.time}</NotificationItemTime>
              </NotificationItem>
            ))
          ) : (
            <EmptyNotifications>No notifications</EmptyNotifications>
          )}
        </NotificationModalContent>
      </NotificationModal>

      <Overlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />

      <MobileMenu isOpen={mobileMenuOpen}>
        <CloseButton onClick={() => setMobileMenuOpen(false)}>✕</CloseButton>

        <Logo>
          <LogoIcon>W3</LogoIcon>
          <span>Web3Warriors</span>
        </Logo>

        <MobileNavLinks>
          <MobileNavLink to={isAuthenticated && userRole !== 'mentor' ? "/learner-home" : "/"} onClick={() => setMobileMenuOpen(false)}>
            Home
          </MobileNavLink>
          {isAuthenticated && userRole === 'mentor' && (
            <>
              <MobileNavLink to="/mentor-home" onClick={() => setMobileMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink to="/course-upload" onClick={() => { setMobileMenuOpen(false); navigate('/course-upload') }}>
                Upload
              </MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </MobileNavLink>
            </>
          )}

          {isAuthenticated && userRole !== 'mentor' && (
            <>
              <MobileNavLink to="/learner-dashboard" onClick={() => setMobileMenuOpen(false)}>
                My Courses
              </MobileNavLink>
              <MobileNavLink to="/courses" onClick={() => setMobileMenuOpen(false)}>
                Browse
              </MobileNavLink>
              <MobileNavLink to="/dashboard" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard', { state: { tab: 'mentorship' } }) }}>
                Mentorship
              </MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </MobileNavLink>
            </>
          )}
        </MobileNavLinks>

       
      </MobileMenu>
    </>
  )
}

export default Navbar
