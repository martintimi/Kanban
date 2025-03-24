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
  Avatar,
  Divider
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
import { useOrganization } from '../context/OrganizationContext';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AuthService } from '../services/auth.service';
import { OrganizationService } from '../services/organization.service';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { storage } from '../firebase/config';

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

const uploadProfilePhoto = async (file) => {
  try {
    // Create a unique file name
    const fileName = `profile_photos/${Date.now()}_${file.name}`;
    const photoRef = storageRef(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(photoRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload profile photo');
  }
};

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: '',
    organizationName: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [inviteUsers, setInviteUsers] = useState([]);

  // Add new state for profile photo and loading states
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = [
    'Account Details',
    'Select Role',
    formData.role === 'admin' ? 'Create Organization' : 'Complete'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === 1) {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase and numbers';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.fullName) {
        errors.fullName = 'Full name is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (step === 1) {
        if (!validateStep(1)) return;
        setStep(2);
      } 
      else if (step === 2) {
        if (!formData.role) {
          showToast('Please select a role', 'error');
          return;
        }
        
        if (formData.role === 'admin') {
          setStep(3);
        } else {
          setIsProcessing(true);
          showToast('Creating your account...', 'info');
          
          // Create account for PM or Developer
          const user = await signup({
            ...formData,
            photoURL,
            profilePhoto
          });
          
          showToast('Account created successfully. Wait for an organization invite.', 'success');
          navigate('/login');
        }
      }
      else if (step === 3) {
        if (!formData.organizationName || !termsAccepted) {
          showToast('Please fill all required fields and accept terms', 'error');
          return;
        }

        setIsProcessing(true);
        showToast('Setting up your organization...', 'info');

        // Create admin account and organization
        const user = await signup({
          ...formData,
          photoURL,
          profilePhoto
        });

        const org = await OrganizationService.createOrganization({
          name: formData.organizationName,
          createdBy: user.uid,
          owner: user.uid,
          logo: photoURL, // Add organization logo
          settings: {
            allowInvites: true,
            defaultRole: 'developer',
            notificationsEnabled: true
          }
        });

        showToast('Organization created successfully!', 'success');
        navigate(`/invite-members/${org.id}`);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      // If we're on step 2 or later and a role is selected, try to preserve it
      let shouldSetRole = step >= 2 && formData.role;
      let selectedRole = formData.role;
      
      const result = await AuthService.loginWithGoogle();
      
      if (result && shouldSetRole) {
        // Update the user's role in Firestore
        const userRef = doc(db, 'users', result.uid);
        await updateDoc(userRef, {
          role: selectedRole,
          roleUpdatedAt: new Date().toISOString()
        });
        showToast(`Your account role is set to ${selectedRole}!`, 'success');
      }
      
      if (result) {
        showToast('Successfully signed in with Google!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      showToast(err.message || 'Failed to sign in with Google', 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      // If we're on step 2 or later and a role is selected, try to preserve it
      let shouldSetRole = step >= 2 && formData.role;
      let selectedRole = formData.role;
      
      const result = await AuthService.loginWithGithub();
      
      if (result && shouldSetRole) {
        // Update the user's role in Firestore
        const userRef = doc(db, 'users', result.uid);
        await updateDoc(userRef, {
          role: selectedRole,
          roleUpdatedAt: new Date().toISOString()
        });
        showToast(`Your account role is set to ${selectedRole}!`, 'success');
      }
      
      if (result) {
        showToast('Successfully signed in with GitHub!', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('GitHub signup error:', err);
      showToast(err.message || 'Failed to sign in with GitHub', 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const photoURL = await uploadProfilePhoto(file);
        setPhotoURL(photoURL);
        setProfilePhoto(file);
      } catch (error) {
        showToast('Failed to upload photo', 'error');
      }
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Card sx={{ 
        maxWidth: 600,
        width: '100%',
        mx: 2,
        boxShadow: 3,
        borderRadius: 2
      }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please fill in the information below
            </Typography>
          </Box>

          <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton component="label">
                        <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                        <AddAPhotoIcon />
                      </IconButton>
                    }
                  >
                    <Avatar
                      src={photoURL}
                      sx={{ width: 100, height: 100 }}
                    />
                  </Badge>
                </Box>

                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}

            {step === 2 && (
              <FormControl fullWidth>
                <InputLabel>Select Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleChange}
                  name="role"
                  required
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="project_manager">Project Manager</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.role === 'admin' 
                    ? 'As admin, you can create and manage organizations' 
                    : 'You will need an invitation to join an organization'}
                </FormHelperText>
              </FormControl>
            )}

            {step === 3 && (
              <>
                <TextField
                  fullWidth
                  label="Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  margin="normal"
                  required
                  helperText="Create your organization"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                    />
                  }
                  label="I accept the terms and conditions"
                />
              </>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              {step > 1 && (
                <Button onClick={handleBack}>
                  Back
                </Button>
              )}
              <Box sx={{ flex: '1 1 auto' }} />
              <LoadingButton
                variant="contained"
                type="submit"
                loading={isProcessing}
                disabled={step === 3 && (!formData.organizationName || !termsAccepted)}
              >
                {step === 3 ? 'Create Account' : 'Next'}
              </LoadingButton>
            </Box>
          </form>

          {step === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <LoadingButton
                    variant="outlined"
                    startIcon={<img src={GoogleLogo} alt="Google" width="20" />}
                    onClick={handleGoogleSignup}
                    loading={loading}
                    sx={{ minWidth: '200px' }}
                  >
                    Continue with Google
                  </LoadingButton>
                </Grid>
                <Grid item>
                  <LoadingButton
                    variant="outlined"
                    startIcon={<img src={GithubLogo} alt="GitHub" width="20" />}
                    onClick={handleGithubSignup}
                    loading={loading}
                    sx={{ minWidth: '200px' }}
                  >
                    Continue with GitHub
                  </LoadingButton>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}