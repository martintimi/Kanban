import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button 
} from '@mui/material';
import { SOUNDS } from '../../utils/soundManager';
import { SoundManager } from '../../utils/soundManager';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [selectedSound, setSelectedSound] = useState(
    user?.settings?.notificationSound || 'NOTIFICATION_1'
  );

  const handleSoundChange = async (event) => {
    const newSound = event.target.value;
    setSelectedSound(newSound);
    
    // Play sound preview
    await SoundManager.playNotification(newSound);
    
    // Save to user preferences
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      'settings.notificationSound': newSound
    });
  };

  const handleTestSound = () => {
    SoundManager.playNotification(selectedSound);
  };

  return (
    <Box sx={{ p: 3 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Notification Sound</InputLabel>
        <Select
          value={selectedSound}
          onChange={handleSoundChange}
          label="Notification Sound"
        >
          <MenuItem value="NOTIFICATION_1">Default Notification</MenuItem>
          <MenuItem value="NOTIFICATION_2">Soft Chime</MenuItem>
          <MenuItem value="NOTIFICATION_3">Alert</MenuItem>
          <MenuItem value="BELL">Bell</MenuItem>
          <MenuItem value="DING">Ding</MenuItem>
        </Select>
      </FormControl>
      
      <Button 
        variant="outlined" 
        onClick={handleTestSound}
        sx={{ mt: 2 }}
      >
        Test Sound
      </Button>
    </Box>
  );
};

export default NotificationSettings; 