import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Dimensions,
  StatusBar,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';

const { width } = Dimensions.get('window');

const TeacherCard = ({ teacher, onPress }) => {
  console.log('its Grader');
  return (
    <TouchableOpacity 
      style={styles.teacherCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={teacher.teacher_image ? { uri: teacher.teacher_image } : require('../images/as.png')}
        style={styles.teacherImage}
        resizeMode="cover"
      />
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{teacher.teacher_name}</Text>
        <Text style={styles.teacherSession}>{teacher.session_name}</Text>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>Feedback:</Text>
          <Text style={styles.feedbackText}>{teacher.feedback || 'Not available'}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          teacher["Allocation Status"] === "active" ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[
            styles.statusText, 
            teacher["Allocation Status"] === "active" ? styles.activeText : styles.inactiveText
          ]}>
            {teacher["Allocation Status"] === "active" ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#94A3B8" style={styles.teacherCardArrow} />
    </TouchableOpacity>
  );
};

const InfoModal = ({ visible, onClose, graderInfo }) => {
  if (!graderInfo) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Grader Information</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.profileSection}>
              <Image
                source={graderInfo.image ? { uri: graderInfo.image } : require('../images/as.png')}
                style={styles.modalProfileImage}
                resizeMode="cover"
              />
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{graderInfo.grader_name}</Text>
                <Text style={styles.profileDetail}>{graderInfo.grader_RegNo}</Text>
                <Text style={styles.profileDetail}>Section: {graderInfo.grader_section}</Text>
                <View style={styles.typeContainer}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={styles.typeText}>{graderInfo.type}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Grader = ({ navigation, route }) => {
  const [graderInfo, setGraderInfo] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedGraderInfo, setSelectedGraderInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const userData = route.params || {};
  
  global.sid = userData.id;
  
  useEffect(() => {
    fetchGraderInfo();
  }, []);
  
  const fetchGraderInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Grader/GraderInfo?student_id=${global.sid}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      const result = JSON.parse(text);
      console.log('Grader Info:', result);
     
      if (result.data) {
        setGraderInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleViewInfo = (info) => {
    setSelectedGraderInfo(info);
    setIsModalVisible(true);
  };

  const handleTeacherPress = (teacher) => {
    navigation.navigate('Tasks', {
      teacherId: teacher.teacher_id,
      graderId: graderInfo[0]?.grader_id,
      graderName: graderInfo[0]?.grader_name,
      teacherName: teacher.teacher_name,
      sessionName: teacher.session_name,
      status: teacher["Allocation Status"],
      feedback: teacher.feedback,
      image: teacher.teacher_image
    });
  };

  // Get current and previous session teachers
  const currentSessionTeachers = graderInfo[0]?.["Grader Allocations"]?.filter(
    teacher => teacher["Session is ? "] === " Current Session" || teacher["Allocation Status"] === "active"
  ) || [];
  
  const previousSessionTeachers = graderInfo[0]?.["Grader Allocations"]?.filter(
    teacher => teacher["Session is ? "] === " Previous Session" || teacher["Allocation Status"] === "non-active"
  ) || [];
  
  // Filter teachers based on search query
  const filterTeachers = (teachers) => {
    if (!searchQuery) return teachers;
    return teachers.filter(teacher => 
      teacher.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.session_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredCurrentTeachers = filterTeachers(currentSessionTeachers);
  const filteredPreviousTeachers = filterTeachers(previousSessionTeachers);
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <View style={styles.mainContainer}>
    
      <Navbar
        title="LMS"
        userName={userData.name}
        des={'Grader'}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Section */}
        <TouchableOpacity 
          style={styles.profileContainer}
          activeOpacity={0.9}
          onPress={() => graderInfo.length > 0 && handleViewInfo(graderInfo[0])}
        >
          <View style={styles.profileTopRow}>
            <View style={styles.profileImageContainer}>
              <Image
                source={userData.Image ? { uri: userData.Image } : require('../images/as.png')}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <View style={styles.badgeContainer}>
                <Icon name="verified" size={18} color="#4361EE" />
              </View>
            </View>
            
            <View style={styles.profileHeaderInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName} numberOfLines={1}>{userData.name}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('notification', userData)}
                  style={styles.notificationButton}
                >
                  <Icon name="notifications" size={22} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.userInfoContainer}>
                <Icon name="school" size={16} color="#64748B" style={styles.infoIcon} />
                <Text style={styles.userInfo}>{userData.Program}</Text>
              </View>
              
              <View style={styles.userInfoContainer}>
                <Icon name="badge" size={16} color="#64748B" style={styles.infoIcon} />
                <Text style={styles.userInfo}>{userData.RegNo}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.CGPA}</Text>
              <Text style={styles.statLabel}>CGPA</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentSessionTeachers.length}</Text>
              <Text style={styles.statLabel}>Active Courses</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{previousSessionTeachers.length}</Text>
              <Text style={styles.statLabel}>Past Courses</Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            {userData["Is Grader ?"] && (
             <TouchableOpacity
             style={styles.graderButton}
             onPress={() => navigation.goBack()} // Goes back to the previous screen
           >
                <Icon name="swap-horiz" size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Switch to Student</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => graderInfo.length > 0 && handleViewInfo(graderInfo[0])}>
              <Icon name="info" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={22} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teachers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="cancel" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      
        {/* Tab Bar for Session Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'current' && styles.activeTabButton]}
            onPress={() => setActiveTab('current')}
            activeOpacity={0.7}
          >
            <Icon 
              name="event-available" 
              size={20} 
              color={activeTab === 'current' ? colors.secondary : '#64748B'} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
              Current Session
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'previous' && styles.activeTabButton]}
            onPress={() => setActiveTab('previous')}
            activeOpacity={0.7}
          >
            <Icon 
              name="history-edu" 
              size={20} 
              color={activeTab === 'previous' ? colors.secondary : '#64748B'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'previous' && styles.activeTabText]}>
              Previous Session
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.container}>
          {graderInfo.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="school" size={64} color="#e0e0e0" />
              <Text style={styles.emptyStateTitle}>No Assignments Yet</Text>
              <Text style={styles.emptyStateText}>You don't have any teacher assignments at the moment</Text>
            </View>
          ) : (
            <>
              {activeTab === 'current' && (
                <View style={styles.sessionSection}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleContainer}>
                      <Icon name="event-available" size={20} color="#4361EE" />
                      <Text style={styles.sessionTitle}>Current Session</Text>
                    </View>
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionBadgeText}>Spring-2025</Text>
                    </View>
                  </View>
                  
                  {filteredCurrentTeachers.length > 0 ? (
                    filteredCurrentTeachers.map((teacher, index) => (
                      <TeacherCard 
                        key={index} 
                        teacher={teacher} 
                        onPress={() => handleTeacherPress(teacher)}
                      />
                    ))
                  ) : (
                    <View style={styles.noTeachersContainer}>
                      {searchQuery ? (
                        <>
                          <Icon name="search-off" size={32} color="#bdbdbd" />
                          <Text style={styles.noTeachersText}>No teachers match your search</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="sentiment-dissatisfied" size={32} color="#bdbdbd" />
                          <Text style={styles.noTeachersText}>No active teachers in current session</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
              
              {activeTab === 'previous' && (
                <View style={styles.sessionSection}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleContainer}>
                      <Icon name="history-edu" size={20} color="#4361EE" />
                      <Text style={styles.sessionTitle}>Previous Session</Text>
                    </View>
                   
                  </View>
                  
                  {filteredPreviousTeachers.length > 0 ? (
                    filteredPreviousTeachers.map((teacher, index) => (
                      <TeacherCard 
                        key={index} 
                        teacher={teacher} 
                        onPress={() => handleTeacherPress(teacher)}
                      />
                    ))
                  ) : (
                    <View style={styles.noTeachersContainer}>
                      {searchQuery ? (
                        <>
                          <Icon name="search-off" size={32} color="#bdbdbd" />
                          <Text style={styles.noTeachersText}>No teachers match your search</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="sentiment-dissatisfied" size={32} color="#bdbdbd" />
                          <Text style={styles.noTeachersText}>No previous session teachers available</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      
      <InfoModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        graderInfo={selectedGraderInfo} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7ff',
  },
  scrollView: {
    flex: 1,
  },
  
  // Profile Section Styles
  profileContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    elevation: 6,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#e0e6ff',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e6ff',
    elevation: 2,
  },
  profileHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoIcon: {
    marginRight: 8,
  },
  userInfo: {
    fontSize: 14,
    color: '#64748B',
  },
  notificationButton: {
    backgroundColor: colors.secondary,
    padding: 6,
    borderRadius: 12,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  graderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  infoButton: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    flex: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 15,
    padding: 4,
  },
  clearButton: {
    padding: 4,
  },
  
  // Tab Bar Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  activeTabButton: {
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    fontWeight: '600',
    color: colors.secondary,
  },
  
  // Content Styles
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 2,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  sessionSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 8,
  },
  sessionBadge: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  previousSessionBadge: {
    backgroundColor: '#EDE9FE',
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4338CA',
  },
  
  // Teacher Card Styles
  teacherCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  teacherImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: 'white',
  },
  teacherInfo: {
    marginLeft: 16,
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  teacherSession: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B5563',
    marginRight: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: -5,
    right: -39,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 1,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
   
  },
  activeText: {
    color: '#166534',
  },
  inactiveText: {
    color: '#B91C1C',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  teacherCardArrow: {
    marginLeft: 8,
  },
  noTeachersContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  noTeachersText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    borderWidth: 3,
    borderColor: '#e0e6ff',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  profileDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#fef9c3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#854d0e',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
});

export default Grader;