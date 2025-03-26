import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { getApiUrl } from './Comps'; // Import function to update API_URL
import { MyBtn } from './Comps'; // Assuming you have a button component
import colors from './colors';

const IpChange = ({ navigation }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [fcmToken] = useState('f4ZnU4OvRImsH8B8EK5yeJ:APA91bHK4N-hoZf8mdellzZ24JfGxBRTOtahf7MA167s88QBMBERy0cpqcGrYQJowOG_RLRq8Qet0BWLKFfH9ENr9X0jSlkMQlgCqhHN1hQCg3F0iEqPhyo');

  useEffect(() => {
    const loadApiUrl = async () => {
      
      const storedUrl = await AsyncStorage.getItem('api_url');
      if (storedUrl) setApiUrl(storedUrl);
    };
    loadApiUrl();
  }, []);

  const handleSaveApiUrl = async () => {
    await AsyncStorage.setItem('api_url', apiUrl);
    await getApiUrl(); // Update global API_URL
    Alert.alert('Success', 'API URL updated successfully!');
  };

  const handleCopyFcmToken = () => {
    Clipboard.setString(fcmToken);
    Alert.alert('Copied', 'FCM token copied to clipboard!');
  };
  const handleCopyip = () => {
    Clipboard.setString(apiUrl);
    Alert.alert('Copied', 'FCM token copied to clipboard!');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.label}>API URL:</Text>
      <View style={styles.tokenContainer}>
      <TextInput
        style={styles.input}
        value={apiUrl}
        onChangeText={setApiUrl}
        placeholder={apiUrl}
      />
       <TouchableOpacity style={styles.copyButton} onPress={handleCopyip}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
        </View>
      <MyBtn title="Save API URL" onPress={handleSaveApiUrl} />

      <Text style={styles.label}>FCM Token:</Text>
      <View style={styles.tokenContainer}>
        <TextInput style={styles.tokenInput} value={fcmToken} editable={false} />
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyFcmToken}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
      <MyBtn title="Return To Login" onPress={() => navigation.navigate('Login')} />


    </View>
  );
};

export default IpChange;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.dark,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: colors.white,
  },
  input: {
    backgroundColor: colors.gray,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tokenInput: {
    flex: 1,
    backgroundColor: colors.gray,
    
    borderRadius: 5,
    padding: 10,
    color:colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginRight: 10,
  },
  copyButton: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

