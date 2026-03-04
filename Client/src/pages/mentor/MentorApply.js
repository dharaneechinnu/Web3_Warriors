import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Github,
  Linkedin,
  Video,
  FileText,
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { submitMentorApplication, getMyApplication } from '../../services/mentorApplicationService';

// ── Styled Components ─────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  padding: 2rem 1.5rem;
  padding-top: 5rem; /* account for Navbar */

  @media (max-width: 640px) { padding: 1rem; padding-top: 4rem; }
`;

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

const PageTitle = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(to right, #c4b5fd, #67e8f9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 0.5rem;
  }
  p { color: rgba(255,255,255,0.45); font-size: 0.9rem; margin: 0; }
`;

/* Stepper */
const Stepper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2.5rem;
`;

const StepDot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
`;

const DotCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.3s;

  ${({ $state }) => {
    if ($state === 'done')    return 'background:linear-gradient(135deg,#22c55e,#4ade80);color:#fff;';
    if ($state === 'active')  return 'background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;box-shadow:0 0 12px rgba(124,58,237,0.5);';
    return 'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);';
  }}
`;

const StepLabel = styled.span`
  font-size: 0.7rem;
  color: ${({ $active }) => $active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'};
  white-space: nowrap;

  @media (max-width: 480px) { display: none; }
`;

const StepConnector = styled.div`
  height: 2px;
  width: 48px;
  background: ${({ $done }) =>
    $done ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'rgba(255,255,255,0.08)'};
  transition: background 0.3s;
  margin-bottom: 1.3rem;

  @media (max-width: 480px) { width: 24px; }
`;

/* Card */
const FormCard = styled(motion.div)`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 1.5rem;
  padding: 2rem 2.5rem;
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);

  @media (max-width: 640px) { padding: 1.5rem; }
`;

const StepTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const StepSubtitle = styled.p`
  color: rgba(255,255,255,0.4);
  font-size: 0.875rem;
  margin: 0 0 1.75rem;
`;

const FieldGroup = styled.div`
  margin-bottom: 1.4rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin-bottom: 0.5rem;

  span.req { color: #f87171; }
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  color: #fff;
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder { color: rgba(255,255,255,0.2); }
  &:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }

  ${({ $error }) => $error && 'border-color: rgba(239,68,68,0.5) !important;'}
`;

const Textarea = styled.textarea`
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  color: #fff;
  padding: 0.85rem 1rem;
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder { color: rgba(255,255,255,0.2); }
  &:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }

  ${({ $error }) => $error && 'border-color: rgba(239,68,68,0.5) !important;'}
`;

const FieldError = styled.p`
  color: #f87171;
  font-size: 0.78rem;
  margin: 0.35rem 0 0;
`;

/* Skills input */
const SkillsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  padding: 0.6rem;
  min-height: 48px;
  align-items: center;
  cursor: text;
  transition: border-color 0.2s;

  &:focus-within { border-color: rgba(139,92,246,0.5); }
`;

const SkillTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(139,92,246,0.2);
  color: #c4b5fd;
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
`;

const SkillRemoveBtn = styled.button`
  background: none;
  border: none;
  color: rgba(196,181,253,0.6);
  cursor: pointer;
  padding: 0;
  display: flex;
  &:hover { color: #f87171; }
`;

const SkillInput = styled.input`
  background: none;
  border: none;
  color: #fff;
  font-size: 0.875rem;
  outline: none;
  min-width: 120px;
  flex: 1;

  &::placeholder { color: rgba(255,255,255,0.2); }
`;

const AddSkillBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: 1px dashed rgba(139,92,246,0.4);
  color: rgba(196,181,253,0.6);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba(139,92,246,0.8); color: #c4b5fd; }
`;

/* File Upload */
const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  border: 2px dashed rgba(139,92,246,0.3);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover, &.drag-over {
    border-color: rgba(139,92,246,0.7);
    background: rgba(139,92,246,0.05);
  }

  ${({ $hasFile }) => $hasFile && 'border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.04);'}
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
`;

/* Navigation */
const NavRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.06);
`;

const NavBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:disabled { opacity: 0.4; cursor: not-allowed; }

  ${({ $primary }) => $primary
    ? 'background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.35);'
    : 'background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.1);'}
`;

const AlertBox = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: ${({ $type }) => $type === 'error'
    ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'};
  border: 1px solid ${({ $type }) => $type === 'error'
    ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'};
  border-radius: 0.75rem;
  padding: 0.9rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: ${({ $type }) => $type === 'error' ? '#fca5a5' : '#86efac'};
`;

const Spinner = styled.div`
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── STEP DEFINITIONS ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Profile',    icon: User       },
  { label: 'Experience', icon: Briefcase  },
  { label: 'Links',      icon: Github     },
  { label: 'Resume',     icon: FileText   },
];

// ── Component ─────────────────────────────────────────────────────────────────
const MentorApply = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]         = useState(null); // { type, message }
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name:         user?.name || '',
    skills:       [],
    skillInput:   '',
    experience:   '',
    achievements: '',
    githubUrl:    '',
    linkedinUrl:  '',
  });
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [introVideoPreview, setIntroVideoPreview] = useState('');
  const [introVideoDuration, setIntroVideoDuration] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors]        = useState({});
  const fileInputRef               = useRef(null);

  // Check if already applied
  useEffect(() => {
    const check = async () => {
      try {
        const res = await getMyApplication();
        if (res.success && res.data && res.data.application) {
          const status = res.data.application.mentorStatus;
          // allow re-apply when previous application was rejected
          if (status !== 'rejected') {
            navigate('/mentor/application-status', { replace: true });
          }
        }
      } catch {
        // ignore
      } finally {
        setCheckingExisting(false);
      }
    };
    check();
  }, [navigate]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ── Skills tag input ──
  const addSkill = () => {
    const val = form.skillInput.trim();
    if (!val || form.skills.includes(val)) return;
    set('skills', [...form.skills, val]);
    set('skillInput', '');
  };

  const removeSkill = (s) => set('skills', form.skills.filter((x) => x !== s));

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
    if (e.key === 'Backspace' && !form.skillInput && form.skills.length) {
      set('skills', form.skills.slice(0, -1));
    }
  };

  // ── File drop ──
  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setErrors((prev) => ({ ...prev, resume: '' }));
    } else {
      setErrors((prev) => ({ ...prev, resume: 'Only PDF files are accepted.' }));
    }
  };

  // ── Intro video selection & duration check (max 5 minutes) ──
  const handleIntroVideoSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrors((p) => ({ ...p, introVideo: 'Please select a valid video file.' }));
      return;
    }

    // create a temporary object URL to load metadata
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = vid.duration || 0;
      setIntroVideoDuration(duration);
      if (duration > 300) {
        setErrors((p) => ({ ...p, introVideo: 'Video is longer than 5 minutes (max allowed).' }));
        setIntroVideoFile(null);
        setIntroVideoPreview('');
      } else {
        setIntroVideoFile(file);
        setIntroVideoPreview(URL.createObjectURL(file));
        setErrors((p) => ({ ...p, introVideo: '' }));
      }
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      setErrors((p) => ({ ...p, introVideo: 'Unable to read video file metadata.' }));
    };
  };

  // ── Validation per step ──
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.name.trim())           errs.name       = 'Name is required.';
      if (form.skills.length === 0)    errs.skills     = 'Add at least one skill.';
    }
    if (s === 1) {
      if (!form.experience.trim())     errs.experience = 'Experience is required.';
    }
    if (s === 3) {
      if (!resumeFile)                 errs.resume     = 'Resume PDF is required.';
    }
    // intro video optional but if present must be <= 5 minutes
    if (introVideoFile && introVideoDuration > 300) {
      errs.introVideo = 'Intro video must be 5 minutes or shorter.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((p) => Math.min(p + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((p) => Math.max(p - 1, 0));

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setAlert(null);

    try {
      const fd = new FormData();
      fd.append('name',         form.name.trim());
      fd.append('skills',       JSON.stringify(form.skills));
      fd.append('experience',   form.experience.trim());
      fd.append('achievements', form.achievements.trim());
      fd.append('githubUrl',    form.githubUrl.trim());
      fd.append('linkedinUrl',  form.linkedinUrl.trim());
      // If a local intro video was selected, append it. Intro video is optional.
      if (introVideoFile) fd.append('introVideo', introVideoFile);
      fd.append('resume',       resumeFile);

      const res = await submitMentorApplication(fd);

      if (!res.success) {
        setAlert({ type: 'error', message: res.message || 'Submission failed. Please try again.' });
        return;
      }

      navigate('/mentor/application-status', { replace: true });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.message || 'An unexpected error occurred. Please try again.',
      });
      console.error('[MentorApply] handleSubmit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingExisting) {
    return (
      <PageWrapper>
        <Container>
          <div style={{ textAlign:'center', paddingTop:'4rem', color:'rgba(255,255,255,0.4)' }}>
            <Spinner style={{ margin: '0 auto 1rem' }} />
            Loading…
          </div>
        </Container>
      </PageWrapper>
    );
  }

  const stepState = (i) => i < step ? 'done' : i === step ? 'active' : 'idle';

  return (
    <PageWrapper>
      <Container>
        <PageTitle>
          <h1>Apply as a Mentor</h1>
          <p>Complete the form below to submit your mentor application for AI verification</p>
        </PageTitle>

        {/* Stepper */}
        <Stepper>
          {STEPS.map(({ label }, i) => (
            <React.Fragment key={label}>
              <StepDot>
                <DotCircle $state={stepState(i)}>
                  {stepState(i) === 'done' ? <CheckCircle size={16} /> : i + 1}
                </DotCircle>
                <StepLabel $active={i === step}>{label}</StepLabel>
              </StepDot>
              {i < STEPS.length - 1 && <StepConnector $done={i < step} />}
            </React.Fragment>
          ))}
        </Stepper>

        {alert && (
          <AlertBox
            $type={alert.type}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {alert.message}
          </AlertBox>
        )}

        <AnimatePresence mode="wait">
          <FormCard
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {/* ── Step 0: Profile ── */}
            {step === 0 && (
              <>
                <StepTitle><User size={20} /> Personal Info</StepTitle>
                <StepSubtitle>Tell us about yourself and your expertise areas.</StepSubtitle>

                <FieldGroup>
                  <Label htmlFor="name">Full Name <span className="req">*</span></Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    $error={!!errors.name}
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </FieldGroup>

                <FieldGroup>
                  <Label>Skills <span className="req">*</span></Label>
                  <SkillsWrap onClick={() => document.getElementById('skill-input')?.focus()}>
                    {form.skills.map((s) => (
                      <SkillTag key={s}>
                        {s}
                        <SkillRemoveBtn type="button" onClick={() => removeSkill(s)}>
                          <X size={11} />
                        </SkillRemoveBtn>
                      </SkillTag>
                    ))}
                    <SkillInput
                      id="skill-input"
                      value={form.skillInput}
                      onChange={(e) => set('skillInput', e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder={form.skills.length === 0 ? 'Type a skill and press Enter…' : ''}
                    />
                    {form.skillInput && (
                      <AddSkillBtn type="button" onClick={addSkill}>
                        <Plus size={11} /> Add
                      </AddSkillBtn>
                    )}
                  </SkillsWrap>
                  {errors.skills && <FieldError>{errors.skills}</FieldError>}
                  <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.75rem', marginTop:'0.4rem' }}>
                    Press Enter or comma to add each skill
                  </p>
                </FieldGroup>
              </>
            )}

            {/* ── Step 1: Experience ── */}
            {step === 1 && (
              <>
                <StepTitle><Briefcase size={20} /> Experience & Achievements</StepTitle>
                <StepSubtitle>Describe your professional background and notable achievements.</StepSubtitle>

                <FieldGroup>
                  <Label htmlFor="experience">Experience <span className="req">*</span></Label>
                  <Textarea
                    id="experience"
                    rows={5}
                    value={form.experience}
                    onChange={(e) => set('experience', e.target.value)}
                    placeholder="Describe your professional background, years of experience, and areas of expertise…"
                    $error={!!errors.experience}
                  />
                  {errors.experience && <FieldError>{errors.experience}</FieldError>}
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="achievements">Achievements <span style={{ opacity:0.5, fontWeight:400 }}>(optional)</span></Label>
                  <Textarea
                    id="achievements"
                    rows={4}
                    value={form.achievements}
                    onChange={(e) => set('achievements', e.target.value)}
                    placeholder="Awards, certifications, publications, open-source projects, notable contributions…"
                  />
                </FieldGroup>
              </>
            )}

            {/* ── Step 2: Links ── */}
            {step === 2 && (
              <>
                <StepTitle><Github size={20} /> Profile Links</StepTitle>
                <StepSubtitle>Provide your public profiles for AI verification. At least one is recommended.</StepSubtitle>

                <FieldGroup>
                  <Label htmlFor="github">
                    <Github size={14} /> GitHub Profile URL
                  </Label>
                  <Input
                    id="github"
                    value={form.githubUrl}
                    onChange={(e) => set('githubUrl', e.target.value)}
                    placeholder="https://github.com/yourusername"
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="linkedin">
                    <Linkedin size={14} /> LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedin"
                    value={form.linkedinUrl}
                    onChange={(e) => set('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="introVideo">
                    <Video size={14} /> Intro Video <span style={{ opacity:0.5, fontWeight:400 }}>(optional, max 5 min)</span>
                  </Label>

                  <input
                    id="introVideo"
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      handleIntroVideoSelect(f);
                    }}
                    ref={(el) => { /* keep hidden file input if needed */ }}
                  />

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('introVideo')?.click()}
                      style={{ padding: '0.6rem 0.9rem', borderRadius: 8, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)', color:'#fff', border:'none', cursor:'pointer' }}
                    >
                      Select Video
                    </button>
                    <div style={{ color:'rgba(255,255,255,0.7)' }}>
                      {introVideoFile ? (
                        <div style={{ fontSize: '0.9rem' }}>{introVideoFile.name} • {(introVideoDuration || 0).toFixed(1)}s</div>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color:'rgba(255,255,255,0.4)'}}>No file selected</div>
                      )}
                      <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)' }}>Upload a short intro — max 5 minutes</div>
                    </div>
                  </div>

                  {introVideoPreview && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <video src={introVideoPreview} width="320" controls style={{ borderRadius:8, maxWidth:'100%' }} />
                    </div>
                  )}

                  {errors.introVideo && <FieldError>{errors.introVideo}</FieldError>}
                </FieldGroup>
              </>
            )}

            {/* ── Step 3: Resume Upload ── */}
            {step === 3 && (
              <>
                <StepTitle><FileText size={20} /> Upload Resume</StepTitle>
                <StepSubtitle>Upload your CV or resume as a PDF. Max file size: 10 MB.</StepSubtitle>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setErrors((p) => ({ ...p, resume: 'File size must be under 10 MB.' }));
                        return;
                      }
                      setResumeFile(file);
                      setErrors((p) => ({ ...p, resume: '' }));
                    }
                  }}
                />

                {!resumeFile ? (
                  <DropZone
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    $hasFile={false}
                  >
                    <Upload size={32} color="rgba(139,92,246,0.6)" />
                    <div>
                      <p style={{ color:'rgba(255,255,255,0.6)', margin:'0 0 0.25rem', fontWeight:600 }}>
                        Drop your PDF here, or click to browse
                      </p>
                      <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8rem', margin:0 }}>
                        PDF only · Max 10 MB
                      </p>
                    </div>
                  </DropZone>
                ) : (
                  <FileInfo>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <FileText size={18} color="#4ade80" />
                      <div>
                        <p style={{ color:'#fff', fontSize:'0.875rem', fontWeight:600, margin:0 }}>
                          {resumeFile.name}
                        </p>
                        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.75rem', margin:0 }}>
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)',
                        cursor:'pointer', padding:0, display:'flex' }}
                    >
                      <X size={16} />
                    </button>
                  </FileInfo>
                )}

                {errors.resume && <FieldError style={{ marginTop:'0.5rem' }}>{errors.resume}</FieldError>}

                <div style={{ marginTop:'1.5rem', padding:'1rem', background:'rgba(234,179,8,0.07)',
                  border:'1px solid rgba(234,179,8,0.2)', borderRadius:'0.75rem' }}>
                  <p style={{ color:'#fef08a', fontSize:'0.82rem', margin:0, lineHeight:1.6 }}>
                    <strong>What happens after submission:</strong><br />
                    Your application is saved immediately and an AI model (Mistral/LLaMA3 via Ollama)
                    will analyse your GitHub activity, resume content, and profile data.
                    Scores are usually ready within 1–2 minutes. The admin will then review
                    the AI evaluation before making a final decision.
                  </p>
                </div>
              </>
            )}

            {/* Navigation */}
            <NavRow>
              <NavBtn
                type="button"
                onClick={goPrev}
                disabled={step === 0}
                whileTap={{ scale: 0.97 }}
              >
                <ChevronLeft size={16} /> Back
              </NavBtn>

              {step < STEPS.length - 1 ? (
                <NavBtn $primary type="button" onClick={goNext} whileTap={{ scale: 0.97 }}>
                  Continue <ChevronRight size={16} />
                </NavBtn>
              ) : (
                <NavBtn
                  $primary
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  whileTap={{ scale: 0.97 }}
                >
                  {submitting ? <><Spinner /> Submitting…</> : <>Submit Application <CheckCircle size={16} /></>}
                </NavBtn>
              )}
            </NavRow>
          </FormCard>
        </AnimatePresence>
      </Container>
    </PageWrapper>
  );
};

export default MentorApply;
