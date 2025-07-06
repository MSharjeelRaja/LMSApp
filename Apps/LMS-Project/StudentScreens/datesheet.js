import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../ControlsAPI/colors';

const { width } = Dimensions.get('window');

const datesheet = ({route, navigation}) => {
  const userData = route.params?.userData || {};
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState('');
  const [datesheet, setDatesheet] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;


const calculateTimeRemaining = (examDate, examTime) => {
  try {
    // Parse "07-July-2025" format manually
    const [day, month, year] = examDate.split('-');
    const monthMap = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    // Parse "02:00:00" format
    const [hours, minutes, seconds] = examTime.split(':');
    
    // Create date object
    const examDateTime = new Date(
      parseInt(year), 
      monthMap[month], 
      parseInt(day), 
      parseInt(hours), 
      parseInt(minutes), 
      parseInt(seconds)
    );
    
    const now = new Date();
    const diffTime = examDateTime - now;
    
    if (diffTime <= 0) {
      return { text: 'Exam Completed', color: colors.gray, icon: 'check-circle' };
    }
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours24 = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { 
        text: `${days} day${days > 1 ? 's' : ''} left`, 
        color: days > 7 ? colors.green : days > 3 ? colors.orange : colors.red,
        icon: days > 7 ? 'schedule' : days > 3 ? 'warning' : 'priority-high'
      };
    } else if (hours24 > 0) {
      return { 
        text: `${hours24} hour${hours24 > 1 ? 's' : ''} left`, 
        color: colors.red1,
        icon: 'priority-high'
      };
    } else {
      return { 
        text: `${mins} minute${mins > 1 ? 's' : ''} left`, 
        color: colors.red1,
        icon: 'priority-high'
      };
    }
  } catch (error) {
    console.error('Date parsing error:', error);
    return { text: 'Invalid date', color: colors.gray, icon: 'error' };
  }
};
  const fetchTimetable = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Students/datesheet/${userData.id}`);
      const data = await response.json();
      console.log('Fetched timetable data:', data); 
      if (data.session) {
        if (data.mid && data.mid.length > 0) {
          setExamType('Mid Terms');
        } else {
          setExamType('Final Terms');
        }
        setDatesheet(data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      Alert.alert('Error', 'Failed to fetch datesheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userData.id) return;
    fetchTimetable();
    
    // Animate fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [userData.id]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const renderExamCard = (item, index) => {
  const timeRemaining = calculateTimeRemaining(item['Date'], item['Start Time']);
    return (
      <Animated.View 
        key={index} 
        style={[
          styles.card,
          { 
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>{item['Course Name']}</Text>
            <Text style={styles.courseCode}>{item['Course Code']}</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionText}>{item['Section Name']}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Icon name="calendar-today" size={16} color={colors.primary} />
              <Text style={styles.dateText}>{item['Date']}</Text>
              <Text style={styles.dayText}>({item['Day']})</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Icon name="access-time" size={16} color={colors.primary} />
              <Text style={styles.timeText}>
                {item['Start Time']} - {item['End Time']}
              </Text>
            </View>
          </View>
          
          <View style={[styles.countdownContainer, { backgroundColor: timeRemaining.color + '20' }]}>
            <Icon name={timeRemaining.icon} size={18} color={colors.red1} />
            <Text style={[styles.countdownText, { color: colors.red1}]}>
              {timeRemaining.text}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title="DateSheet"
          userName={userData.name}
          des="Student"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading datesheet...</Text>
        </View>
      </View>
    );
  }

  const examData = examType === 'Final Terms' ? datesheet.final : datesheet.mid;

  return (
    <View style={styles.container}>
      <Navbar
        title="DateSheet"
        userName={userData.name}
        des="Student"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.examTypeTitle}>
            {datesheet?.session ? examType : 'No Exams Scheduled'}
          </Text>
          {datesheet?.session && (
            <Text style={styles.sessionText}>Session: {datesheet.session}</Text>
          )}
        </View>
        
        {examData && examData.length > 0 ? (
          <View style={styles.examList}>
            {examData.map((item, index) => renderExamCard(item, index))}
          </View>
        ) : (
          <View style={styles.noExamsContainer}>
            <Icon name="event-busy" size={60} color={colors.gray} />
            <Text style={styles.noExamsText}>No exams scheduled</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default datesheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  examTypeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryDark || '#1a237e',
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 16,
    color: colors.primary || '#3f51b5',
    fontWeight: '500',
  },
  examList: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark || '#1a237e',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: colors.primary || '#3f51b5',
    fontWeight: '500',
  },
  sectionBadge: {
    backgroundColor: colors.primary || '#3f51b5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 12,
  },
  dateTimeContainer: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black || '#000',
  },
  dayText: {
    fontSize: 14,
    color: colors.gray || '#666',
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: colors.black || '#000',
    fontWeight: '500',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noExamsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noExamsText: {
    fontSize: 18,
    color: colors.gray || '#666',
    marginTop: 16,
  },
});