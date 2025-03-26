import { Alert, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import { Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';

import Icon from "react-native-vector-icons/MaterialIcons";
import { Button } from 'react-native-paper';

const AttendeceAll = ({ navigation }) => {
  const [subjects, setSubjects] = useState([
    { course: 'Programming Fundamental', perc: 80,tid:1 },
    { course: 'TBW', perc: 60 ,tid:2}
  ]);

  return (
    <View style={styles.main}>
      <Navbar
        title="LMS"
        userName="Sharjeel"
        des="student"
        onLogout={() => navigation.replace('Login')}
      />

      <View style={styles.container}>
        <Text style={styles.htext}>Attendance</Text>
        <View style={styles.scontainer}>
          {subjects.map((subject, index) => (
            <View key={index} style={styles.subject}>
              <Text style={styles.text}>{subject.course}</Text>
              <Button onPress={() => navigation.replace('SubjectAttendence', { subject })}>
  <View style={styles.percentage}>
    <Text style={styles.ptext}>{subject.perc}%</Text>
    <Icon name="keyboard-arrow-right" size={25} color="white" />
  </View>
</Button>

            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default AttendeceAll;

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: colors.white },
  container: { margin: 15 },
  htext: { fontSize: 30, textAlign: 'center', color: colors.blue, },
  scontainer: { marginTop: 10 },
  subject: {
    backgroundColor: colors.white,
    paddingVertical: 9,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 15,
    borderColor: colors.gray,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  
  text: {
    fontSize: 16,
    color: colors.black
    ,
  
  },
  
  percentage: {
    width: 80,
    height: 30,
    flexDirection: 'row',
    borderRadius: 15,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8
  },
  ptext: { fontSize: 16, color: colors.white,  }
});
