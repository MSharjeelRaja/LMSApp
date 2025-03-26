import React, { useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  StatusBar
} from 'react-native';
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SelectList } from 'react-native-dropdown-select-list';
import CheckBox from '@react-native-community/checkbox';

const SendNotification = ({ route, navigation }) => {
  const userData = route.params?.userData || {};
  const Tid = userData?.id || 'No ID';
  console.log(Tid);

  // State variables
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [receiverType, setReceiverType] = useState('Student');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [section, setSection] = useState('');
  const [broadcast, setBroadcast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for sections and students
  const sectionData = [
    { key: '17', value: '17' },
    { key: '18', value: '18' },
    { key: '19', value: '19' },
    { key: '64', value: '20' }
  ];
  
  const students = [
    { id: '38', name: 'John Doe', section: 17},
    { id: '39', name: 'Jane Smith', section: 18 },
    { id: '40', name: 'Robert Johnson', section: 19 },
    { id: '41', name: 'Emily Davis', section: 20},
  ];

  // Filter students based on search query
  const filteredStudents = students.filter(
    student => student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setStudentName(student.name);
    setStudentId(student.id);
    setSection(student.section);
    setSearchQuery('');
  };

  const sendNotification = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please enter title and description');
      return;
    }

    if (!broadcast && !studentId) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    const notificationData = {
      title: title,
      description: description,
      sender: "Teacher",
      sender_id: global.tuserid,
      broadcast: broadcast,
      Student_Section: broadcast ? Section : null,
      Student_id: broadcast ? null : studentId,
    };

    console.log(`Full notification payload: ${JSON.stringify(notificationData)}`);

    try {
      const response = await fetch(`${API_URL}/api/student/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('Notification sent successfully:', result);

      Alert.alert('Success', 'Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }

    // Reset form
    setTitle('');
    setDescription('');
    setStudentName('');
    setStudentId('');
    setSection('');
    setSearchQuery('');
    setBroadcast(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      <Navbar
        title="Notification"
        userName={userData.name}
        des={'Teacher'}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.formContainer}>
        {/* Receiver Type Selection */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, receiverType === 'Admin' && styles.activeSegment]}
            onPress={() => setReceiverType('Admin')}
          >
            <Text style={[styles.segmentText, receiverType === 'Admin' && styles.activeSegmentText]}>Admin</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.segmentButton, receiverType === 'Student' && styles.activeSegment]}
            onPress={() => setReceiverType('Student')}
          >
            <Text style={[styles.segmentText, receiverType === 'Student' && styles.activeSegmentText]}>Student</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.segmentButton, receiverType === 'Gradr' && styles.activeSegment]}
            onPress={() => setReceiverType('Gradr')}
          >
            <Text style={[styles.segmentText, receiverType === 'Gradr' && styles.activeSegmentText]}>Gradr</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.segmentButton, receiverType === 'JLEC' && styles.activeSegment]}
            onPress={() => setReceiverType('JLEC')}
          >
            <Text style={[styles.segmentText, receiverType === 'JLEC' && styles.activeSegmentText]}>JLEC</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#777"
          />
        </View>

        {/* Notification Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notification description"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={4}
            placeholderTextColor="#777"
          />
        </View>

        {/* Broadcast Checkbox */}
        <View style={styles.checkboxContainer}>
          <Text style={styles.label}>Broadcast to all</Text>
          <CheckBox
            value={broadcast}
            onValueChange={setBroadcast}
            tintColors={{ true: colors.primary, false: '#777' }}
          />
        </View>

        {/* Section Selection (visible when broadcast is true) */}
        {broadcast && receiverType === 'Student' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Section</Text>
            <SelectList
              setSelected={(val) => setSection(val)}
              data={sectionData}
           
              placeholder="Select Section"
              boxStyles={styles.selectBox}
              inputStyles={styles.selectInput}
              dropdownStyles={styles.selectDropdown}
              dropdownTextStyles={styles.selectText}
              search={false}
            />
          </View>
        )}

        {/* Student Search and Selection (visible when broadcast is false and receiverType is Student) */}
        {!broadcast && receiverType === 'Student' && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Search Student</Text>
              <TextInput
                style={styles.input}
                placeholder="Type student name to search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#777"
              />
            </View>

            {searchQuery.length > 0 && (
              <View style={styles.searchResults}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectStudent(student)}
                    >
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentDetails}>ID: {student.id} | {student.section}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noResults}>No students found</Text>
                )}
              </View>
            )}

            {studentName && (
              <View style={styles.selectedStudentContainer}>
                <Text style={styles.label}>Selected Student</Text>
                <View style={styles.selectedStudentInfo}>
                  <Text style={styles.studentName}>{studentName}</Text>
                  <Text style={styles.studentDetails}>ID: {studentId} | {section}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Send Button */}
        <TouchableOpacity style={styles.sendButton} onPress={sendNotification}>
          <Icon name="send" size={24} color="white" />
          <Text style={styles.sendButtonText}>Send Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg, // Gray background
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#c0c0c0',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: colors.primary,
    borderRadius:8
  },
  segmentText: {
    color: '#000000', // Black text
    fontWeight: '500',
  },
  activeSegmentText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000', // Black text
  },
  input: {
    backgroundColor: '#d0d0d0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000', // Black text
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectBox: {
    backgroundColor: '#d0d0d0',
    borderColor: '#a0a0a0',
    color: '#000000',
  },
  selectInput: {
    color: '#000000',
  },
  selectDropdown: {
    backgroundColor: '#d0d0d0',
    borderColor: '#a0a0a0',
  },
  selectText: {
    color: '#000000',
  },
  searchResults: {
    backgroundColor: '#d0d0d0',
    borderWidth: 1,
    borderColor: '#a0a0a0',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#a0a0a0',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000', // Black text
  },
  studentDetails: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
  },
  noResults: {
    padding: 12,
    textAlign: 'center',
    color: '#333333',
  },
  selectedStudentContainer: {
    marginBottom: 16,
  },
  selectedStudentInfo: {
    backgroundColor: '#d0d0d0',
    borderRadius: 8,
    padding: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SendNotification;