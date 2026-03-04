import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Github,
  Linkedin,
  FileText,
  Video,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Bot,
  TrendingUp,
  User,
  Briefcase,
  Award,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  getMentorApplicationById,
  approveMentor,
  rejectMentor,
  retriggerEvaluation,
} from '../../services/adminService';

// ── Styled Components ─────────────────────────────────────────────────────────
const Page = styled.div`color: #fff;`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.45);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.5rem;
  transition: color 0.2s;

  &:hover { color: rgba(255,255,255,0.8); }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const NameBlock = styled.div`
  h1 { font-size: 1.75rem; font-weight: 700; color: #fff; margin: 0 0 0.25rem; }
  p  { color: rgba(255,255,255,0.4); font-size: 0.875rem; margin: 0; }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Btn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${({ $variant }) => {
    if ($variant === 'approve') return `
      background: linear-gradient(135deg,#16a34a,#22c55e);
      color: #fff;
      box-shadow: 0 4px 16px rgba(34,197,94,0.3);
    `;
    if ($variant === 'reject') return `
      background: linear-gradient(135deg,#dc2626,#ef4444);
      color: #fff;
      box-shadow: 0 4px 16px rgba(239,68,68,0.3);
    `;
    return `
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.6);
    `;
  }}
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  margin: 0 0 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const InfoRow = styled.div`
  margin-bottom: 0.9rem;
  &:last-child { margin-bottom: 0; }
`;

const InfoLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.3rem;
`;

const InfoValue = styled.p`
  font-size: 0.875rem;
  color: rgba(255,255,255,0.75);
  margin: 0;
  line-height: 1.6;
`;

const LinkRow = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #67e8f9;
  font-size: 0.875rem;
  text-decoration: none;
  word-break: break-all;

  &:hover { text-decoration: underline; }
`;

const SkillTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const Tag = styled.span`
  background: rgba(139,92,246,0.12);
  color: #c4b5fd;
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
`;

/* AI Score card */
const ScoreHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const ScoreTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
`;

const FinalScoreCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid ${({ $v }) =>
    $v >= 70 ? '#22c55e' : $v >= 40 ? '#f59e0b' : '#ef4444'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 0 20px ${({ $v }) =>
    $v >= 70 ? 'rgba(34,197,94,0.25)' : $v >= 40 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'};

  span:first-child {
    font-size: 1.4rem;
    font-weight: 700;
    color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
    line-height: 1;
  }
  span:last-child {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ScoreMetric = styled.div`
  margin-bottom: 0.85rem;
  &:last-child { margin-bottom: 0; }
`;

const MetricLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;

  span:first-child { color: rgba(255,255,255,0.5); }
  span:last-child  {
    font-weight: 600;
    color: ${({ $v }) => $v >= 70 ? '#4ade80' : $v >= 40 ? '#facc15' : '#f87171'};
  }
`;

const BarTrack = styled.div`
  height: 7px;
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  overflow: hidden;
`;

const BarFill = styled(motion.div)`
  height: 100%;
  border-radius: 999px;
  background: ${({ $v }) =>
    $v >= 70 ? 'linear-gradient(90deg,#16a34a,#4ade80)'
    : $v >= 40 ? 'linear-gradient(90deg,#d97706,#fbbf24)'
    :            'linear-gradient(90deg,#dc2626,#f87171)'};
`;

const RecBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  width: 100%;
  justify-content: center;
  margin: 1rem 0;

  ${({ $rec }) => {
    if ($rec === 'approve') return 'background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);';
    if ($rec === 'reject')  return 'background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);';
    return 'background:rgba(234,179,8,0.15);color:#facc15;border:1px solid rgba(234,179,8,0.3);';
  }}
`;

const ReasonBox = styled.div`
  background: rgba(0,0,0,0.2);
  border-radius: 0.6rem;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.55);
  line-height: 1.6;
  font-style: italic;
`;

const WeightNote = styled.div`
  font-size: 0.72rem;
  color: rgba(255,255,255,0.25);
  text-align: center;
  margin-top: 0.75rem;
`;

const EvalBtns = styled.div`
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
`;

const EvalBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  justify-content: center;
  padding: 0.55rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.45);
  border-radius: 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) { border-color: rgba(139,92,246,0.4); color: #c4b5fd; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  ${({ $status }) => {
    if ($status === 'approved') return 'background:rgba(34,197,94,0.12);color:#4ade80;';
    if ($status === 'rejected') return 'background:rgba(239,68,68,0.12);color:#f87171;';
    return 'background:rgba(234,179,8,0.12);color:#facc15;';
  }}
`;

const ConfirmOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ConfirmDialog = styled(motion.div)`
  background: #1e1b4b;
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 1.25rem;
  padding: 2rem;
  max-width: 420px;
  width: 100%;

  h3 { color: #fff; font-size: 1.15rem; font-weight: 700; margin: 0 0 0.75rem; }
  p  { color: rgba(255,255,255,0.55); font-size: 0.875rem; margin: 0 0 1.5rem; line-height: 1.6; }
`;

const DialogBtns = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Spinner = styled.div`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Skeleton = styled.div`
  height: ${({ $h }) => $h || '1rem'};
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.06);
  animation: pulse 1.5s ease-in-out infinite;
  margin-bottom: ${({ $mb }) => $mb || '0'};
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const MentorApplicationDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [app, setApp]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [confirm, setConfirm]     = useState(null); // 'approve' | 'reject' | null
  const [toast, setToast]         = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMentorApplicationById(id);
      if (!res.success) {
        setError(res.message || 'Failed to load application.');
        return;
      }
      setApp(res.data.application);
    } catch (err) {
      setError('Unexpected error loading application.');
      console.error('[MentorApplicationDetail]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApplication(); }, [id]);

  const handleAction = async (action) => {
    try {
      setActionLoading(action);
      setConfirm(null);
      const res = action === 'approve' ? await approveMentor(id) : await rejectMentor(id);
      if (!res.success) {
        showToast(`Failed: ${res.message}`);
        return;
      }
      showToast(action === 'approve' ? 'Mentor approved successfully!' : 'Application rejected.');
      await loadApplication();
    } catch (err) {
      showToast('Unexpected error. Please try again.');
      console.error('[handleAction]', err);
    } finally {
      setActionLoading('');
    }
  };

  const handleReEvaluate = async () => {
    try {
      setActionLoading('eval');
      const res = await retriggerEvaluation(id);
      if (!res.success) {
        showToast(`Failed: ${res.message}`);
        return;
      }
      showToast('AI re-evaluation triggered. Refresh in a moment to see updated scores.');
    } catch (err) {
      showToast('Failed to trigger re-evaluation.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <Page>
        <BackBtn onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</BackBtn>
        <Card>
          <Skeleton $h="2rem" $mb="0.75rem" style={{ width: '40%' }} />
          <Skeleton $h="1rem" $mb="1.5rem" style={{ width: '60%' }} />
          <Skeleton $h="8rem" />
        </Card>
      </Page>
    );
  }

  if (error || !app) {
    return (
      <Page>
        <BackBtn onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</BackBtn>
        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'#f87171' }}>
            <AlertTriangle size={20} />
            {error || 'Application not found.'}
          </div>
        </Card>
      </Page>
    );
  }

  const ev    = app.aiEvaluation;
  const score = ev?.finalScore ?? null;
  const rec   = ev?.recommendation;

  const METRICS = [
    { label: 'GitHub',   val: ev?.githubScore,   weight: '40%' },
    { label: 'LinkedIn', val: ev?.linkedinScore,  weight: '30%' },
    { label: 'Resume',   val: ev?.resumeScore,    weight: '30%' },
  ];

  return (
    <Page>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 200,
              background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
              color: '#c4b5fd', fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirm && (
          <ConfirmOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConfirmDialog initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h3>{confirm === 'approve' ? 'Approve Mentor?' : 'Reject Application?'}</h3>
              <p>
                {confirm === 'approve'
                  ? `You are about to approve ${app.name} as a mentor. Their account will be granted full mentor access.`
                  : `You are about to reject ${app.name}'s application. They will not receive mentor access.`}
              </p>
              <DialogBtns>
                <Btn
                  $variant="secondary"
                  onClick={() => setConfirm(null)}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </Btn>
                <Btn
                  $variant={confirm}
                  onClick={() => handleAction(confirm)}
                  disabled={!!actionLoading}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {actionLoading === confirm ? <Spinner /> : null}
                  {confirm === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                </Btn>
              </DialogBtns>
            </ConfirmDialog>
          </ConfirmOverlay>
        )}
      </AnimatePresence>

      <BackBtn onClick={() => navigate('/admin/mentors')}>
        <ArrowLeft size={16} /> Back to Applications
      </BackBtn>

      <Header>
        <NameBlock>
          <h1>{app.name}</h1>
          <p>{app.userId?.email || '—'} · Submitted {new Date(app.submittedAt).toLocaleDateString('en-US',{ month:'long',day:'numeric',year:'numeric'})}</p>
        </NameBlock>
        <ActionGroup>
          <StatusBadge $status={app.mentorStatus}>
            {app.mentorStatus === 'approved' && <CheckCircle size={13} />}
            {app.mentorStatus === 'rejected' && <XCircle size={13} />}
            {app.mentorStatus === 'pending'  && <Clock size={13} />}
            {app.mentorStatus}
          </StatusBadge>
          {app.mentorStatus === 'pending' && (
            <>
              <Btn $variant="reject" onClick={() => setConfirm('reject')} disabled={!!actionLoading} whileTap={{ scale: 0.97 }}>
                {actionLoading === 'reject' ? <Spinner /> : <XCircle size={15} />}
                Reject
              </Btn>
              <Btn $variant="approve" onClick={() => setConfirm('approve')} disabled={!!actionLoading} whileTap={{ scale: 0.97 }}>
                {actionLoading === 'approve' ? <Spinner /> : <CheckCircle size={15} />}
                Approve
              </Btn>
            </>
          )}
        </ActionGroup>
      </Header>

      <Grid>
        {/* Left — Application info */}
        <div>
          {/* Profile */}
          <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <CardTitle><User size={16} /> Applicant Profile</CardTitle>
            <InfoRow>
              <InfoLabel>Full Name</InfoLabel>
              <InfoValue>{app.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{app.userId?.email || '—'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Skills</InfoLabel>
              <SkillTags>
                {(app.skills || []).map((s) => <Tag key={s}>{s}</Tag>)}
                {app.skills?.length === 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None listed</span>}
              </SkillTags>
            </InfoRow>
          </Card>

          {/* Experience & Achievements */}
          <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CardTitle><Briefcase size={16} /> Experience & Achievements</CardTitle>
            <InfoRow>
              <InfoLabel>Experience</InfoLabel>
              <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{app.experience || '—'}</InfoValue>
            </InfoRow>
            {app.achievements && (
              <InfoRow>
                <InfoLabel>Achievements</InfoLabel>
                <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{app.achievements}</InfoValue>
              </InfoRow>
            )}
          </Card>

          {/* Links */}
          <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <CardTitle><Award size={16} /> Verification Links</CardTitle>
            {app.githubUrl && (
              <InfoRow>
                <InfoLabel>GitHub</InfoLabel>
                <LinkRow href={app.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github size={14} /> {app.githubUrl} <ExternalLink size={12} />
                </LinkRow>
              </InfoRow>
            )}
            {app.linkedinUrl && (
              <InfoRow>
                <InfoLabel>LinkedIn</InfoLabel>
                <LinkRow href={app.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin size={14} /> {app.linkedinUrl} <ExternalLink size={12} />
                </LinkRow>
              </InfoRow>
            )}
            {app.resumeUrl && (
              <InfoRow>
                <InfoLabel>Resume</InfoLabel>
                <LinkRow href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <FileText size={14} /> View Resume PDF <ExternalLink size={12} />
                </LinkRow>
              </InfoRow>
            )}
            {app.introVideoUrl && (
              <InfoRow>
                <InfoLabel>Intro Video</InfoLabel>
                <div style={{ 
                  width: '100%', 
                  marginTop: '0.5rem',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <video 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxHeight: '400px',
                      display: 'block',
                      backgroundColor: '#000'
                    }}
                    preload="metadata"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Video load error:', app.introVideoUrl);
                      e.target.style.display = 'none';
                      const errorMsg = document.createElement('div');
                      errorMsg.style.cssText = 'padding: 1rem; color: #ff6b6b; text-align: center; background: rgba(255,107,107,0.1); border-radius: 8px; margin-top: 0.5rem;';
                      errorMsg.innerHTML = `⚠️ Video failed to load. <a href="${app.introVideoUrl}" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Try opening directly</a>`;
                      e.target.parentNode.insertBefore(errorMsg, e.target);
                    }}
                  >
                    <source src={app.introVideoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <LinkRow 
                    href={app.introVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={12} /> Open in new tab
                  </LinkRow>
                </div>
              </InfoRow>
            )}
          </Card>
        </div>

        {/* Right — AI Evaluation */}
        <div>
          <Card
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={{ position: 'sticky', top: '1.5rem' }}
          >
            <ScoreHeader>
              <ScoreTitle><Bot size={16} /> AI Evaluation</ScoreTitle>
              {ev?.evaluatedAt && (
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                  {new Date(ev.evaluatedAt).toLocaleDateString()}
                </span>
              )}
            </ScoreHeader>

            {score !== null ? (
              <>
                <FinalScoreCircle $v={score}>
                  <span>{score}</span>
                  <span>/ 100</span>
                </FinalScoreCircle>

                {METRICS.map(({ label, val, weight }) => (
                  <ScoreMetric key={label}>
                    <MetricLabel $v={val ?? 0}>
                      <span>{label} <span style={{ opacity: 0.4, fontSize:'0.7rem' }}>({weight})</span></span>
                      <span>{val ?? 0}</span>
                    </MetricLabel>
                    <BarTrack>
                      <BarFill
                        $v={val ?? 0}
                        initial={{ width: 0 }}
                        animate={{ width: `${val ?? 0}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </BarTrack>
                  </ScoreMetric>
                ))}

                {rec && (
                  <RecBadge $rec={rec}>
                    <TrendingUp size={14} />
                    AI Recommendation: {rec === 'approve' ? 'Approve' : rec === 'reject' ? 'Reject' : 'Needs Review'}
                  </RecBadge>
                )}

                {ev?.reason && (
                  <ReasonBox>"{ev.reason}"</ReasonBox>
                )}

                <WeightNote>
                  Final = GitHub(40%) + LinkedIn(30%) + Resume(30%)
                </WeightNote>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'2rem', color:'rgba(255,255,255,0.25)' }}>
                <Bot size={40} style={{ margin:'0 auto 0.75rem', opacity: 0.3 }} />
                <p style={{ fontSize:'0.875rem', margin: 0 }}>AI evaluation is in progress…</p>
              </div>
            )}

            <EvalBtns>
              <EvalBtn onClick={handleReEvaluate} disabled={!!actionLoading}>
                {actionLoading === 'eval'
                  ? <Spinner />
                  : <RefreshCw size={13} />
                }
                Re-evaluate
              </EvalBtn>
            </EvalBtns>
          </Card>
        </div>
      </Grid>
    </Page>
  );
};

export default MentorApplicationDetail;
