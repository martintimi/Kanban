import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CustomButton from "./CustomButton";
import { useAuth } from "../context/AuthContext";
import MenuItem from "@mui/material/MenuItem";
import {
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  Grid,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Button,
  Badge,
  Avatar
} from '@mui/material';
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  AddAPhoto as AddAPhotoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import LoadingButton from '@mui/lab/LoadingButton';
import { keyframes } from '@mui/system';

import GoogleLogo from "./img/google-logo.5867462c.svg";
import GithubLogo from "./img/aawpwnuou.webp";

// Create animated background
const movingLines = keyframes`
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
`;

const AnimatedBackground = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#ffffff',
  backgroundImage: `
    linear-gradient(45deg, rgba(0, 72, 186, 0.3) 2px, transparent 2px),
    linear-gradient(135deg, rgba(0, 72, 186, 0.3) 2px, transparent 2px)
  `,
  backgroundSize: '30px 30px',
  animation: `${movingLines} 30s linear infinite`,
  opacity: 1,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.7) 100%)',
    pointerEvents: 'none'
  }
}));

const Header = styled(Typography)(({ theme }) => ({
  fontSize: "1.25rem",
  fontWeight: "bold",
  color: "#555555",
  textAlign: "center",
  marginBottom: theme.spacing(2),
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontFamily: "Raleway",
}));

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;
  return strength;
};

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithGithub, loading: authLoading, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developer",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { showToast } = useToast();

  const steps = [
    'Account Details',
    'Personal Information',
    'Preferences'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 1:
        if (formData.phone && !/^\+?[\d\s-]+$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        }
        break;
      case 2:
        if (!termsAccepted) {
          newErrors.terms = 'Please accept the terms and conditions';
        }
        break;
      default:
        break;
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < steps.length - 1) {
      if (validateStep(step)) {
        setStep(prev => prev + 1);
      }
      return;
    }

    if (!validateStep(step)) return;

    try {
      setLoading(true);
      setError(null);
      
      const success = await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        photoURL: avatarPreview,
        phone: formData.phone
      });

      showToast('🎉 Account created successfully!', 'success');
      navigate("/dashboard");
    } catch (err) {
      console.error('Signup error:', err);
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          showToast('❌ This email is already registered. Please use a different email or try logging in.', 'error');
          setFormErrors(prev => ({
            ...prev,
            email: 'Email is already in use'
          }));
          setStep(0); // Go back to first step
          break;
        case 'auth/invalid-email':
          showToast('❌ Please enter a valid email address', 'error');
          break;
        case 'auth/operation-not-allowed':
          showToast('❌ Email/password accounts are not enabled. Please contact support.', 'error');
          break;
        case 'auth/weak-password':
          showToast('❌ Please choose a stronger password', 'error');
          break;
        default:
          showToast('❌ Failed to create account. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleGoogleSignup = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGithubSignup = async () => {
    const success = await loginWithGithub();
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleClickShowPassword = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Card
          elevation={12}
          sx={{
            maxWidth: 600,
            width: '100%',
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ 
              mb: 3, 
              textAlign: 'center',
              backgroundColor: 'white',
              opacity: 1
            }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  margin: '0 auto 16px',
                  bgcolor: 'primary.main',
                  opacity: 1
                }}
              >
                <EmailIcon />
              </Avatar>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ opacity: 1, color: 'text.primary' }}
              >
                Create Account
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ opacity: 1 }}
              >
                Please fill in the information below
              </Typography>
            </Box>

            <Stepper 
              activeStep={step} 
              sx={{ 
                mb: 4,
                backgroundColor: 'white',
                opacity: 1
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={handleSubmit}>
              {step === 0 && (
                <>
                  <TextField
                    label="Full Name"
                    variant="outlined"
                    fullWidth
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={!!formErrors.fullName}
                    helperText={formErrors.fullName}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Email Address"
                    variant="outlined"
                    type="email"
                    fullWidth
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    sx={{ mb: 2 }}
                  />

                  <FormControl variant="outlined" fullWidth sx={{ mt: 2 }} required>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!formErrors.password}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword('password')}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Password"
                      onFocus={() => setShowPasswordHints(true)}
                    />
                    {showPasswordHints && (
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Password strength: {strengthLabels[passwordStrength]}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(passwordStrength / 4) * 100}
                          sx={{
                            mt: 1,
                            mb: 2,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 
                                passwordStrength <= 1 ? 'error.main' :
                                passwordStrength === 2 ? 'warning.main' :
                                passwordStrength === 3 ? 'info.main' :
                                'success.main'
                            }
                          }}
                        />
                        <Typography variant="caption" component="div" color="text.secondary">
                          Password must contain:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                          <Typography variant="caption" component="li" color={/[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary'}>
                            At least one uppercase letter
                          </Typography>
                          <Typography variant="caption" component="li" color={/[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary'}>
                            At least one number
                          </Typography>
                          <Typography variant="caption" component="li" color={/[!@#$%^&*]/.test(formData.password) ? 'success.main' : 'text.secondary'}>
                            At least one special character
                          </Typography>
                          <Typography variant="caption" component="li" color={formData.password.length >= 8 ? 'success.main' : 'text.secondary'}>
                            Minimum 8 characters
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {formErrors.password && (
                      <FormHelperText error>{formErrors.password}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl variant="outlined" fullWidth sx={{ mt: 2 }} required>
                    <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
                    <OutlinedInput
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!formErrors.confirmPassword}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword('confirm')}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Confirm Password"
                    />
                    {formErrors.confirmPassword && (
                      <FormHelperText error>{formErrors.confirmPassword}</FormHelperText>
                    )}
                  </FormControl>
                </>
              )}

              {step === 1 && (
                <>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <input
                      accept="image/*"
                      type="file"
                      id="avatar-upload"
                      hidden
                      onChange={handleAvatarChange}
                    />
                    <label htmlFor="avatar-upload">
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <IconButton component="span">
                            <AddAPhotoIcon />
                          </IconButton>
                        }
                      >
                        <Avatar
                          src={avatarPreview}
                          sx={{ width: 100, height: 100, cursor: 'pointer' }}
                        />
                      </Badge>
                    </label>
                  </Box>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    margin="normal"
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      onChange={handleChange}
                      name="role"
                    >
                      <MenuItem value="developer">Developer</MenuItem>
                      <MenuItem value="project_manager">Project Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                    }
                    label="I accept the terms and conditions"
                  />
                </>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                {step > 0 && (
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                )}
                <Box sx={{ flex: '1 1 auto' }} />
                <LoadingButton
                  variant="contained"
                  type="submit"
                  loading={loading || authLoading}
                >
                  {step < steps.length - 1 ? 'Next' : 'Create Account'}
                </LoadingButton>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
