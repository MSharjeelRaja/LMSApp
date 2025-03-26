import React, { useEffect, useState } from 'react';

import { Pressable, myStyleheet, Text, View , TouchableOpacity, Dimensions, StyleSheet} from "react-native";
import colors from './colors';
import { TextInput } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
global.tuserid=0;

// Default IP (used only if AsyncStorage has no stored value)
export let API_URL = 'http://192.168.1.15:8000';
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
    <TouchableOpacity onPress={onPress} style={[myStyle.btn, style]}>
      <View style={myStyle.btnContent}>
        {icon && <View style={myStyle.icon}>{icon}</View>}
        <Text style={myStyle.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};








export const input = ({ placeholder, onChangeText, value, style }) => {
    return (
        <TextInput
            mode="outlined"
            placeholder={placeholder}
            onChangeText={onChangeText}
            value={value}
            style={[myStyle.input, style]}
        />
    );
};

export const Navbar = ({ title, userName, des, onLogout }) => {
  
  return (
      <View style={myStyle.navbar}>
        {/* LMS Title (Left Side) */}
        <Text style={myStyle.title}>{title}</Text>
  
        {/* Name & Type (Right Side) */}
        <View style={myStyle.userContainer}>
          <Text style={myStyle.studentName}>{userName}</Text>
          <Text style={myStyle.student}>{des}</Text>
        </View>
  
        {/* Logout Button (Right Side) */}
        <TouchableOpacity style={myStyle.logoutButton} onPress={onLogout}>
        <AntDesign name="logout" color="red" size={24} />
        </TouchableOpacity>
      </View>
    );
  };
  
  const myStyle = StyleSheet.create({  btn: {
    width: 150,
    height: 60,
    backgroundColor: colors.btn,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  btnContent: {
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',
  },
  icon: {
    marginBottom: 5,
  },
  text: {
    color: '#fff',fontSize:16
   
  },
    navbar: {
      width: '100%',  // Ensures full width
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primaryDark,
      paddingHorizontal: 15,
      paddingVertical: 12,
    },logoutButton: {
       
        borderColor: "red",      // Red border for emphasis
        borderRadius: 5,             // Slightly rounded corners
        padding: 4,                  // Padding for better spacing
        alignItems: "center", 
        justifyContent: "center",
      }
,    
titleText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.black || '#000000',
  marginBottom: 4,
},
messageText: {
  fontSize: 14,
  color: colors.text || '#343a40',
},
closeButton: {
  padding: 4,
  justifyContent: 'center',
  alignItems: 'center',
},
    title: {
      fontSize: 29,
      fontWeight: 'bold',
      color: 'white',
    },
    userContainer: {
      flex: 1,  // Pushes logout button to the right
      alignItems: 'flex-end',
      marginRight: 10, // Ensures spacing from logout button
    },
    studentName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
    student: {
      fontSize: 14,
      color: 'lightgray',
      marginTop: -2, // Slight adjustment to keep it close to name
    },
  
    btn: {
        backgroundColor: colors.secondary,
        borderRadius: 10,
        margin: 7,
        padding: 7,width:200
    },
    txtStyle: {
        textAlign: 'center',
        fontSize: 18,
        color: colors.white,
        
    },
    input: {
        margin: 10,
        backgroundColor: colors.light,
    },
});
