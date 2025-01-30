import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CardContent from '@mui/material/CardContent';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CustomButton from "./CustomButton";
import { useAuth } from "../context/AuthContext";
import { Google as GoogleIcon, GitHub as GitHubIcon, Email as EmailIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import {
  Button,
  Divider,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText
} from "@mui/material";
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import LoadingButton from '@mui/lab/LoadingButton';
import { useToast } from '../context/ToastContext';

const Header = styled(Typography)(({ theme }) => ({
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: "#555555",
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'Raleway',
}));

// Create subtle line animations
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

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGithub, loading, error, setError } = useAuth();
  const [isLoading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const theme = useTheme();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setLoading(true);
    setFormErrors({});

    try {
      await login(formData.email, formData.password);
      showToast('👋 Welcome back!', 'success');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessages = {
        'auth/invalid-credential': '❌ Invalid email or password',
        'auth/user-not-found': '❌ No account found with this email',
        'auth/wrong-password': '❌ Invalid email or password',
        'auth/too-many-requests': '⚠️ Too many failed attempts. Please try again later',
        'auth/user-disabled': '🚫 This account has been disabled',
        'auth/invalid-email': '📧 Please enter a valid email address',
        'auth/network-request-failed': '🌐 Network error. Please check your connection'
      };
      
      showToast(errorMessages[err.code] || '❌ An error occurred during sign in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/sign_up');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('🎉 Successfully logged in with Google!', 'success');
    } catch (err) {
      setError('❌ Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGithub();
      showToast('🎉 Successfully logged in with GitHub!', 'success');
    } catch (err) {
      setError('❌ Unable to sign in with GitHub. Please try again.');
    } finally {
      setLoading(false);
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
          position: 'relative',
          zIndex: 1,
          p: 3
        }}
      >
        <Card
          elevation={12}
          sx={{
            maxWidth: 400,
            width: '100%',
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  margin: '0 auto 16px',
                  bgcolor: 'primary.main'
                }}
              >
                <EmailIcon />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please sign in to continue
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  width: '100%',
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
                onClose={() => setError(null)}
                variant="filled"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                type="email"
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />

              <FormControl variant="outlined" fullWidth sx={{ mt: 2 }} required>
                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                <OutlinedInput
                  id="outlined-adornment-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
                {formErrors.password && (
                  <FormHelperText error>{formErrors.password}</FormHelperText>
                )}
              </FormControl>

              <LoadingButton
                fullWidth
                variant="contained"
                type="submit"
                loading={isLoading || loading}
                loadingPosition="center"
                loadingIndicator={
                  <CircularProgress
                    size={24}
                    sx={{
                      color: theme.palette.primary.light,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                }
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  height: 46,
                  position: 'relative'
                }}
              >
                Sign In
              </LoadingButton>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <LoadingButton
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                loading={loading}
                loadingPosition="start"
                disabled={isLoading}
                sx={{ height: 46 }}
              >
                Google
              </LoadingButton>
              <LoadingButton
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                onClick={handleGithubLogin}
                loading={loading}
                loadingPosition="start"
                disabled={isLoading}
                sx={{ height: 46 }}
              >
                GitHub
              </LoadingButton>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/sign_up"
                  style={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none'
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
