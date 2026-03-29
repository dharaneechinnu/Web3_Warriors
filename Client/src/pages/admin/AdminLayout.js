import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Award,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ── Styled Components ─────────────────────────────────────────────────────────
const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0a0e1a;
`;

/* ── Sidebar ── */
const Sidebar = styled(motion.aside)`
  width: 260px;
  min-height: 100vh;
  background: rgba(15, 23, 42, 0.98);
  border-right: 1px solid rgba(139, 92, 246, 0.15);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
  overflow-y: auto;

  @media (max-width: 768px) {
    transform: translateX(-100%);
    &.open { transform: translateX(0); }
  }
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.75rem 1.5rem 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const BrandIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BrandName = styled.div`
  h2 { color: #fff; font-size: 1rem; font-weight: 700; margin: 0; }
  p  { color: rgba(255,255,255,0.4); font-size: 0.72rem; margin: 0; }
`;

const NavSection = styled.div`
  padding: 1.25rem 0.75rem;
  flex: 1;
`;

const SectionLabel = styled.p`
  color: rgba(255,255,255,0.3);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0 0.75rem;
  margin: 0 0 0.5rem;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  color: rgba(255,255,255,0.55);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 0.2rem;

  svg { flex-shrink: 0; }

  &:hover {
    background: rgba(139, 92, 246, 0.12);
    color: rgba(255,255,255,0.9);
  }

  &.active {
    background: rgba(139, 92, 246, 0.2);
    color: #c4b5fd;
    box-shadow: inset 3px 0 0 #7c3aed;
  }
`;

const NavBadge = styled.span`
  margin-left: auto;
  background: #7c3aed;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
`;

const SidebarFooter = styled.div`
  padding: 1rem 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.06);
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255,255,255,0.04);
  margin-bottom: 0.5rem;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  p:first-child { color: #fff; font-size: 0.85rem; font-weight: 600; margin: 0; }
  p:last-child  { color: rgba(255,255,255,0.4); font-size: 0.72rem; margin: 0; }
`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: none;
  border: none;
  border-radius: 0.75rem;
  color: rgba(255,255,255,0.45);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
`;

/* ── Mobile overlay ── */
const Overlay = styled(motion.div)`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 40;

  @media (max-width: 768px) {
    display: block;
  }
`;

/* ── Main content ── */
const Main = styled.div`
  margin-left: 260px;
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const TopBar = styled.div`
  display: none;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 30;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileMenuBtn = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// ── NAV CONFIG ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/admin/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/mentors',    label: 'Applications', icon: Users           },
  { to: '/admin/nft-mint',   label: 'NFT Mint',     icon: Award           },
];

// ── Component ─────────────────────────────────────────────────────────────────
const AdminLayout = ({ pendingCount = 0 }) => {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  const sidebarContent = (
    <>
      <SidebarBrand>
        <BrandIcon><Shield size={20} color="#fff" /></BrandIcon>
        <BrandName>
          <h2>Admin Panel</h2>
          <p>Mentor Management</p>
        </BrandName>
      </SidebarBrand>

      <NavSection>
        <SectionLabel>Navigation</SectionLabel>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavItem
            key={to}
            to={to}
            end={to === '/admin/dashboard'}
            onClick={() => setMenuOpen(false)}
          >
            <Icon size={18} />
            {label}
            {label === 'Applications' && pendingCount > 0 && (
              <NavBadge>{pendingCount}</NavBadge>
            )}
            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </NavItem>
        ))}
      </NavSection>

      <SidebarFooter>
        <UserCard>
          <Avatar>{initials}</Avatar>
          <UserInfo>
            <p>{user?.name || 'Administrator'}</p>
            <p>{user?.email || ''}</p>
          </UserInfo>
        </UserCard>
        <LogoutBtn onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </LogoutBtn>
      </SidebarFooter>
    </>
  );

  return (
    <Shell>
      {/* Desktop sidebar */}
      <Sidebar>{sidebarContent}</Sidebar>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <Sidebar
              as={motion.aside}
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
              style={{ zIndex: 55 }}
            >
              {sidebarContent}
            </Sidebar>
          </>
        )}
      </AnimatePresence>

      <Main>
        {/* Mobile top bar */}
        <TopBar>
          <MobileMenuBtn onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </MobileMenuBtn>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            Admin Panel
          </span>
          {menuOpen && (
            <MobileMenuBtn onClick={() => setMenuOpen(false)} style={{ marginLeft: 'auto' }}>
              <X size={22} />
            </MobileMenuBtn>
          )}
        </TopBar>

        <ContentArea>
          <Outlet />
        </ContentArea>
      </Main>
    </Shell>
  );
};

export default AdminLayout;
