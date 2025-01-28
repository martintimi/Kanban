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

import GoogleIcon from "./img/google-logo.5867462c.svg";
import Github from "./img/aawpwnuou.webp";

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

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithGithub, loading, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    // Full Name validation
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    if (!validateForm()) return;

    const success = await signup({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", sm: "90%", md: "500px" },
          maxWidth: "600px",
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ padding: 3 }}>
            <Box textAlign="center" mb={4}>
              <Header>Personal Kanban Tool</Header>
              <Typography variant="subtitle1">Sign up to continue</Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

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

              <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Confirm Password"
                variant="outlined"
                type="password"
                fullWidth
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                <CustomButton
                  label={loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
                  type="submit"
                  disabled={loading}
                  fullWidth
                  sx={{ width: "500px", mt: 3, mb: 2 }}
                />
              </Box>
            </form>

            <Typography variant="body2" sx={{ color: "gray", textAlign: "center", mb: 2 }}>
              Or continue with:
            </Typography>

            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
              <CustomButton
                label="Google"
                variant="outlined"
                fullWidth
                onClick={handleGoogleSignup}
                disabled={loading}
                startIcon={<img src={GoogleIcon} alt="Google" style={{ width: "23px" }} />}
                sx={{
                  color: "#555555",
                  borderColor: "#cccccc",
                  width: "100%",
                  marginBottom: "0",
                  justifyContent: "flex-center",
                  display: "flex",
                }}
              />

              <CustomButton
                label="Github"
                variant="outlined"
                onClick={handleGithubSignup}
                disabled={loading}
                startIcon={<img src={Github} alt="Github" style={{ width: "39px" }} />}
                sx={{
                  color: "#555555",
                  width: "100%",
                  borderColor: "#cccccc",
                  justifyContent: "flex-center",
                  display: "flex",
                }}
              />
            </Box>

            <Box display="flex" justifyContent="center" mt={3}>
              <Typography
                variant="body2"
                onClick={handleLogin}
                sx={{
                  cursor: "pointer",
                  color: "#0052CC",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Already have an account? Log in
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
