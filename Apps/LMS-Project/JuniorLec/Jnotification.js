import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput, 
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const NotificationScreen = ({ navigation ,route}) => {
  // State management
  const [broadcast, setBroadcast] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchSectionQuery, setSearchSectionQuery] = useState('');
  const [pickedFiles, setPickedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('send');
  const [showStudentList, setShowStudentList] = useState(false);
  const [showSectionList, setShowSectionList] = useState(false);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [mediaLink, setMediaLink] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchSections(),
        fetchStudents(),
        fetchNotifications()
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

 
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Dropdown/AllStudentData`);
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      throw error;
    }
  };
console.log('Student ID:', global.Jid);
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/JuniorLec/get/notifications?teacher_id=${global.Jid}`);
      const data = await response.json();
      if (data.status && data.data) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchStudentQuery) {
      const filtered = students.filter(student => 
        (student.name?.toLowerCase() || '').includes(searchStudentQuery.toLowerCase()) || 
        (student.regno?.toLowerCase() || '').includes(searchStudentQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchStudentQuery, students]);

  useEffect(() => {
    if (searchSectionQuery) {
      const filtered = sections.filter(section => 
        (section.name?.toLowerCase() || '').includes(searchSectionQuery.toLowerCase())
      );
      setFilteredSections(filtered);
    } else {
      setFilteredSections(sections);
    }
  }, [searchSectionQuery, sections]);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (!result.didCancel && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setPickedFiles([{
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const sendNotification = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }
  
    if (!broadcast && !studentId && !sectionId) {
      Alert.alert('Error', 'Please select a student or section');
      return;
    }
  
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sender', 'JuniorLecturer');
      formData.append('sender_id', global.Juserid);
  
      if (broadcast) {
        formData.append('Broadcast', 'true');
      } else {
        if (studentId) formData.append('Student_id', studentId);
        if (sectionId) formData.append('Student_Section', sectionId);
      }
  
      if (mediaType === 'image' && pickedFiles.length > 0) {
        formData.append('image', {
          uri: pickedFiles[0].uri,
          type: pickedFiles[0].type,
          name: pickedFiles[0].name,
        });
      } else if (mediaType === 'link' && mediaLink) {
        formData.append('image', mediaLink);
      }
  
      const response = await fetch(`${API_URL}/api/student/notification`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send notification');
      }
  
      Alert.alert('Success', 'Notification sent successfully');
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error in sendNotification:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMediaLink('');
    setSelectedImage(null);
    setPickedFiles([]);
    setBroadcast(false);
    setStudentId('');
    setSectionId('');
    setStudentName('');
    setSectionName('');
    setMediaType('none');
    setSearchStudentQuery('');
    setSearchSectionQuery('');
    setShowStudentList(false);
    setShowSectionList(false);
  };

  const handleStudentSelect = (id, name) => {
    setStudentId(id);
    setStudentName(name);
    setSectionId('');
    setSectionName('');
    setShowStudentList(false);
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Dropdown/AllSection`);
      const data = await response.json();
      const formattedSections = data.map(section => ({
        id: section.id,
        name: section.data
      }));
      setSections(formattedSections);
      setFilteredSections(formattedSections);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
      throw error;
    }
  };
  
  const handleSectionSelect = (id, name) => {
    setSectionId(id);
    setSectionName(name);
    setStudentId('');
    setStudentName('');
    setShowSectionList(false);
  };
  

  const renderSendView = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.formContainer}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Notification Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Title*"
          placeholderTextColor={colors.black}
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Description*"
          placeholderTextColor={colors.black}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionTitle}>Recipient</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => {
              setBroadcast(!broadcast);
              setStudentId('');
              setSectionId('');
              setStudentName('');
              setSectionName('');
            }}
          >
            <View style={[styles.radioCircle, broadcast && styles.radioSelected]}>
              {broadcast && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioLabel}>Broadcast to All Sections</Text>
          </TouchableOpacity>

          {!broadcast && (
            <>
              {/* Student Selection */}
              {!sectionId && (
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => {
                    setShowStudentList(!showStudentList);
                    setShowSectionList(false);
                  }}
                >
                  <Text style={studentName ? styles.inputText : styles.placeholderText}>
                    {studentName || 'Select Student'}
                  </Text>
                  <Icon 
                    name={showStudentList ? 'arrow-drop-up' : 'arrow-drop-down'} 
                    size={24} 
                    color={colors.black} 
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>
              )}

              {/* Section Selection */}
              {!studentId && (
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => {
                    setShowSectionList(!showSectionList);
                    setShowStudentList(false);
                  }}
                >
                  <Text style={sectionName ? styles.inputText : styles.placeholderText}>
                    {sectionName || 'Select Section'}
                  </Text>
                  <Icon 
                    name={showSectionList ? 'arrow-drop-up' : 'arrow-drop-down'} 
                    size={24} 
                    color={colors.black} 
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>
              )}

              {/* Student List */}
              {showStudentList && (
                <View style={styles.dropdownContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search students..."
                    placeholderTextColor={colors.black}
                    value={searchStudentQuery}
                    onChangeText={setSearchStudentQuery}
                  />
                  <FlatList
                    data={filteredStudents}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.studentItem}
                        onPress={() => handleStudentSelect(item.id, item.name)}
                      >
                        <Text style={styles.studentName}>{item.name || 'No name'}</Text>
                        <Text style={styles.studentRegNo}>{item.regno || 'No reg no'}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 200 }}
                    keyboardShouldPersistTaps="always"
                    ListEmptyComponent={
                      <View style={styles.emptyDropdown}>
                        <Text style={styles.emptyDropdownText}>No students found</Text>
                      </View>
                    }
                  />
                </View>
              )}

              {/* Section List */}
              {showSectionList && (
                <View style={styles.dropdownContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search sections..."
                    placeholderTextColor={colors.black}
                    value={searchSectionQuery}
                    onChangeText={setSearchSectionQuery}
                  />
                  <FlatList
                    data={filteredSections}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.sectionItem}
                        onPress={() => handleSectionSelect(item.id, item.name)}
                      >
                        <Text style={styles.sectionText}>{item.name || 'No section name'}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 200 }}
                    keyboardShouldPersistTaps="always"
                    ListEmptyComponent={
                      <View style={styles.emptyDropdown}>
                        <Text style={styles.emptyDropdownText}>No sections found</Text>
                      </View>
                    }
                  />
                </View>
              )}
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Media Attachment</Text>
        <View style={styles.mediaOptions}>
          <TouchableOpacity 
            style={[styles.mediaOption, mediaType === 'none' && styles.mediaOptionActive]}
            onPress={() => setMediaType('none')}
          >
            <Text style={styles.mediaOptionText}>None</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mediaOption, mediaType === 'image' && styles.mediaOptionActive]}
            onPress={() => setMediaType('image')}
          >
            <Text style={styles.mediaOptionText}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mediaOption, mediaType === 'link' && styles.mediaOptionActive]}
            onPress={() => setMediaType('link')}
          >
            <Text style={styles.mediaOptionText}>Link</Text>
          </TouchableOpacity>
        </View>

        {mediaType === 'image' && (
          <>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Icon name="image" size={24} color="white" />
              <Text style={styles.imagePickerText}>Select Image</Text>
            </TouchableOpacity>
            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImage}
                  onPress={() => {
                    setSelectedImage(null);
                    setPickedFiles([]);
                  }}
                >
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {mediaType === 'link' && (
          <TextInput
            style={styles.input}
            placeholder="Media URL"
            placeholderTextColor={colors.black}
            value={mediaLink}
            onChangeText={setMediaLink}
            keyboardType="url"
          />
        )}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={sendNotification}
          disabled={isLoading}
        >
          {isLoading ? (
           <ActivityIndicator size="large" color={colors.primaryDark} />
          ) : (
            <Text style={styles.submitButtonText}>Send Notification</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderNotificationsView = () => (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id.toString()}
      refreshControl={
        <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={['white']}
        tintColor="white" // Change this to your preferred color
        progressBackgroundColor="#333" // Background color of the refresh indicator area
       
        progressViewOffset={50} // How far down the refresh control starts
        title="Loading..." // Text that appears while refreshing
        titleColor="white" // Color of the loading text
      />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Icon name="notifications-off" size={48} color={colors.black} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <View style={styles.avatar}>
              <Icon name="account-circle" size={40} color="white" />
            </View>
            <View>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationTime}>
                {new Date(item.notification_date).toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.notificationBody}>{item.description}</Text>
          
          {item.media_type === 'image' && item.media && (
            <TouchableOpacity onPress={() => setFullscreenImage(item.media)}>
              <Image 
                source={{ uri: item.media }} 
                style={styles.notificationImage} 
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          {item.media_type === 'link' && item.media && (
            <TouchableOpacity 
              style={styles.linkContainer}
              onPress={() => Linking.openURL(item.media)}
            >
              <Icon name="link" size={20} color="white" />
              <Text style={styles.linkText} numberOfLines={1}>{item.media}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      keyboardShouldPersistTaps="always"
    />
  );
  const userData = route.params?.userData || {};
  const Tid = userData?.id || 'No ID';
  console.log(Tid);

  return (
    <SafeAreaView style={styles.container}>
      <Navbar
                   title="Notifications"
                   userName={userData.name}
                   des={'Junior Lecturer'}
                   showBackButton={true}
                   onLogout={() => navigation.replace('Login')}
                 />
          

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
            Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'receive' && styles.activeTab]}
          onPress={() => setActiveTab('receive')}
        >
          <Text style={[styles.tabText, activeTab === 'receive' && styles.activeTabText]}>
            Received 
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'send' ? renderSendView() : renderNotificationsView()}

      <Modal visible={!!fullscreenImage} transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setFullscreenImage(null)}
          >
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>
          <Image 
            source={{ uri: fullscreenImage }} 
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  refreshContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  refreshLoader: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
  },
  tabText: {
    fontSize: 16,
    color: colors.black,
  },
  activeTabText: {
  color:'black',
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.bg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.title,
    marginTop: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: 'black',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {


    
    color: 'black',
    flex: 1,
  },
  placeholderText: {
    color: colors.black,
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: colors.primaryDark,
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  radioLabel: {
    fontSize: 16,
    color:colors.primaryDark,
  },
  dropdownContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 1,
    maxHeight: 300,
  },
  searchInput: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    color: 'black',
  },
  sectionItem: {
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  sectionText: {
    fontSize: 16,
    color: 'black',
  },
  studentItem: {
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  studentName: {
    fontSize: 16,
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  studentRegNo: {
    fontSize: 14,
    color: colors.black,
    marginTop: 4,
  },
  emptyDropdown: {
    padding: 5,
    alignItems: 'center',
  },
  emptyDropdownText: {
    color: colors.red,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediaOption: {
    flex: 1,
    padding: 8,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  mediaOptionActive: {
    backgroundColor: colors.primaryDark,
    borderColor: 'white',
  },
  mediaOptionText: {
    color: 'white',
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark
    ,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  imagePickerText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,


    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationCard: {
    backgroundColor: colors.white, elevation: 2,
    borderRadius: 18,
    padding: 12,
    margin: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  notificationTime: {
    fontSize: 14,
    color: colors.black,
    marginTop: 4,
  },
  notificationBody: {
    fontSize: 15,
    color: 'black',
    marginBottom: 16,
  },
  notificationImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
  },
  linkText: {
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.black,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
});

export default NotificationScreen;