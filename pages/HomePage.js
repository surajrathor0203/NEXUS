"use client";

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGameName, setNewGameName] = useState('');
  const [firebaseError, setFirebaseError] = useState(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    otp: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  useEffect(() => {
    // Check if Firebase is available and initialize connection
    const initializeFirebase = async () => {
      try {
        // Check if firebase modules are available
        await import('firebase/app');
        await import('firebase/database');
        await import('firebase/auth');
        
        const { database, auth } = await import('../firebase/config');
        const { ref, onValue, push, set } = await import('firebase/database');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        setIsFirebaseAvailable(true);
        
        // Listen for auth state changes
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setUserLoading(false);
          if (user) {
            console.log('User logged in:', user.email);
          } else {
            console.log('User logged out');
          }
        });
        
        const gamesRef = ref(database, 'games');
        
        const unsubscribeDB = onValue(gamesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const gamesList = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...value
            }));
            setGameData(gamesList);
          } else {
            setGameData([]);
          }
          setLoading(false);
        });

        return () => {
          unsubscribeAuth();
          unsubscribeDB();
        };
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setFirebaseError(error.message);
        setIsFirebaseAvailable(false);
        setLoading(false);
        setUserLoading(false);
      }
    };

    initializeFirebase();
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  const sendEmailOtp = async () => {
    if (!authData.email) {
      setAuthError('Please enter your email address');
      return;
    }

    setOtpLoading(true);
    setAuthError('');

    try {
      // Generate 6-digit OTP
      const otp = generateOtp();
      setGeneratedOtp(otp);

      // Store OTP in Firebase Database for verification
      const { database } = await import('../firebase/config');
      const { ref, set } = await import('firebase/database');
      
      const otpRef = ref(database, `otpVerification/${authData.email.replace(/[.#$[\]]/g, '_')}`);
      await set(otpRef, {
        otp: otp,
        timestamp: Date.now(),
        email: authData.email,
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes expiry
      });

      // For demo purposes, we'll show the OTP in console
      // In production, you would use a service like EmailJS, SendGrid, or a backend API
      console.log(`OTP for ${authData.email}: ${otp}`);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      setResendTimer(60); // 60 seconds timer
      
      // Show success message (in production, don't show the OTP)
      alert(`OTP sent to ${authData.email}! For demo purposes, check console. OTP: ${otp}`);
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      setAuthError('Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!authData.otp || authData.otp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      // Verify OTP from Firebase Database
      const { database } = await import('../firebase/config');
      const { ref, get, remove } = await import('firebase/database');
      
      const otpRef = ref(database, `otpVerification/${authData.email.replace(/[.#$[\]]/g, '_')}`);
      const snapshot = await get(otpRef);
      
      if (!snapshot.exists()) {
        setAuthError('OTP has expired or is invalid. Please request a new one.');
        return;
      }

      const otpData = snapshot.val();
      
      // Check if OTP has expired (5 minutes)
      if (Date.now() > otpData.expires) {
        await remove(otpRef); // Clean up expired OTP
        setAuthError('OTP has expired. Please request a new one.');
        return;
      }

      // Verify OTP
      if (authData.otp !== otpData.otp) {
        setAuthError('Invalid OTP. Please check and try again.');
        return;
      }

      // OTP is valid, proceed with account creation
      const { auth } = await import('../firebase/config');
      const { 
        createUserWithEmailAndPassword, 
        updateProfile
      } = await import('firebase/auth');

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        authData.email, 
        authData.password
      );
      
      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: authData.email.split('@')[0]
      });

      // Clean up OTP data
      await remove(otpRef);

      console.log('Account created successfully:', userCredential.user);
      
      // Close modals and reset form
      setShowAuthModal(false);
      setShowOtpVerification(false);
      setAuthData({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        otp: ''
      });
      setOtpSent(false);
      setGeneratedOtp('');
      
    } catch (error) {
      console.error('OTP verification error:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('This email is already registered. Please use login instead.');
          break;
        case 'auth/weak-password':
          setAuthError('Password is too weak. Please use at least 6 characters.');
          break;
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        default:
          setAuthError(error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    // Validation
    if (!authData.email || !authData.password) {
      setAuthError('Please fill in all fields');
      setAuthLoading(false);
      return;
    }

    if (authMode === 'signup') {
      if (authData.password !== authData.confirmPassword) {
        setAuthError('Passwords do not match');
        setAuthLoading(false);
        return;
      }
      if (authData.password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        setAuthLoading(false);
        return;
      }

      // For signup, show OTP verification
      setAuthLoading(false);
      setShowOtpVerification(true);
      return;
    }

    // For login, proceed normally
    try {
      const { auth } = await import('../firebase/config');
      const { signInWithEmailAndPassword } = await import('firebase/auth');

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        authData.email, 
        authData.password
      );
      console.log('User signed in successfully:', userCredential.user);

      // Close modal and reset form
      setShowAuthModal(false);
      setAuthData({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        otp: ''
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError('Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email. Please sign up first.');
          break;
        case 'auth/wrong-password':
          setAuthError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setAuthError('Network error. Please check your connection.');
          break;
        default:
          setAuthError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { auth } = await import('../firebase/config');
      const { signOut } = await import('firebase/auth');
      
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createGame = async () => {
    if (!newGameName.trim() || !isFirebaseAvailable) return;
    
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    
    try {
      const { database } = await import('../firebase/config');
      const { ref, push, set } = await import('firebase/database');
      
      const gamesRef = ref(database, 'games');
      const newGameRef = push(gamesRef);
      await set(newGameRef, {
        name: newGameName,
        createdAt: Date.now(),
        players: 1,
        status: 'waiting',
        createdBy: {
          uid: user.uid,
          email: user.email,
          displayName: user.email.split('@')[0]
        }
      });
      setNewGameName('');
    } catch (error) {
      console.error('Error creating game:', error);
      setFirebaseError(error.message);
    }
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setAuthData({ 
      email: '', 
      password: '', 
      confirmPassword: '', 
      otp: ''
    });
    setAuthError('');
    setShowOtpVerification(false);
    setOtpSent(false);
    setGeneratedOtp('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: "'Orbitron', 'Roboto', sans-serif",
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3) 0%, transparent 50%)
        `,
        animation: 'float 6s ease-in-out infinite'
      }} />

      {/* Floating Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 98px,
            rgba(255, 255, 255, 0.03) 100px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 98px,
            rgba(255, 255, 255, 0.03) 100px
          )
        `
      }} />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 40px',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #00f5ff, #ff00f5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(0, 245, 255, 0.5)'
        }}>
          NEXUS GAMING
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {userLoading ? (
            <div style={{ color: '#00f5ff' }}>Loading...</div>
          ) : user ? (
            <>
              <div style={{ 
                color: '#00f5ff', 
                fontSize: '0.9rem',
                marginRight: '10px'
              }}>
                Welcome, {user.displayName || user.email.split('@')[0]}
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '2px solid #ff00f5',
                  color: '#ff00f5',
                  padding: '10px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ff00f5';
                  e.target.style.color = '#000';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 0, 245, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#ff00f5';
                  e.target.style.boxShadow = 'none';
                }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => openAuthModal('login')}
                style={{
                  background: 'transparent',
                  border: '2px solid #00f5ff',
                  color: '#00f5ff',
                  padding: '10px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#00f5ff';
                  e.target.style.color = '#000';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#00f5ff';
                  e.target.style.boxShadow = 'none';
                }}
              >
                LOGIN
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                style={{
                  background: 'linear-gradient(45deg, #ff00f5, #00f5ff)',
                  border: 'none',
                  color: '#000',
                  padding: '10px 25px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 20px rgba(255, 0, 245, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 25px rgba(255, 0, 245, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 0, 245, 0.3)';
                }}
              >
                SIGN UP
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        paddingTop: '120px',
        paddingBottom: '80px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 900,
            marginBottom: '30px',
            background: 'linear-gradient(45deg, #00f5ff, #ff00f5, #ffff00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(0, 245, 255, 0.3)',
            letterSpacing: '2px',
            lineHeight: '1.1'
          }}>
            ENTER THE NEXUS
          </h1>
          <p style={{ 
            fontSize: '1.4rem', 
            marginBottom: '50px', 
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto 50px',
            lineHeight: '1.6'
          }}>
            Experience the future of gaming. Connect with players across dimensions, 
            compete in real-time battles, and dominate the digital frontier.
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '30px', 
            justifyContent: 'center', 
            flexWrap: 'wrap', 
            marginBottom: '80px' 
          }}>
            <button style={{
              background: 'linear-gradient(45deg, #00f5ff, #0080ff)',
              border: 'none',
              color: '#000',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 10px 30px rgba(0, 245, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px) scale(1.05)';
              e.target.style.boxShadow = '0 20px 40px rgba(0, 245, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 10px 30px rgba(0, 245, 255, 0.3)';
            }}>
              LAUNCH GAME
            </button>
            <button style={{
              background: 'transparent',
              border: '2px solid #ff00f5',
              color: '#ff00f5',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Orbitron', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ff00f5';
              e.target.style.color = '#000';
              e.target.style.boxShadow = '0 10px 30px rgba(255, 0, 245, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#ff00f5';
              e.target.style.boxShadow = 'none';
            }}>
              EXPLORE NEXUS
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'rgba(0, 245, 255, 0.1)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              borderRadius: '20px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                color: '#00f5ff',
                marginBottom: '10px'
              }}>
                {gameData.length}
              </div>
              <div style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Active Portals
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 0, 245, 0.1)',
              border: '1px solid rgba(255, 0, 245, 0.3)',
              borderRadius: '20px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                color: '#ff00f5',
                marginBottom: '10px'
              }}>
                {gameData.reduce((sum, game) => sum + (game.players || 0), 0)}
              </div>
              <div style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Players Online
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 0, 0.1)',
              border: '1px solid rgba(255, 255, 0, 0.3)',
              borderRadius: '20px',
              padding: '30px 20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 900, 
                color: '#ffff00',
                marginBottom: '10px'
              }}>
                24/7
              </div>
              <div style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                System Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '100px 20px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '3rem', 
            marginBottom: '80px',
            background: 'linear-gradient(45deg, #00f5ff, #ff00f5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            System Features
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '40px' 
          }}>
            {[
              { icon: '⚡', title: 'QUANTUM SPEED', desc: 'Experience zero-latency gaming powered by quantum processors' },
              { icon: '🌐', title: 'NEURAL NETWORK', desc: 'Connect with players through advanced AI-powered matching' },
              { icon: '🛡️', title: 'CYBER SECURITY', desc: 'Military-grade encryption protects your digital identity' },
              { icon: '🚀', title: 'WARP DRIVE', desc: 'Instant game deployment across multiple dimensions' },
              { icon: '💎', title: 'CRYSTAL CORE', desc: 'Blockchain-powered achievements and digital assets' },
              { icon: '🎯', title: 'TARGETING AI', desc: 'Advanced matchmaking for perfectly balanced competition' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 245, 0.1))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '40px 30px',
                backdropFilter: 'blur(15px)',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 245, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{feature.icon}</div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  marginBottom: '15px',
                  color: '#00f5ff',
                  letterSpacing: '1px' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ opacity: 0.8, lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }} onClick={() => setShowAuthModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 245, 0.1))',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              marginBottom: '30px',
              background: 'linear-gradient(45deg, #00f5ff, #ff00f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              {authMode === 'login' ? 'Access Portal' : 'Join Nexus'}
            </h2>
            
            {authError && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px',
                color: '#ff6b6b',
                fontSize: '0.9rem'
              }}>
                {authError}
              </div>
            )}
            
            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Neural ID (Email)"
                value={authData.email}
                onChange={(e) => setAuthData({...authData, email: e.target.value})}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 245, 255, 0.5)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: "'Orbitron', sans-serif",
                  opacity: authLoading ? 0.6 : 1
                }}
                required
              />
              
              <input
                type="password"
                placeholder="Access Code (Password)"
                value={authData.password}
                onChange={(e) => setAuthData({...authData, password: e.target.value})}
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  marginBottom: '20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 245, 255, 0.5)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontFamily: "'Orbitron', sans-serif",
                  opacity: authLoading ? 0.6 : 1
                }}
                required
              />
              {authMode === 'signup' && (
                <input
                  type="password"
                  placeholder="Confirm Access Code"
                  value={authData.confirmPassword}
                  onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                  disabled={authLoading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    marginBottom: '20px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(0, 245, 255, 0.5)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: "'Orbitron', sans-serif",
                    opacity: authLoading ? 0.6 : 1
                  }}
                  required
                />
              )}
              <button 
                type="submit" 
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: authLoading 
                    ? 'rgba(0, 245, 255, 0.3)' 
                    : 'linear-gradient(45deg, #00f5ff, #ff00f5)',
                  border: 'none',
                  borderRadius: '10px',
                  color: authLoading ? '#fff' : '#000',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  fontFamily: "'Orbitron', sans-serif",
                  textTransform: 'uppercase',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '20px',
                  opacity: authLoading ? 0.7 : 1
                }}
              >
                {authLoading 
                  ? 'Processing...' 
                  : (authMode === 'login' ? 'Initialize' : 'Continue to Verification')
                }
              </button>
            </form>
            <p style={{ opacity: 0.7 }}>
              {authMode === 'login' ? "Don't have access? " : "Already registered? "}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                disabled={authLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f5ff',
                  textDecoration: 'underline',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Orbitron', sans-serif",
                  opacity: authLoading ? 0.5 : 1
                }}
              >
                {authMode === 'login' ? 'Request Access' : 'Access Portal'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpVerification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }} onClick={() => setShowOtpVerification(false)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 245, 0.1))',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              marginBottom: '20px',
              background: 'linear-gradient(45deg, #00f5ff, #ff00f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Verify Neural Link
            </h2>
            
            <p style={{ opacity: 0.8, marginBottom: '30px', fontSize: '0.9rem' }}>
              We'll send a verification code to: {authData.email}
            </p>
            
            {authError && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px',
                color: '#ff6b6b',
                fontSize: '0.9rem'
              }}>
                {authError}
              </div>
            )}

            {!otpSent ? (
              <button 
                onClick={sendEmailOtp}
                disabled={otpLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: otpLoading 
                    ? 'rgba(0, 245, 255, 0.3)' 
                    : 'linear-gradient(45deg, #00f5ff, #ff00f5)',
                  border: 'none',
                  borderRadius: '10px',
                  color: otpLoading ? '#fff' : '#000',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  fontFamily: "'Orbitron', sans-serif",
                  textTransform: 'uppercase',
                  cursor: otpLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '20px'
                }}
              >
                {otpLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={authData.otp}
                  onChange={(e) => setAuthData({...authData, otp: e.target.value.replace(/\D/g, '')})}
                  disabled={authLoading}
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '15px',
                    marginBottom: '20px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(0, 245, 255, 0.5)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontFamily: "'Orbitron', sans-serif",
                    textAlign: 'center',
                    letterSpacing: '2px'
                  }}
                  autoFocus
                />
                
                <button 
                  onClick={verifyEmailOtp}
                  disabled={authLoading || authData.otp.length !== 6}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: (authLoading || authData.otp.length !== 6)
                      ? 'rgba(0, 245, 255, 0.3)' 
                      : 'linear-gradient(45deg, #00f5ff, #ff00f5)',
                    border: 'none',
                    borderRadius: '10px',
                    color: (authLoading || authData.otp.length !== 6) ? '#fff' : '#000',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    fontFamily: "'Orbitron', sans-serif",
                    textTransform: 'uppercase',
                    cursor: (authLoading || authData.otp.length !== 6) ? 'not-allowed' : 'pointer',
                    marginBottom: '20px'
                  }}
                >
                  {authLoading ? 'Verifying...' : 'Complete Registration'}
                </button>
                
                <button 
                  onClick={sendEmailOtp}
                  disabled={resendTimer > 0 || otpLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? '#666' : '#00f5ff',
                    textDecoration: 'underline',
                    cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.9rem'
                  }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        input:focus {
          outline: none;
          border-color: #ff00f5 !important;
          box-shadow: 0 0 15px rgba(255, 0, 245, 0.3);
        }
        
        @media (max-width: 768px) {
          nav {
            padding: 15px 20px !important;
            flex-direction: column;
            gap: 15px;
          }
          
          .hero h1 {
            font-size: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}