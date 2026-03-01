"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import styled from "styled-components"
import { useAuth } from "../contexts/AuthContext"
import { useNotifications, getNotifMeta } from "../contexts/NotificationContext"
import TokenStorage from "../utils/tokenStorage"

const NavWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: ${props => props.visible ? 'auto' : '6px'};
  transition: height 0.1s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(to right, rgba(6, 182, 212, 0.4), rgba(217, 70, 239, 0.4), rgba(249, 115, 22, 0.4));
    opacity: ${props => props.visible ? 0 : 0.7};
    transition: opacity 0.3s ease;
    z-index: 1001;
  }
`

const NavbarContainer = styled.header`
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(12px);
  padding: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0,0,0,0.40);
  transform: translateY(${props => props.visible ? '0' : '-100%'});
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
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

// ─── Nav Dropdown ────────────────────────────────────────────────────────────
const NavDropdown = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const NavDropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  font-family: inherit;

  &:hover { color: white; }

  svg {
    width: 0.75rem;
    height: 0.75rem;
    transition: transform 0.2s ease;
    transform: ${props => props.open ? 'rotate(180deg)' : 'rotate(0)'};
  }
`

const NavDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 50%;
  transform: translateX(-50%);
  min-width: 210px;
  background: rgba(13, 18, 35, 0.97);
  backdrop-filter: blur(16px);
  border-radius: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.25);
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  padding: 0.5rem;
  z-index: 999;
  opacity: ${props => props.open ? 1 : 0};
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  transform: translateX(-50%) ${props => props.open ? 'translateY(0)' : 'translateY(-8px)'};
  transition: all 0.18s ease;
`

const NavDropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(124, 58, 237, 0.25);
    color: white;
  }
`

const NavDropdownLabel = styled.div`
  padding: 0.4rem 0.9rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
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
  // ── Router & Auth hooks must come first ─────────────────────────────────
  const { isAuthenticated, user, logout, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // ── UI state ─────────────────────────────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null) // 'courses' | 'tools' | 'compete'
  const [navVisible, setNavVisible] = useState(false)
  const hideTimeoutRef = useRef(null)

  const showNav = () => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    setNavVisible(true)
  }

  const hideNav = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setNavVisible(false)
      setOpenDropdown(null)
      setUserMenuOpen(false)
    }, 400)
  }

  const closeDropdowns = () => setOpenDropdown(null)
  const toggleDropdown = (name) => setOpenDropdown(prev => prev === name ? null : name)

  // Close dropdown on click-outside
  const navRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // ── Notifications from centralized context ──
  const {
    notifications, unreadCount, markAsRead, markAllAsRead, getNotificationRoute
  } = useNotifications()

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
      <NavWrapper
        visible={navVisible}
        onMouseEnter={showNav}
        onMouseLeave={hideNav}
      >
      <NavbarContainer scrolled={scrolled} ref={navRef} visible={navVisible}>
        <NavInner>
          <Logo>
            <LogoIcon>B3</LogoIcon>
            <span>Platform</span>
          </Logo>

         

          {isAuthenticated && (
            <>
              <NavLinks>
                {userRole === 'mentor' ? (
                  <>
                    <NavLink to="/mentor-home">Home</NavLink>

                    {/* Courses dropdown */}
                    <NavDropdown>
                      <NavDropdownTrigger open={openDropdown === 'courses'} onClick={() => toggleDropdown('courses')}>
                        Courses <svg viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
                      </NavDropdownTrigger>
                      <NavDropdownMenu open={openDropdown === 'courses'}>
                        <NavDropdownItem to="/course-upload" onClick={closeDropdowns}>➕ Upload Course</NavDropdownItem>
                        <NavDropdownItem to="/mentor/my-courses" onClick={closeDropdowns}>📚 My Courses</NavDropdownItem>
                        <NavDropdownItem to="/mentor/submissions" onClick={closeDropdowns}>📋 Review Submissions</NavDropdownItem>
                      </NavDropdownMenu>
                    </NavDropdown>

                    {/* Tools dropdown */}
                    <NavDropdown>
                      <NavDropdownTrigger open={openDropdown === 'tools'} onClick={() => toggleDropdown('tools')}>
                        Tools <svg viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
                      </NavDropdownTrigger>
                      <NavDropdownMenu open={openDropdown === 'tools'}>
                        <NavDropdownLabel>Manage</NavDropdownLabel>
                        <NavDropdownItem to="/mentor/sessions" onClick={closeDropdowns}>📅 Manage Sessions</NavDropdownItem>
                        <NavDropdownItem to="/mentor/challenges" onClick={closeDropdowns}>🏆 My Challenges</NavDropdownItem>
                        <DropdownDivider />
                        <NavDropdownLabel>Finance</NavDropdownLabel>
                        <NavDropdownItem to="/wallet" onClick={closeDropdowns}>💼 Wallet</NavDropdownItem>
                      </NavDropdownMenu>
                    </NavDropdown>
                  </>
                ) : (
                  <>
                    <NavLink to="/learner-home">Home</NavLink>

                    {/* Courses dropdown */}
                    <NavDropdown>
                      <NavDropdownTrigger open={openDropdown === 'courses'} onClick={() => toggleDropdown('courses')}>
                        Courses <svg viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
                      </NavDropdownTrigger>
                      <NavDropdownMenu open={openDropdown === 'courses'}>
                        <NavDropdownItem to="/courses" onClick={closeDropdowns}>🔍 Browse Courses</NavDropdownItem>
                        <NavDropdownItem to="/learner-dashboard" onClick={closeDropdowns}>📚 My Courses</NavDropdownItem>
                        <NavDropdownItem to="/submissions" onClick={closeDropdowns}>📋 My Submissions</NavDropdownItem>
                      </NavDropdownMenu>
                    </NavDropdown>

                    {/* Compete dropdown */}
                    <NavDropdown>
                      <NavDropdownTrigger open={openDropdown === 'compete'} onClick={() => toggleDropdown('compete')}>
                        Compete <svg viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
                      </NavDropdownTrigger>
                      <NavDropdownMenu open={openDropdown === 'compete'}>
                        <NavDropdownItem to="/challenges" onClick={closeDropdowns}>🏆 Challenges</NavDropdownItem>
                        <NavDropdownItem to="/sessions" onClick={closeDropdowns}>📅 Book a Session</NavDropdownItem>
                        <DropdownDivider />
                        <NavDropdownItem to="/wallet" onClick={closeDropdowns}>💼 Wallet</NavDropdownItem>
                      </NavDropdownMenu>
                    </NavDropdown>
                  </>
                )}
              </NavLinks>

              <RightSection>
                <NotificationButton onClick={() => setNotificationOpen(true)}>
                  🔔
                  {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
                </NotificationButton>

                <UserMenu>
                  <UserButton onClick={() => { setUserMenuOpen(!userMenuOpen); closeDropdowns(); }}>
                    <UserAvatar>{userName.charAt(0).toUpperCase()}</UserAvatar>
                  </UserButton>

                  <UserDropdown isOpen={userMenuOpen}>
                    <TokenBalance>
                      🪙 <span>{displayTokenBalance}</span> tokens
                    </TokenBalance>
                    <DropdownDivider />
                    {userRole === 'mentor' ? (
                      <>
                        <DropdownItem to="/mentor/profile" onClick={() => setUserMenuOpen(false)}>👤 My Profile</DropdownItem>
                        <DropdownItem to="/mentor/sessions" onClick={() => setUserMenuOpen(false)}>📅 Sessions</DropdownItem>
                        <DropdownItem to="/mentor/challenges" onClick={() => setUserMenuOpen(false)}>🏆 Challenges</DropdownItem>
                        <DropdownItem to="/mentor/submissions" onClick={() => setUserMenuOpen(false)}>📋 Submissions</DropdownItem>
                      </>
                    ) : (
                      <>
                        <DropdownItem to="/learner/profile" onClick={() => setUserMenuOpen(false)}>👤 My Profile</DropdownItem>
                        <DropdownItem to="/challenges" onClick={() => setUserMenuOpen(false)}>🏆 Challenges</DropdownItem>
                        <DropdownItem to="/sessions" onClick={() => setUserMenuOpen(false)}>📅 Sessions</DropdownItem>
                        <DropdownItem to="/submissions" onClick={() => setUserMenuOpen(false)}>📋 Submissions</DropdownItem>
                      </>
                    )}
                    <DropdownDivider />
                    <DropdownItem as="button" onClick={handleLogout} style={{width:'100%', textAlign:'left', cursor:'pointer'}}>🚪 Logout</DropdownItem>
                  </UserDropdown>
                </UserMenu>
              </RightSection>
            </>
          )}

          <MobileMenuButton onClick={() => setMobileMenuOpen(true)}>☰</MobileMenuButton>
        </NavInner>
      </NavbarContainer>
      </NavWrapper>

      {/* Notification Modal Overlay */}
      <Overlay isOpen={notificationOpen} onClick={() => setNotificationOpen(false)} />

      {/* Notification Modal */}
      <NotificationModal isOpen={notificationOpen}>
        <NotificationModalHeader>
          <NotificationModalTitle>🔔 Notifications</NotificationModalTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: 'none',
                  borderRadius: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.72rem',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
            <NotificationModalClose onClick={() => setNotificationOpen(false)}>
              ✕
            </NotificationModalClose>
          </div>
        </NotificationModalHeader>
        <NotificationModalContent>
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const meta = getNotifMeta(notification.type);
              return (
              <NotificationItem 
                key={notification._id} 
                type={notification.type}
                style={{ 
                  opacity: notification.isRead ? 0.6 : 1, 
                  cursor: 'pointer',
                  borderLeftColor: meta.color
                }}
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification._id);
                  const route = getNotificationRoute(notification);
                  if (route) {
                    setNotificationOpen(false);
                    navigate(route);
                  }
                }}
              >
                <NotificationItemTitle>
                  {!notification.isRead && <span style={{ color: meta.color, marginRight: '0.3rem' }}>●</span>}
                  <span style={{ marginRight: '0.4rem' }}>{meta.icon}</span>
                  {notification.title}
                </NotificationItemTitle>
                <NotificationItemMessage>{notification.message}</NotificationItemMessage>
                <NotificationItemTime>
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                </NotificationItemTime>
              </NotificationItem>
              );
            })
          ) : (
            <EmptyNotifications>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔔</div>
              <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>No notifications yet</div>
              <div style={{ fontSize: '0.85rem' }}>You'll see updates about sessions, challenges, and more here</div>
            </EmptyNotifications>
          )}
        </NotificationModalContent>
      </NotificationModal>

      <Overlay isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />

      <MobileMenu isOpen={mobileMenuOpen}>
        <CloseButton onClick={() => setMobileMenuOpen(false)}>✕</CloseButton>

        <Logo to="/" style={{marginBottom: '0.5rem'}}>
          <LogoIcon>B3</LogoIcon>
          <span>Platform</span>
        </Logo>

        {isAuthenticated && (
          <div style={{padding:'0.5rem 0.75rem', background:'rgba(124,58,237,0.15)', borderRadius:'0.5rem', marginBottom:'0.5rem', fontSize:'0.85rem', color:'rgba(255,255,255,0.7)'}}>
            🪙 {displayTokenBalance} tokens
          </div>
        )}

        <MobileNavLinks>
          {isAuthenticated && userRole === 'mentor' ? (
            <>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', paddingBottom:'0.25rem'}}>Main</div>
              <MobileNavLink to="/mentor-home" onClick={() => setMobileMenuOpen(false)}>🏠 Home</MobileNavLink>
              <MobileNavLink to="/mentor/profile" onClick={() => setMobileMenuOpen(false)}>👤 My Profile</MobileNavLink>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', padding:'0.75rem 0 0.25rem'}}>Courses</div>
              <MobileNavLink to="/course-upload" onClick={() => setMobileMenuOpen(false)}>➕ Upload Course</MobileNavLink>
              <MobileNavLink to="/mentor/my-courses" onClick={() => setMobileMenuOpen(false)}>📚 My Courses</MobileNavLink>
              <MobileNavLink to="/mentor/submissions" onClick={() => setMobileMenuOpen(false)}>📋 Review Submissions</MobileNavLink>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', padding:'0.75rem 0 0.25rem'}}>Tools</div>
              <MobileNavLink to="/mentor/sessions" onClick={() => setMobileMenuOpen(false)}>📅 Manage Sessions</MobileNavLink>
              <MobileNavLink to="/mentor/challenges" onClick={() => setMobileMenuOpen(false)}>🏆 My Challenges</MobileNavLink>
              <MobileNavLink to="/wallet" onClick={() => setMobileMenuOpen(false)}>💼 Wallet</MobileNavLink>
            </>
          ) : isAuthenticated ? (
            <>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', paddingBottom:'0.25rem'}}>Main</div>
              <MobileNavLink to="/learner-home" onClick={() => setMobileMenuOpen(false)}>🏠 Home</MobileNavLink>
              <MobileNavLink to="/learner/profile" onClick={() => setMobileMenuOpen(false)}>👤 My Profile</MobileNavLink>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', padding:'0.75rem 0 0.25rem'}}>Courses</div>
              <MobileNavLink to="/courses" onClick={() => setMobileMenuOpen(false)}>🔍 Browse Courses</MobileNavLink>
              <MobileNavLink to="/learner-dashboard" onClick={() => setMobileMenuOpen(false)}>📚 My Courses</MobileNavLink>
              <MobileNavLink to="/submissions" onClick={() => setMobileMenuOpen(false)}>📋 My Submissions</MobileNavLink>
              <div style={{fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', padding:'0.75rem 0 0.25rem'}}>Compete</div>
              <MobileNavLink to="/challenges" onClick={() => setMobileMenuOpen(false)}>🏆 Challenges</MobileNavLink>
              <MobileNavLink to="/sessions" onClick={() => setMobileMenuOpen(false)}>📅 Book a Session</MobileNavLink>
              <MobileNavLink to="/wallet" onClick={() => setMobileMenuOpen(false)}>💼 Wallet</MobileNavLink>
            </>
          ) : (
            <MobileNavLink to="/landingpage" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
          )}

          {isAuthenticated && (
            <>
              <div style={{height:'1px', background:'rgba(255,255,255,0.1)', margin:'0.75rem 0'}} />
              <MobileNavLink
                as="button"
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                style={{background:'none', border:'none', textAlign:'left', cursor:'pointer', width:'100%', color:'rgba(239,68,68,0.9)', fontSize:'1.25rem', fontWeight:500, padding:'0.5rem 0'}}
              >
                🚪 Logout
              </MobileNavLink>
            </>
          )}
        </MobileNavLinks>
      </MobileMenu>
    </>
  )
}

export default Navbar
