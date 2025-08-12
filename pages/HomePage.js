"use client";

import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Modal,
  TextField,
  IconButton,
  Paper,
  Fade,
  Backdrop,
  Alert
} from '@mui/material';
import { Close as CloseIcon, PlayArrow, PersonAdd, Login } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleSignup = () => {
    setShowSignupModal(true);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log('Login data:', loginData);
    setShowLoginModal(false);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    // Add signup logic here
    console.log('Signup data:', signupData);
    setShowSignupModal(false);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 0,
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Navigation Bar */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10,
          p: 2 
        }}>
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Game Hub
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Login />}
                  onClick={handleLogin}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'white',
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={handleSignup}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 15,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3rem', md: '4.5rem' },
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(45deg, #fff, #f0f8ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Ultimate Gaming Experience
            </Typography>
            <Typography variant="h5" sx={{ mb: 6, opacity: 0.9, lineHeight: 1.6, maxWidth: '600px', mx: 'auto' }}>
              Join millions of players worldwide. Create games, compete in tournaments, and build your gaming legacy.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 8 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleSignup}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 6,
                  py: 3,
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
                  }
                }}
              >
                Start Playing Now
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLogin}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 6,
                  py: 3,
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  border: '2px solid white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white',
                    transform: 'translateY(-3px)',
                  }
                }}
              >
                I Have an Account
              </Button>
            </Box>
            <Grid container spacing={8} justifyContent="center">
              {[
                { number: '10K+', label: 'Active Players' },
                { number: '500+', label: 'Daily Tournaments' },
                { number: '50+', label: 'Game Modes' }
              ].map((stat, index) => (
                <Grid item key={index}>
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight={700} mb={1}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 10, bgcolor: '#f8fafc' }}>
          <Container maxWidth="lg">
            <Typography variant="h2" textAlign="center" color="text.primary" mb={3}>
              Why Choose Game Hub?
            </Typography>
            <Grid container spacing={5} mt={4}>
              {[
                { icon: '🎮', title: 'Real-time Gaming', desc: 'Experience seamless multiplayer gaming with instant updates and low latency' },
                { icon: '👥', title: 'Social Features', desc: 'Connect with friends, create teams, and build your gaming community' },
                { icon: '🏆', title: 'Competitive Play', desc: 'Join tournaments, climb leaderboards, and prove your skills' },
                { icon: '🎯', title: 'Custom Games', desc: 'Create your own game rooms with custom rules and invite friends' },
                { icon: '📱', title: 'Cross-Platform', desc: 'Play anywhere, anytime on desktop, mobile, or tablet devices' },
                { icon: '🔒', title: 'Secure & Fair', desc: 'Advanced anti-cheat systems and secure matchmaking for fair gameplay' }
              ].map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: 3,
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="h2" mb={2}>
                        {feature.icon}
                      </Typography>
                      <Typography variant="h5" mb={2} color="text.primary">
                        {feature.title}
                      </Typography>
                      <Typography color="text.secondary" lineHeight={1.6}>
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Call to Action Section */}
        <Box
          sx={{
            py: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h2" mb={4} fontWeight={700}>
              Ready to Dominate?
            </Typography>
            <Typography variant="h5" sx={{ mb: 8, opacity: 0.9, lineHeight: 1.6 }}>
              Join the community and start your gaming journey today. It's free!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
              onClick={handleSignup}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 8,
                py: 3,
                fontSize: '1.4rem',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              Create Free Account
            </Button>
          </Container>
        </Box>

        {/* Enhanced Login Modal */}
        <Modal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={showLoginModal}>
            <Box sx={modalStyle}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>Welcome Back!</Typography>
                <IconButton onClick={() => setShowLoginModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box component="form" onSubmit={handleLoginSubmit} sx={{ p: 3 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
                >
                  Login to Game Hub
                </Button>
                <Typography textAlign="center" color="text.secondary">
                  New to Game Hub?{' '}
                  <Typography
                    component="span"
                    color="primary"
                    sx={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    onClick={() => {setShowLoginModal(false); setShowSignupModal(true);}}
                  >
                    Create an account
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Modal>

        {/* Enhanced Signup Modal */}
        <Modal
          open={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={showSignupModal}>
            <Box sx={modalStyle}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>Join the Adventure!</Typography>
                <IconButton onClick={() => setShowSignupModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box component="form" onSubmit={handleSignupSubmit} sx={{ p: 3 }}>
                <TextField
                  fullWidth
                  type="text"
                  label="Username"
                  value={signupData.username}
                  onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                  margin="normal"
                  variant="outlined"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
                >
                  Create My Account
                </Button>
                <Typography textAlign="center" color="text.secondary" fontSize="0.9rem">
                  Already have an account?{' '}
                  <Typography
                    component="span"
                    color="primary"
                    sx={{ cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    onClick={() => {setShowSignupModal(false); setShowLoginModal(true);}}
                  >
                    Sign in here
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Modal>
      </Box>
    </ThemeProvider>
  );
}
