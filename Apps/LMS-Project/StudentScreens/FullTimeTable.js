import { StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import { Table, Row, Rows } from 'react-native-table-component';
import colors from '../ControlsAPI/colors';

const FullTimetable = ({ route, navigation }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const userData = route.params?.userData;
  const Tid = userData?.id;
  const daysScrollRef = useRef(null);
  const ITEM_WIDTH = 90;

  // Updated days array with Sunday
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatTimeTo12Hour = (timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);
  
    // Custom AM/PM logic
    let ampm = 'AM';
    if (h >= 12 || h <= 7) {
      ampm = 'PM';
    } else if (h >= 8 && h <12 ) {
      ampm = 'AM';
    }
  
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };
  
  
  useEffect(() => {
    if (!Tid) return;
    const fetchTimetable = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Students/FullTimetable?student_id=${global.sid}`);
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data)) {
          setTimetable(data.data);
          const current = getCurrentDay();
          setSelectedDay(current);
          
          // Scroll to current day after data load
          setTimeout(() => {
            const index = days.indexOf(current);
            if (daysScrollRef.current && index !== -1) {
              daysScrollRef.current.scrollToOffset({
                offset: index * ITEM_WIDTH,
                animated: true
              });
            }
          }, 100);
        } else {
          console.error('Invalid data format:', data);
          setTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [Tid]);

  // Fixed current day calculation
  const getCurrentDay = () => {
    const dayIndex = new Date().getDay();
    return days[dayIndex === 0 ? 6 : dayIndex - 1]; // Sunday handling
  };

  const filteredTimetable = timetable.filter(item => item.day === selectedDay);

  return (
    <View style={styles.container}>
      <Navbar
                   title="Course Content"
                   userName={userData.name}
                   des={'Student'}
                   showBackButton={true}
                   onLogout={() => navigation.replace('Login')}
                 />
          

      <FlatList
        ref={daysScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={days}
        keyExtractor={(item) => item}
        renderItem={({ item: day }) => ( 
          <TouchableOpacity
  key={day}
  style={[
    styles.dayButton,
    selectedDay === day && styles.selectedDayButton,
    day === getCurrentDay() && styles.currentDayButton // Add this line
  ]}
  onPress={() => setSelectedDay(day)}
>
  <Text style={[
    styles.dayButtonText, 
    selectedDay === day && styles.selectedDayButtonText,
    day === getCurrentDay() && styles.currentDayText // Optional text color change
  ]}>
    {day.slice(0,3)}
  </Text>
</TouchableOpacity>
        )}
        contentContainerStyle={styles.daysContainer}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index
        })}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : filteredTimetable.length > 0 ? (
        <FlatList
          data={filteredTimetable}
          keyExtractor={(item) => item.day}
          renderItem={({ item }) => (
            <View style={[styles.tableContainer, styles.highlight]}>
              <Text style={styles.dayHeader}>
                {item.day}'s Schedule
              </Text>
              <Table borderStyle={{ borderWidth: 1, borderColor: colors.primary }}>
                <Row
                  data={["Time", "Course", "Venue", "Section"]}
                  style={[styles.head, styles.highlightHead]}
                  textStyle={styles.headText}
                />
                <Rows
                  data={item.schedule?.map(sch => [
                   `${formatTimeTo12Hour(sch.start_time)}\n${formatTimeTo12Hour(sch.end_time)}`,

                    sch.description || 'N/A',
                    sch.venue || 'N/A',
                    sch.section || 'N/A'
                  ])}
                  textStyle={styles.text}
                />
              </Table>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No classes scheduled for {selectedDay}</Text>
      )}
    </View>
  );
};

// Add to your existing styles:
const styles = StyleSheet.create({
  currentDayButton: {
  borderWidth: 2,
  borderColor: colors.blueNavy,backgroundColor:colors.primary
},
currentDayText: {
  color: colors.white,
},
  daysContainer: {
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
   
  },
  dayButton: {
    width: 80,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
 
  container: {
    
    backgroundColor: '#fff',
  },
  
  
  selectedDayButton: {
    backgroundColor: colors.primary,
  },
  dayButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  selectedDayButtonText: {
    color: colors.white,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    margin: 12,padding:5,paddingBottom:25,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlight: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  highlightHead: {
    backgroundColor: colors.primaryLight,
  },
  dayHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryDark,
    padding: 15,
    textAlign: 'center',
  },
  head: {
    height: 45,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headText: {
    fontWeight: 'bold',
    color: colors.primaryDark,
    fontSize: 16,
    textAlign: 'center',
  },
  text: {
    color: colors.black,
    textAlign: 'center',
    padding: 8,
    fontSize: 14,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 20,
    color: colors.gray,
    marginTop: 120,
    
    height:200
  },
});

export default FullTimetable;