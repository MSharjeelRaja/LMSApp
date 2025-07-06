import React from 'react';
import { 
  Pressable, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions, 
  StyleSheet 
} from "react-native";
import colors from './colors';
import { TextInput } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

global.tuserid = 0;

export let API_URL = 'http://192.168.1.5:8000';
export let IMG_URL = `${API_URL}/LMS-APIv2/api/Images`;

export const getApiUrl = async () => {
  const storedApiUrl = await AsyncStorage.getItem('api_url');
  if (storedApiUrl) {
    API_URL = storedApiUrl;
    IMG_URL = `${API_URL}/LMS-APIv2/api/Images`;
  }
};

export const MyBtn = ({ title, onPress, icon, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, style]}>
      <View style={styles.btnContent}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const Input = ({ placeholder, onChangeText, value, style }) => {
  return (
    <TextInput
      mode="outlined"
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={[styles.input, style]}
    />
  );
};

export const Navbar = ({ title, userName, des, onLogout, showBackButton = false }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.navbar}>
      {/* Left Section - Back Button & Title */}
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {title}
        </Text>
      </View>

      {/* Right Section - User Info and Logout */}
      <View style={styles.rightSection}>
        <View style={styles.userContainer}>
          <Text style={styles.studentName}>{userName}</Text>
          <Text style={styles.student}>{des}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <MaterialIcons name="logout" backgroundColor="rgba(195, 3, 3, 0.88)" 
         style={{borderRadius:8,padding:2}} color='white' size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 150,
    height: 60,
    backgroundColor: colors.btn,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  btnContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    margin: 10,
    backgroundColor: colors.light,
  },
  navbar: {
    width: '100%',
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContainer: {
    marginRight: 3,
    alignItems: 'flex-end',
  },
  studentName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },
  student: {
    fontSize: 11,
    color: 'lightgray',
  },
  logoutButton: {
    padding: 3,
  },
});