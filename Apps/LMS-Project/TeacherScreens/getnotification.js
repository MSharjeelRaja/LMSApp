import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput, 
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker'; 
import RNFetchBlob from "react-native-blob-util";
import colors from '../ControlsAPI/colors';
import { API_URL } from '../ControlsAPI/Comps';

// Mock student data array
const mockStudents = [
  { id: '37', name: 'John Doe', section: '17', sectionId: 'GC&B' },
  { id: '38', name: 'Jane Smith', section: '18', sectionId: 'GC-8B' },

];

const NotificationScreen = ({ route, navigation }) => {
  const [broadcast, setBroadcast] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [Section, setSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pickedFiles, setPickedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('send');
  const [showStudentList, setShowStudentList] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState(mockStudents);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = mockStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(mockStudents);
    }
  }, [searchQuery]);

  const pickImage = async () => {
    try {
      const imageResponse = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1, 
      });
    
      if (!imageResponse.didCancel && !imageResponse.errorMessage && imageResponse.assets) {
        const selectedAsset = imageResponse.assets[0];
        setSelectedImage(selectedAsset.uri);
        setPickedFiles([{
          uri: selectedAsset.uri,
          name: selectedAsset.fileName,
          type: selectedAsset.type,
          size: selectedAsset.fileSize,
        }]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState('link');
  const [mediaLink, setMediaLink] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Select student handler
  const selectStudent = (student) => {
    setStudentId(student.id);
    setStudentName(student.name);
    setSection(student.section);
    setShowStudentList(false);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    const Tid = global.Tid || 'No ID';
    console.log(Tid);
    try {
      setIsLoading(true);
      console.log('hi')
      const response = await fetch(
        `${API_URL}/api/Teachers/get/notifications?teacher_id=${Tid}`
      );
      const data = await response.json();
      console.log(data)
      if (data.status && data.data) {
        setNotifications(data.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }
  
    try {
      const Tid = global.Tid || 1;
      const formData = new FormData();
  
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sender', 'Teacher');
      formData.append('sender_id', Tid);
  
      // Handle media based on type
      if (mediaType === 'image' && pickedFiles.length > 0) {
        const file = pickedFiles[0];
        formData.append('image', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || `image_${Date.now()}.jpg`,
        });
      } else if (mediaType === 'link' && mediaLink) {
        formData.append('image', mediaLink);
      }
  
      // Handle broadcast/student selection
      if (broadcast) {
        formData.append('broadcast', 'true');
        formData.append('Student_Section', Section);
      } else if (studentId) {
        formData.append('broadcast', 'false');
        formData.append('Student_id', studentId);
      }
  
      console.log('Sending notification with data:',formData);
  
      const response = await fetch(
        `${API_URL}/api/student/notification`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        Alert.alert('Success', 'Notification sent successfully');
        
        // Reset form
        setTitle('');
        setDescription('');
        setMediaLink('');
        setSelectedImage(null);
        setPickedFiles([]);
        setBroadcast(false);
        setStudentId('');
        setSection('');
        setStudentName('');
        
        // Refresh notifications
        fetchNotifications();
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', error.message || 'Failed to send notification');
    }
  };

  // Render Notification Send Section
  const renderSendNotificationView = () => (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        placeholderTextColor={colors.title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Description"
        multiline
        placeholderTextColor={colors.title}
        value={description}
        onChangeText={setDescription}
      />

      {/* Broadcast toggle */}
      <View style={styles.radioContainer}>
        <TouchableOpacity 
          style={styles.radioButton}
          onPress={() => {
            setBroadcast(!broadcast);
            if (!broadcast) {
              setStudentId('');
              setStudentName('');
            }
          }}
        >
          <Icon 
            name={broadcast ? 'radio-button-checked' : 'radio-button-unchecked'} 
            size={24} 
            color="#2563eb" 
          />
          <Text style={styles.text}>Broadcast to Entire Section</Text>
        </TouchableOpacity>
      </View>

      {broadcast ? (
        <TextInput
          style={styles.input}
          placeholder="Enter Section (e.g., A, B, C)"
          value={Section}
          onChangeText={setSection}
        />
      ) : (
        <View>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowStudentList(!showStudentList)}
          >
            <Text style={studentName ? styles.text : {color: colors.title}}>
              {studentName || 'Select Student'}
            </Text>
          </TouchableOpacity>
          
          {showStudentList && (
            <View style={styles.studentListContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.title}
              />
              <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.studentItem}
                    onPress={() => selectStudent(item)}
                  >
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentInfo}>ID: {item.id} | Section: {item.section}</Text>
                  </TouchableOpacity>
                )}
                style={styles.studentList}
              />
            </View>
          )}
          
          {studentId && (
            <View style={styles.selectedStudentContainer}>
              <Text style={styles.selectedStudentText}>
                Selected: {studentName} (ID: {studentId}, Section: {Section})
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Media Type Selection */}
      <View style={styles.mediaTypeContainer}>
        <Text style={styles.mediaTypeLabel}>Media Type:</Text>
        <TouchableOpacity 
          style={[styles.mediaTypeButton, mediaType === 'link' && styles.activeMediaType]}
          onPress={() => setMediaType('link')}
        >
          <Text style={styles.mediaTypeButtonText}>Link</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mediaTypeButton, mediaType === 'image' && styles.activeMediaType]}
          onPress={() => setMediaType('image')}
        >
          <Text style={styles.mediaTypeButtonText}>Image</Text>
        </TouchableOpacity>
      </View>

      {/* Media Input */}
      {mediaType === 'link' ? (
        <TextInput
          style={styles.input}
          placeholder="Media URL"
          value={mediaLink}
          onChangeText={setMediaLink}
          placeholderTextColor={colors.title}
        />
      ) : (
        <View>
          <TouchableOpacity 
            style={styles.imagePickerButton}
            onPress={pickImage}
          >
            <Icon name="image" size={24} color="#2563eb" />
            <Text style={styles.imagePickerText}>Pick an Image</Text>
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.previewImage} 
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setPickedFiles([]);
                }}
              >
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={styles.sendButton}
        onPress={sendNotification}
      >
        <Text style={styles.sendButtonText}>Send Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render Notifications View
  const renderNotificationsView = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={isLoading} 
          onRefresh={fetchNotifications} 
        />
      }
    >
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications found</Text>
      ) : (
        notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationCard}>
            {/* Sender Info */}
            <View style={styles.senderInfo}>
              {notification.sender_image ? (
                <Image 
                  source={{ uri: notification.sender_image }} 
                  style={styles.senderImage}
                />
              ) : (
                <View style={styles.senderPlaceholder}>
                  <Icon name="person" size={24} color="#666" />
                </View>
              )}
              <View style={styles.senderDetails}>
                <Text style={styles.senderName}>{notification.sender_name}</Text>
                <Text style={styles.notificationDate}>
                  {new Date(notification.notification_date).toLocaleString()}
                </Text>
              </View>
            </View>
            
            {/* Notification Content */}
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationDescription}>
                {notification.description}
              </Text>
              
              {/* Media Display */}
              {notification.media_type === 'image' && notification.media && (
                <TouchableOpacity 
                  onPress={() => setFullscreenImage(notification.media)}
                  style={styles.mediaContainer}
                >
                  <Image 
                    source={{ uri: notification.media }} 
                    style={styles.mediaImage} 
                  />
                  <Text style={styles.mediaTypeBadge}>Image</Text>
                </TouchableOpacity>
              )}
              
              {notification.media_type === 'link' && notification.media && (
                <TouchableOpacity 
                  style={styles.linkContainer}
                  onPress={() => Linking.openURL(notification.media)}
                >
                  <Icon name="link" size={24} color="#2563eb" />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {notification.media}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // Side effect to fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <View style={styles.container}>
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            activeTab === 'send' ? styles.activeToggle : styles.inactiveToggle
          ]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={styles.toggleButtonText}>Send Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            activeTab === 'receive' ? styles.activeToggle : styles.inactiveToggle
          ]}
          onPress={() => setActiveTab('receive')}
        >
          <Text style={styles.toggleButtonText}>Receive Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering Based on Active Tab */}
      {activeTab === 'send' ? renderSendNotificationView() : renderNotificationsView()}

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent={true}
        onRequestClose={() => setFullscreenImage(null)}
      >
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    color: colors.title
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#2563eb',
  },
  inactiveToggle: {
    backgroundColor: '#e0e0e0',
  },
  toggleButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  input: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: colors.blueGray,
    color: colors.black,
  },
  multilineInput: {
    height: 100,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  imagePickerText: {
    marginLeft: 10,
    color: colors.black,
  },
  imagePreviewContainer: {
    position: 'relative',
    margin: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  studentListContainer: {
    marginHorizontal: 10,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    color: colors.black,
  },
  studentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  studentName: {
    fontWeight: 'bold',
    color: colors.black,
  },
  studentInfo: {
    fontSize: 12,
    color: '#666',
  },
  studentList: {
    flexGrow: 0,
  },
  selectedStudentContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
  },
  selectedStudentText: {
    color: colors.black,
  },
  mediaTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  mediaTypeLabel: {
    marginRight: 10,
    color: colors.black,
  },
  mediaTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  activeMediaType: {
    backgroundColor: '#2563eb',
  },
  mediaTypeButtonText: {
    color: colors.black,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  senderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  senderPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontWeight: 'bold',
    color: colors.black,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  notificationContent: {
    marginLeft: 50,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.black,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  mediaContainer: {
    position: 'relative',
    marginTop: 10,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  linkText: {
    color: '#2563eb',
    marginLeft: 8,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.black,
  },
});

export default NotificationScreen;