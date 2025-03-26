import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import colors from '../ControlsAPI/colors'
import font from '../ControlsAPI/font'
import { Navbar } from '../ControlsAPI/Comps'

const SubjectAttendence = ({navigation,route}) => {
  return (

    <View style={styles.con}>
        <Navbar
              title="LMS"
              userName="Sharjeel"
              des="student"
              onLogout={() => navigation.replace('Login')}
            />
      
      <Text style={styles.text}>SubjectAttendence</Text>
    </View>
  )
}

export default SubjectAttendence

const styles = StyleSheet.create({
  text:{
    color:colors.black,fontSize:25,marginTop:16,textAlign:'center'
  },
  con:{
    flex:1,
  }
})