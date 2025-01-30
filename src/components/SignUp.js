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

import GoogleLogo from "./img/google-logo.5867462c.svg";
import GithubLogo from "./img/aawpwnuou.webp";

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
  const { signup, loginWithGoogle, loginWithGithub, loading, error, setError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developer",
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
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 1:
        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        break;
      case 2:
        if (!termsAccepted) {
          showToast('❗ Please accept the terms and conditions', 'error');
          return false;
        }
        break;
      default:
        break;
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    const success = await signup({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (success) {
      navigate("/dashboard");
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
        <Card>
          <CardContent>
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {step === 0 && (
              <form onSubmit={handleSubmit}>
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

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  {step > 0 && (
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                  )}
                  <Box sx={{ flex: '1 1 auto' }} />
                  {step < steps.length - 1 ? (
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <LoadingButton
                      variant="contained"
                      onClick={handleSubmit}
                      loading={loading}
                    >
                      Create Account
                    </LoadingButton>
                  )}
                </Box>
              </form>
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
              {step < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <LoadingButton
                  variant="contained"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Create Account
                </LoadingButton>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
