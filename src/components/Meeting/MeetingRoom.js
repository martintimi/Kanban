import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Badge,
  Slider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  ListItemAvatar
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  EmojiEmotions as EmojiIcon,
  Favorite as HeartIcon,
  ThumbUp as ThumbUpIcon,
  Celebration as CelebrationIcon,
  PanTool as WaveIcon,
  MoreVert as MoreIcon,
  Mood as HappyIcon,
  SentimentVeryDissatisfied as SadIcon,
  Whatshot as FireIcon,
  Stars as StarsIcon,
  Favorite as LoveIcon,
  Cake as CakeIcon,
  LocalCafe as CoffeeIcon,
  Timer as TimerIcon,
  Chat as ChatIcon,
  PresentToAll as PresentIcon,
  Settings as SettingsIcon,
  RecordVoiceOver as SpeakingIcon,
  VolumeUp as VolumeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { meetingService } from '../../services/meeting.service';
import { styled, keyframes } from '@mui/system';
import { useLocation } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

// Create a dark theme for dialogs
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const ripple = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(68, 183, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(68, 183, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(68, 183, 0, 0.5);
  }
`;

const wave = keyframes`
  0% { transform: scaleY(0.2); }
  50% { transform: scaleY(1); }
  100% { transform: scaleY(0.2); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
`;

const multiRipple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
`;

const glowRing = keyframes`
  0% { box-shadow: 0 0 0 0px rgba(68, 183, 0, 0.5); }
  100% { box-shadow: 0 0 0 20px rgba(68, 183, 0, 0); }
`;

const speakingPulse = keyframes`
  0% { transform: scale(1); border-color: rgba(68, 183, 0, 0.5); }
  50% { transform: scale(1.1); border-color: rgba(68, 183, 0, 1); }
  100% { transform: scale(1); border-color: rgba(68, 183, 0, 0.5); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`;

const borderGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(68, 183, 0, 0.5); }
  50% { box-shadow: 0 0 40px rgba(68, 183, 0, 0.8); }
  100% { box-shadow: 0 0 20px rgba(68, 183, 0, 0.5); }
`;

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const ParticipantInfo = styled(Box)(({ theme, isVideoEnabled, isScreenSharing }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  color: 'white',
  textAlign: 'center',
  opacity: !isVideoEnabled && !isScreenSharing ? 1 : 0,
  transition: 'opacity 0.3s ease-in-out',
  zIndex: 2
}));

const ParticipantAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  fontSize: '3rem',
  backgroundColor: theme.palette.primary.main,
  border: '4px solid white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const VideoContainer = styled(Box)(({ theme, isVideoEnabled, isScreenSharing }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: isVideoEnabled || isScreenSharing ? 1 : 0,
  transition: 'opacity 0.3s ease-in-out',
  '& video': {
    width: '100%',
    height: '100%',
    objectFit: isScreenSharing ? 'contain' : 'cover',
    backgroundColor: 'black'
  }
}));

const AudioWaveContainer = styled(Box)(({ isActive }) => ({
  position: 'absolute',
  bottom: -30,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '10px 20px',
  borderRadius: 30,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  opacity: isActive ? 1 : 0,
  transition: 'all 0.3s ease-in-out',
}));

const WaveBar = styled('div')(({ delay, height }) => ({
  width: 4,
  height: `${height}px`,
  backgroundColor: '#44b700',
  borderRadius: 4,
  animation: `${wave} 1s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  '&:nth-of-type(odd)': {
    backgroundColor: '#44b700',
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#66cc22',
  }
}));

const SpeakingIndicator = styled(Box)(({ theme, isSpeaking }) => ({
  position: 'absolute',
  top: -15,
  left: -15,
  right: -15,
  bottom: -15,
  opacity: isSpeaking ? 1 : 0,
  transition: 'all 0.3s ease-in-out',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '3px solid #44b700',
  },
  '&::before': {
    animation: `${speakingPulse} 2s ease-in-out infinite`,
  },
  '&::after': {
    animation: `${glowRing} 2s ease-out infinite`,
  }
}));

const ParticipantContainer = styled(Box)(({ isActive }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 1000,
  aspectRatio: '16/9',
  margin: '0 auto',
  borderRadius: 20,
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  transform: isActive ? 'scale(1.02)' : 'scale(1)',
  animation: isActive ? `${floatAnimation} 3s ease-in-out infinite` : 'none',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    border: '3px solid transparent',
    borderRadius: 20,
    transition: 'all 0.3s ease-in-out',
    boxShadow: isActive ? '0 0 30px rgba(68, 183, 0, 0.3)' : 'none',
    animation: isActive ? `${borderGlow} 2s ease-in-out infinite` : 'none'
  }
}));

const VideoWrapper = styled(Box)(({ isVideoEnabled, isScreenSharing }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  backgroundColor: '#2a2a2a',
  borderRadius: 20,
  overflow: 'hidden',
  '& video': {
    width: '100%',
    height: '100%',
    objectFit: isScreenSharing ? 'contain' : 'cover',
    transition: 'all 0.3s ease-in-out',
    opacity: isVideoEnabled || isScreenSharing ? 1 : 0
  }
}));

const ParticipantOverlay = styled(Box)(({ isVideoEnabled, isScreenSharing }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: isVideoEnabled || isScreenSharing ? 'transparent' : 'radial-gradient(circle at center, #3a3a3a 0%, #2a2a2a 100%)',
  opacity: isVideoEnabled || isScreenSharing ? 0 : 1,
  transition: 'all 0.3s ease-in-out'
}));

const ControlsBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 12,
  padding: '12px 24px',
  borderRadius: 40,
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  zIndex: 10
}));

const ControlButton = styled(IconButton)(({ active }) => ({
  width: 50,
  height: 50,
  backgroundColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
  color: 'white',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)',
    transform: 'scale(1.1)',
  },
  '& svg': {
    fontSize: '1.8rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  }
}));

const MeetingContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#1a1a1a',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 9999,
  overflow: 'hidden'
}));

const TopBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 60,
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(10px)',
  zIndex: 10
}));

const MainContent = styled(Box)(({ isVideoEnabled }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  padding: '60px 0',
  background: isVideoEnabled ? 'transparent' : 'radial-gradient(circle at center, #2a2a2a 0%, #1a1a1a 100%)'
}));

const ReactionButton = styled(IconButton)({
  width: 45,
  height: 45,
  backgroundColor: 'rgba(255,255,255,0.25)',
  fontSize: '1.8rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: 'scale(1.15)',
  }
});

const ReactionMenu = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 85,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 8,
  padding: '12px',
  borderRadius: 40,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
  zIndex: 11,
  animation: `${popIn} 0.3s ease-out`,
}));

const ReactionTooltip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -25,
  left: '50%',
  transform: 'translateX(-50%) translateY(10px)',
  backgroundColor: 'rgba(0,0,0,0.8)',
  color: '#fff',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  opacity: 0,
  transition: 'all 0.2s ease',
  pointerEvents: 'none',
}));

const FloatingReaction = styled(Box)({
  position: 'absolute',
  fontSize: '28px',
  animation: `${floatAnimation} 3s ease-out forwards, ${fadeOut} 3s ease-out forwards`,
  zIndex: 12,
  userSelect: 'none',
  pointerEvents: 'none',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
});

const WaveAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-30deg); }
  75% { transform: rotate(30deg); }
  100% { transform: rotate(0deg); }
`;

const WaveIndicator = styled(Box)(({ isWaving }) => ({
  position: 'absolute',
  top: -30,
  right: -30,
  padding: 8,
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: '#fff',
  animation: isWaving ? `${WaveAnimation} 0.5s ease-in-out infinite` : 'none',
  zIndex: 11
}));

const ChatPanel = styled(Box)(({ theme, isOpen }) => ({
  position: 'absolute',
  right: isOpen ? 0 : '-400px',
  top: 60,
  bottom: 0,
  width: 400,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  borderLeft: '1px solid rgba(255,255,255,0.1)',
  transition: 'right 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 9
}));

const MessageList = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
});

const MessageInput = styled(Box)({
  padding: '20px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  gap: '10px'
});

const Message = styled(Box)(({ isOwn }) => ({
  maxWidth: '80%',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  backgroundColor: isOwn ? 'rgba(25, 118, 210, 0.4)' : 'rgba(255,255,255,0.1)',
  padding: '10px 15px',
  borderRadius: '15px',
  borderBottomRightRadius: isOwn ? '5px' : '15px',
  borderBottomLeftRadius: isOwn ? '15px' : '5px'
}));

const Timer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 12px',
  borderRadius: '20px',
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white'
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'white',
    minWidth: 400,
    position: 'fixed',
    zIndex: 9999
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0,0,0,0.7)'
  }
}));

const WelcomeDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    color: 'white',
    minWidth: 400
  }
}));

const MutedIndicator = styled(Box)({
  position: 'absolute',
  bottom: 20,
  left: 20,
  backgroundColor: 'rgba(255, 68, 68, 0.9)',
  color: 'white',
  padding: '6px 12px',
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  zIndex: 10,
  animation: `${popIn} 0.3s ease-out`
});

const CustomModal = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  zIndex: 10000,
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: '#1a1a1a',
  color: 'white',
  padding: 24,
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  maxWidth: 500,
  width: '100%',
  position: 'relative',
  border: '1px solid rgba(255,255,255,0.1)',
}));

const ModalTitle = styled(Typography)(({ theme }) => ({
  marginBottom: 16,
  fontSize: 20,
  fontWeight: 500,
}));

const ModalActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 24,
  gap: 8,
}));

const MeetingRoom = ({ roomId, onLeave }) => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const { showToast } = useToast();
  const location = useLocation();
  
  // Local state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [waitingRoomParticipants, setWaitingRoomParticipants] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState({});
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [isWaving, setIsWaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isSpeakingMode, setIsSpeakingMode] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  // Refs for media elements
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const remoteVideos = useRef({});
  const audioContext = useRef(null);
  const audioAnalyser = useRef(null);
  const audioDataArray = useRef(new Uint8Array(1024));
  const animationFrameId = useRef(null);
  const prevWaitingRoomParticipantsRef = useRef([]);

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccessDialogOpen, setInviteSuccessDialogOpen] = useState(false);

  // Debug logs for dialog states
  useEffect(() => {
    console.log('Welcome dialog state:', showWelcomeDialog);
    console.log('Invite dialog state:', inviteDialogOpen);
  }, [showWelcomeDialog, inviteDialogOpen]);

  const handleInviteClick = () => {
    console.log('Invite button clicked');
    setInviteDialogOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }

    try {
      setInviteDialogOpen(false);
      showToast('Creating invitation...', 'info');

      // Generate a longer unique access token for security
      const timestamp = Date.now().toString(36);
      const random1 = Math.random().toString(36).substring(2, 10);
      const random2 = Math.random().toString(36).substring(2, 10);
      const guestToken = `${timestamp}-${random1}-${random2}`;
      
      console.log('Generated secure token:', guestToken);
      
      // Get meeting details to include in invite
      const meeting = await meetingService.getMeeting(roomId);
      
      // Use the appropriate domain based on environment
      // For production (Vercel)
      const publicDomain = window.location.origin;
      const meetingLink = `${publicDomain}/meetings/${roomId}?token=${guestToken}`;
      
      // For local testing in development
      const localLink = `http://localhost:3001/meetings/${roomId}?token=${guestToken}`;
      console.log('Local testing link:', localLink);
      
      // Save the invite link for display
      setInviteLink(meetingLink);
      setInviteSuccessDialogOpen(true);
      
      // Save the invitation to the database
      try {
        // Create a direct invitation record
        const inviteData = {
          meetingId: roomId,
          email: inviteEmail,
          hostId: user?.uid,
          hostName: user?.displayName || user?.email || 'Host',
          createdAt: new Date(),
          status: 'pending',
          guestToken: guestToken,
          meetingTitle: meeting.title || 'Meeting',
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours from now
        };
        
        await meetingService.createDirectInvitation(roomId, inviteEmail, inviteData);
        console.log('Invitation saved to database');
      } catch (dbError) {
        console.error('Error saving invitation to database:', dbError);
        // The link will still work via our token validation even if DB save fails
      }
      
      setInviteEmail('');
      showToast('Invitation created successfully!', 'success');
    } catch (error) {
      console.error('Error creating invitation:', error);
      showToast('Failed to create invitation: ' + error.message, 'error');
      setInviteDialogOpen(true);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // First, check if there's a token in the URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        console.log('Initialization started. Token in URL:', token ? 'Yes (truncated): ' + token.substring(0, 5) + '...' : 'No');
        
        // For direct token-based access (invite links), we need special handling
        if (token) {
          console.log('Token detected in URL, validating direct access');
          
          // Validate the meeting exists even for token access
          try {
            const meeting = await meetingService.getMeeting(roomId);
            console.log('Meeting details found:', meeting.id);
            
            // If user is logged in and is the host, give immediate access
            if (user && meeting.hostId === user.uid) {
              console.log('User is host - initializing media');
              setIsHost(true);
        await initializeMedia();
        await setupWebRTC();
        
              // Subscribe to waiting room changes if host
              const unsubWaitingRoom = meetingService.onWaitingRoomChange(roomId, (participants) => {
                console.log('Waiting room participants:', participants);
                setWaitingRoomParticipants(participants);
              });
              
              return () => unsubWaitingRoom();
            }
            
            // For token-based guests, generate a guest ID using the token 
            console.log('User is a guest with token - validating token access');
            const guestId = await meetingService.validateAndJoinWithToken(roomId, token);
            
            // Generate a recognizable guest name with the token prefix
            const tokenPrefix = token.split('-')[0] || token.substring(0, 4); 
            const guestName = `Guest (${tokenPrefix})`;
            
            console.log('Generated guest ID for token access:', guestId);
            console.log('Adding to waiting room as guest with token');
            
            // Always put guests in waiting room first
            setIsInWaitingRoom(true);
            
            // Add to waiting room with the guest ID
            await meetingService.addToWaitingRoom(roomId, {
              id: guestId,
              name: guestName,
              isGuest: true,
              token: token,
              userAgent: navigator.userAgent
            });
            
            console.log('Successfully added to waiting room, setting up admission listener');
            
            // Subscribe to this guest's admission status
            const unsubAdmission = meetingService.onParticipantAdmitted(roomId, guestId, async (isAdmitted) => {
              console.log('Admission status change detected:', isAdmitted);
              if (isAdmitted) {
                console.log('Guest admitted to meeting:', guestId);
                setIsInWaitingRoom(false);
                
                try {
                  await initializeMedia();
                  await setupWebRTC();
                  
                  // Join the meeting officially once media is ready
                  await meetingService.joinMeeting(roomId, {
                    id: guestId,
                    name: guestName,
                    isGuest: true
                  });
                } catch (mediaError) {
                  console.error('Error initializing media after admission:', mediaError);
                  showToast('Could not access your camera or microphone, but you can still participate', 'warning');
                  
                  // Join even without media
                  await meetingService.joinMeeting(roomId, {
                    id: guestId,
                    name: guestName,
                    isGuest: true
                  });
                }
              }
            });
            
            return () => {
              if (unsubAdmission) unsubAdmission();
        };
      } catch (error) {
            console.error('Error validating meeting for token access:', error);
            showToast('Invalid meeting or token', 'error');
            onLeave();
            return;
          }
        } else {
          // Standard room access for authenticated users (no token)
          console.log('No token, checking authenticated access');
          
          // Get meeting details
          const meeting = await meetingService.getMeeting(roomId);
          console.log('Meeting details:', meeting);
          
          // Check if user is authenticated
          if (!user) {
            console.log('User not authenticated, redirecting to login');
            showToast('Please log in to join the meeting', 'error');
            onLeave();
            return;
          }
          
          // Determine if current user is the host
          const isHost = user && meeting.hostId === user.uid;
          setIsHost(isHost);
          console.log('User is host:', isHost);

          // If you're the host, you have immediate access
          if (isHost) {
            console.log('User is host - initializing media');
            try {
              await initializeMedia();
              await setupWebRTC();
              
              // Join the meeting as the host
              await meetingService.joinMeeting(roomId, {
                id: user.uid,
                name: user.displayName || user.email,
                email: user.email,
                isGuest: false
              });
            } catch (mediaError) {
              console.error('Error initializing host media:', mediaError);
              
              // Join even without media
              await meetingService.joinMeeting(roomId, {
                id: user.uid,
                name: user.displayName || user.email,
                email: user.email,
                isGuest: false
              });
              
              showToast('Could not access your camera or microphone, but you can still host the meeting', 'warning');
            }
            
            // Subscribe to waiting room changes if host
            const unsubWaitingRoom = meetingService.onWaitingRoomChange(roomId, (participants) => {
              console.log('Waiting room participants:', participants);
              setWaitingRoomParticipants(participants);
            });
            
            return () => unsubWaitingRoom();
          }
          
          // Regular authenticated user (non-host)
          const guestId = user.uid;
          const guestName = user.displayName || 'Authenticated User';
          
          console.log('Regular user joining, adding to waiting room');
          setIsInWaitingRoom(true);
          
          await meetingService.addToWaitingRoom(roomId, {
            id: guestId,
            name: guestName,
            email: user.email,
            isGuest: false,
            userAgent: navigator.userAgent
          });
          
          // Subscribe to this participant's admission status
          const unsubAdmission = meetingService.onParticipantAdmitted(roomId, guestId, async (isAdmitted) => {
            if (isAdmitted) {
              console.log('User admitted to meeting:', guestId);
              setIsInWaitingRoom(false);
              
              try {
                await initializeMedia();
                await setupWebRTC();
                
                // Join the meeting officially once admitted
                await meetingService.joinMeeting(roomId, {
                  id: guestId,
                  name: guestName,
                  email: user.email,
                  isGuest: false
                });
              } catch (mediaError) {
                console.error('Error initializing media after admission:', mediaError);
                
                // Join even without media
                await meetingService.joinMeeting(roomId, {
                  id: guestId,
                  name: guestName, 
                  email: user.email,
                  isGuest: false
                });
                
                showToast('Could not access your camera or microphone, but you can still participate', 'warning');
              }
            }
          });
          
          return () => {
            if (unsubAdmission) unsubAdmission();
          };
        }
      } catch (error) {
        console.error('Error initializing meeting:', error);
        showToast('Failed to initialize meeting: ' + error.message, 'error');
        onLeave();
      }
    };

    initialize();
  }, [roomId, user, onLeave, showToast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.displayName) {
      const joinMessage = {
        id: Date.now(),
        type: 'system',
        text: `${user.displayName} joined the meeting`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, joinMessage]);
    }
  }, []);

  const initializeMedia = async () => {
    try {
      // First try to get both audio and video
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        }
        return true;
      } catch (fullError) {
        console.warn('Could not get full media access, trying audio only:', fullError);
        
        // If that fails, try just audio
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          
          localStreamRef.current = audioOnlyStream;
          setIsVideoEnabled(false); // Update UI to show video is disabled
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioOnlyStream;
          }
          showToast('Video access was denied. Using audio only.', 'warning');
          return true;
        } catch (audioError) {
          console.error('Could not get audio access either:', audioError);
          
          // Last resort - create empty tracks to avoid breaking WebRTC
          const emptyStream = new MediaStream();
          localStreamRef.current = emptyStream;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = emptyStream;
          }
          
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
          
          showToast('Microphone and camera access denied. You will not be able to speak or be seen.', 'error');
          return false;
        }
      }
    } catch (error) {
      console.error('Fatal error accessing media devices:', error);
      showToast('Could not access your camera or microphone. Please check your browser permissions.', 'error');
      return false;
    }
  };

  const setupWebRTC = async () => {
    try {
      // Only proceed with WebRTC if we have media access
      if (!localStreamRef.current) {
        console.warn('No local stream available for WebRTC');
        return;
      }
      
      const meeting = await meetingService.getMeeting(roomId);
      const currentParticipants = meeting.participants || [];
      
      // Create peer connections for existing participants
      for (const participantId of currentParticipants) {
        if (participantId !== user.uid) {
          await createPeerConnection(participantId);
        }
      }
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      // Don't throw, just log the error to prevent the meeting from closing
    }
  };

  const createPeerConnection = async (participantId) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Add local tracks to the connection
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          meetingService.sendSignal(roomId, user.uid, participantId, {
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle remote tracks
      peerConnection.ontrack = (event) => {
        if (!remoteVideos.current[participantId]) {
          remoteVideos.current[participantId] = document.createElement('video');
          remoteVideos.current[participantId].autoplay = true;
          remoteVideos.current[participantId].playsInline = true;
        }
        remoteVideos.current[participantId].srcObject = event.streams[0];
      };
      
      peerConnections.current[participantId] = peerConnection;
      
      // Create and send offer if we're the newer participant
      if (user.uid > participantId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        await meetingService.sendSignal(roomId, user.uid, participantId, {
          type: 'offer',
          sdp: offer
        });
      }
      
      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  };

  const handleSignalingMessage = async (signal) => {
    try {
      const { fromUserId, data } = signal;
      
      if (!peerConnections.current[fromUserId]) {
        await createPeerConnection(fromUserId);
      }
      
      const peerConnection = peerConnections.current[fromUserId];
      
      switch (data.type) {
        case 'offer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          await meetingService.sendSignal(roomId, user.uid, fromUserId, {
            type: 'answer',
            sdp: answer
          });
          break;
          
        case 'answer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
          break;
          
        case 'ice-candidate':
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          break;
          
        default:
          console.warn('Unknown signal type:', data.type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  const handleParticipantsChange = async (newParticipants) => {
    const currentPeerIds = Object.keys(peerConnections.current);
    const newPeerIds = newParticipants.filter(id => id !== user.uid);
    
    // Remove old connections
    currentPeerIds.forEach(peerId => {
      if (!newPeerIds.includes(peerId)) {
        peerConnections.current[peerId].close();
        delete peerConnections.current[peerId];
        delete remoteVideos.current[peerId];
      }
    });
    
    // Create new connections
    for (const peerId of newPeerIds) {
      if (!currentPeerIds.includes(peerId)) {
        await createPeerConnection(peerId);
      }
    }
    
    setParticipants(newParticipants);
  };

  const cleanupWebRTC = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    remoteVideos.current = {};
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track in all peer connections
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const screenTrack = screenStream.getVideoTracks()[0];
        
        if (videoTrack) {
          localStreamRef.current.removeTrack(videoTrack);
          localStreamRef.current.addTrack(screenTrack);
          
          // Replace track in all peer connections
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          });
        }
        
        // Handle screen sharing stop
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } else {
        // Revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        
        if (screenTrack) {
          screenTrack.stop();
          localStreamRef.current.removeTrack(screenTrack);
          localStreamRef.current.addTrack(videoTrack);
          
          // Replace track in all peer connections
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      showToast('Failed to share screen', 'error');
    }
  };

  const handleAdmitParticipant = async (participantId) => {
    try {
      await meetingService.admitFromWaitingRoom(roomId, participantId);
      showToast('Participant admitted to meeting', 'success');
    } catch (error) {
      console.error('Error admitting participant:', error);
      showToast('Failed to admit participant', 'error');
    }
  };

  const handleDenyParticipant = async (participantId) => {
    try {
      await meetingService.removeFromWaitingRoom(roomId, participantId);
      showToast('Participant denied access', 'info');
    } catch (error) {
      console.error('Error denying participant:', error);
      showToast('Failed to deny participant', 'error');
    }
  };

  const handleLeave = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connections
    Object.values(peerConnections.current).forEach(pc => {
      try {
        pc.close();
      } catch (e) {
        console.warn('Error closing peer connection:', e);
      }
    });
    peerConnections.current = {};

    // Close audio context
    if (audioContext.current) {
      try {
        audioContext.current.close();
      } catch (e) {
        console.warn('Error closing audio context:', e);
      }
      audioContext.current = null;
    }

    // Cancel any ongoing animations
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // Call onLeave directly
    if (onLeave) {
      onLeave();
    } else {
      window.location.href = '/';
    }
  };

  const addReaction = (emoji) => {
    const newReaction = {
      id: Date.now(),
      emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 50 + 25,
      rotation: Math.random() * 30 - 15
    };
    
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 5000);
    
    // Send reaction to other participants
    try {
      meetingService.sendSignal(roomId, user.uid, 'all', {
        type: 'reaction',
        emoji
      });
    } catch (error) {
      console.error('Error sending reaction:', error);
    }
    
    setShowReactions(false);
  };

  const handleWave = () => {
    setIsWaving(true);
    addReaction('👋');
    setTimeout(() => setIsWaving(false), 3000);
    
    // Send wave to other participants
    try {
      meetingService.sendSignal(roomId, user.uid, 'all', {
        type: 'wave'
      });
    } catch (error) {
      console.error('Error sending wave:', error);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: messageInput,
      sender: user.uid,
      senderName: user.displayName || 'You',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    // Send message to other participants
    try {
      meetingService.sendSignal(roomId, user.uid, 'all', {
        type: 'message',
        text: messageInput
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add notification for waiting room participants
  useEffect(() => {
    // Play a sound when a new participant joins the waiting room
    if (isHost && waitingRoomParticipants.length > 0) {
      // Find if there are any new participants compared to the previous state
      const prevCount = prevWaitingRoomParticipantsRef.current?.length || 0;
      if (waitingRoomParticipants.length > prevCount) {
        // Try to play a notification sound
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
          console.log('Could not play notification sound:', error);
        }
        
        // Show a toast notification
        showToast(`${waitingRoomParticipants[waitingRoomParticipants.length - 1].name} is waiting to join`, 'info');
      }
    }
    
    // Update the reference to the current participants
    prevWaitingRoomParticipantsRef.current = [...waitingRoomParticipants];
  }, [isHost, waitingRoomParticipants, showToast]);

  // Add a fallback for when getUserMedia fails
  useEffect(() => {
    // Set up permissionchange event listener for the whole component
    try {
      navigator.permissions.query({ name: 'camera' }).then(permissionStatus => {
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted' && !localStreamRef.current) {
            // If permissions were granted later, try to initialize media again
            initializeMedia().then(success => {
              if (success) {
                setupWebRTC();
              }
            });
          }
        };
      });
      
      navigator.permissions.query({ name: 'microphone' }).then(permissionStatus => {
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted' && (!localStreamRef.current || !isAudioEnabled)) {
            // If microphone permission was granted later
            initializeMedia().then(success => {
              if (success) {
                setupWebRTC();
              }
            });
          }
        };
      });
    } catch (error) {
      console.warn('Permission query not supported in this browser:', error);
    }
  }, []);

  if (isInWaitingRoom) {
  return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#1a1a1a',
          color: 'white',
          p: 3
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
            Waiting for the host to admit you
          </Typography>
          
          <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
            The meeting host has been notified of your request to join.
            Please wait while they review and admit you to the meeting.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
            You'll be automatically connected once the host lets you in.
          </Typography>
          
          <Button
            variant="outlined"
            color="error"
            onClick={onLeave}
            sx={{ mt: 2 }}
          >
            Cancel and leave
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    <MeetingContainer>
      <TopBar>
        <Typography variant="h6">
          Meeting Room
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography>
            {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </TopBar>

      <MainContent isVideoEnabled={isVideoEnabled}>
        {reactions.map(reaction => (
          <FloatingReaction
            key={reaction.id}
            sx={{
              left: `${reaction.x}%`,
              bottom: `${reaction.y}%`,
              transform: `rotate(${reaction.rotation}deg)`
            }}
          >
            {reaction.emoji}
          </FloatingReaction>
        ))}
        
        <ParticipantContainer isActive={isSpeaking[user.uid] && isAudioEnabled}>
          <VideoWrapper 
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            />
            {!isAudioEnabled && (
              <MutedIndicator>
                <MicOffIcon fontSize="small" />
                <Typography variant="body2">Microphone Off</Typography>
              </MutedIndicator>
            )}
            <ParticipantOverlay 
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
            >
              <ParticipantAvatar 
                alt={user.displayName || 'You'}
                sx={{ 
                  width: 150, 
                  height: 150,
                  fontSize: '4rem',
                  mb: 3,
                  border: '4px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  animation: isSpeaking[user.uid] && isAudioEnabled ? `${floatAnimation} 3s ease-in-out infinite` : 'none'
                }}
              >
                {user.displayName?.[0]?.toUpperCase() || <PersonIcon sx={{ fontSize: 80 }} />}
              </ParticipantAvatar>
              <Typography variant="h4" sx={{ 
                fontWeight: 500,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: 0.5
              }}>
                {user.displayName || 'You'}
              </Typography>
              {isScreenSharing && (
                <Typography variant="subtitle1" sx={{ color: 'grey.400', mt: 1 }}>
                  is sharing their screen
                </Typography>
              )}
            </ParticipantOverlay>
          </VideoWrapper>
          <AudioWaveContainer isActive={isSpeaking[user.uid] && isAudioEnabled}>
            {[20, 30, 40, 50, 40, 30, 20].map((height, i) => (
              <WaveBar 
                key={i} 
                height={height} 
                delay={i * 0.15}
              />
            ))}
          </AudioWaveContainer>
          {isWaving && (
            <WaveIndicator isWaving={true}>
              <WaveIcon />
            </WaveIndicator>
          )}
        </ParticipantContainer>
      </MainContent>

      {showReactions && (
        <ReactionMenu>
          <Tooltip title="Wave">
            <ReactionButton onClick={() => addReaction('👋')}>
              👋
            </ReactionButton>
          </Tooltip>
          <Tooltip title="Heart">
            <ReactionButton onClick={() => addReaction('❤️')}>
              ❤️
            </ReactionButton>
          </Tooltip>
          <Tooltip title="Thumbs Up">
            <ReactionButton onClick={() => addReaction('👍')}>
              👍
            </ReactionButton>
          </Tooltip>
          <Tooltip title="Celebrate">
            <ReactionButton onClick={() => addReaction('🎉')}>
              🎉
            </ReactionButton>
          </Tooltip>
          <Tooltip title="Smile">
            <ReactionButton onClick={() => addReaction('😊')}>
              😊
            </ReactionButton>
          </Tooltip>
        </ReactionMenu>
      )}

      <ControlsBar>
            <Tooltip title={isAudioEnabled ? "Mute" : "Unmute"}>
          <ControlButton 
            onClick={toggleAudio}
            active={isAudioEnabled}
          >
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon sx={{ color: '#ff4444' }} />}
          </ControlButton>
        </Tooltip>
            
        <Tooltip title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}>
          <ControlButton 
            onClick={toggleVideo}
            active={isVideoEnabled}
          >
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon sx={{ color: '#ff4444' }} />}
          </ControlButton>
        </Tooltip>
            
            <Tooltip title={isScreenSharing ? "Stop sharing" : "Share screen"}>
          <ControlButton 
            onClick={toggleScreenShare}
            active={isScreenSharing}
          >
            {isScreenSharing ? <StopScreenShareIcon sx={{ color: '#ff4444' }} /> : <ScreenShareIcon />}
          </ControlButton>
        </Tooltip>
            
            {isHost && (
              <Tooltip title="Invite someone">
                <ControlButton 
                  onClick={handleInviteClick}
                >
                  <PersonAddIcon />
                </ControlButton>
              </Tooltip>
            )}
            
            {isHost && waitingRoomParticipants.length > 0 && (
              <Tooltip title={`${waitingRoomParticipants.length} waiting to join`}>
                <Badge badgeContent={waitingRoomParticipants.length} color="error" overlap="circular">
                  <ControlButton 
                    onClick={() => document.getElementById('waiting-room-panel')?.scrollIntoView({ behavior: 'smooth' })}
                    active={true}
                    sx={{ animation: `${pulse} 2s infinite ease-in-out` }}
                  >
                    <PersonIcon />
                  </ControlButton>
                </Badge>
              </Tooltip>
            )}
            
            <Tooltip title="Chat">
              <ControlButton 
                onClick={() => setIsChatOpen(!isChatOpen)}
                active={isChatOpen}
              >
                <ChatIcon />
              </ControlButton>
            </Tooltip>
            
        <Tooltip title="Show reactions">
          <ControlButton 
            onClick={() => setShowReactions(!showReactions)}
            active={showReactions}
          >
            <EmojiIcon />
          </ControlButton>
        </Tooltip>
        <Tooltip title="Wave to everyone">
          <ControlButton 
            onClick={handleWave}
            active={isWaving}
          >
            <WaveIcon />
          </ControlButton>
        </Tooltip>
        <Tooltip title="Leave meeting">
          <ControlButton 
            onClick={handleLeave}
            sx={{ 
              backgroundColor: '#ff4444',
              '&:hover': {
                backgroundColor: '#ff6666',
              }
            }}
          >
            <CallEndIcon />
          </ControlButton>
        </Tooltip>
      </ControlsBar>

          {/* Replace Welcome Dialog with custom modal */}
          {showWelcomeDialog && (
            <CustomModal onClick={() => setShowWelcomeDialog(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle variant="h6">Welcome to the Meeting!</ModalTitle>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Here are some quick tips to get you started:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Microphone"
                      secondary="Use the microphone button to mute/unmute"
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Camera"
                      secondary="Toggle your camera on/off"
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Screen Sharing"
                      secondary="Share your screen with others"
                      primaryTypographyProps={{ sx: { color: 'white' } }}
                    />
                  </ListItem>
                </List>
                <ModalActions>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => setShowWelcomeDialog(false)}
                  >
                    Got it!
                  </Button>
                </ModalActions>
              </ModalContent>
            </CustomModal>
          )}

          {/* Replace Invite Dialog with custom modal */}
          {inviteDialogOpen && (
            <CustomModal onClick={() => setInviteDialogOpen(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle variant="h6">Invite Someone to the Meeting</ModalTitle>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Enter the email address of the person you want to invite.
            </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    }
                  }}
                />
                <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Important: After clicking "Create Invitation", a link will be created and copied to your clipboard.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                    Link format: <strong>https://kanban-qiap-p2cfl1p8z-welsfags-projects.vercel.app/meetings/{roomId}?token=abc123</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                    Share this link with your guest. They can access it from anywhere.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                    The link will include a secure token that's valid for 24 hours.
                  </Typography>
            </Box>
                <ModalActions>
                  <Button onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInvite}
                    variant="contained" 
                    color="primary"
                    disabled={!inviteEmail}
                  >
                    Create Invitation
                  </Button>
                </ModalActions>
              </ModalContent>
            </CustomModal>
          )}

          {/* Invitation Success Dialog */}
          {inviteSuccessDialogOpen && (
            <CustomModal onClick={() => setInviteSuccessDialogOpen(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle variant="h6">Invitation Created!</ModalTitle>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Your invitation has been created successfully. Share this link with the person you want to invite:
                </Typography>
                
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={inviteLink}
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                        sx: { color: 'white', fontSize: '0.9rem' }
                      }}
                    />
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        showToast('Meeting link copied to clipboard!', 'success');
                      }}
                    >
                      Copy
                    </Button>
            </Box>
            </Box>
                
                <ModalActions>
          <Button 
            variant="contained" 
                    onClick={() => setInviteSuccessDialogOpen(false)}
                  >
                    Close
                  </Button>
                </ModalActions>
              </ModalContent>
            </CustomModal>
          )}

          {/* Add Waiting Room Panel for host */}
          {isHost && waitingRoomParticipants.length > 0 && (
            <Paper
              id="waiting-room-panel"
              elevation={4}
            sx={{ 
                position: 'absolute',
                right: 20,
                top: 70,
                zIndex: 1200,
                width: 350,
                p: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                animation: `${popIn} 0.3s ease-out`
              }}
            >
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.main',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Waiting Room ({waitingRoomParticipants.length})
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  New requests
                </Typography>
              </Box>
              
              <List sx={{ maxHeight: 300, overflowY: 'auto', py: 0 }}>
                {waitingRoomParticipants.map((participant) => (
                  <ListItem
                    key={participant.id}
                    sx={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      py: 1.5,
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.dark' }}>
                        {participant.name?.[0]?.toUpperCase() || <PersonIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                          {participant.name}
                          {participant.token && (
                            <Box 
                              component="span" 
                              sx={{ 
                                ml: 1,
                                fontSize: '10px', 
              backgroundColor: 'primary.main',
              color: 'white',
                                px: 1,
                                py: 0.3,
                                borderRadius: 4,
                                verticalAlign: 'middle'
                              }}
                            >
                              INVITE LINK
                            </Box>
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {participant.isGuest ? 'Guest user' : participant.email || 'No email provided'}
                          {participant.userAgent && (
                            <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                              {participant.userAgent.includes('Chrome') ? '🌐 Chrome' : 
                               participant.userAgent.includes('Firefox') ? '🦊 Firefox' : 
                               participant.userAgent.includes('Safari') ? '🧭 Safari' : 
                               participant.userAgent.includes('Edge') ? '📐 Edge' : '🌐 Browser'}
                            </Box>
                          )}
                        </Typography>
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleAdmitParticipant(participant.id)}
                        sx={{ borderRadius: 4 }}
                      >
                        Admit
          </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ borderRadius: 4 }}
                        onClick={() => handleDenyParticipant(participant.id)}
                      >
                        Deny
                      </Button>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
    </MeetingContainer>
      </Box>
    </ThemeProvider>
  );
};

export default MeetingRoom; 