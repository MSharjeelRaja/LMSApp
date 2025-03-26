import { StyleSheet, Text, View, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import { Table, Row, Rows } from 'react-native-table-component';
import colors from '../ControlsAPI/colors';

const FullTimetable = ({ route }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const userData = route.params?.userData;
  const Tid = userData.id;
  console.log("this is teacher ID in full timetable=="+Tid);

  useEffect(() => {
    if (!Tid) return;

    const fetchTimetable = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Teachers/FullTimetable?teacher_id=${Tid}`);
        const data = await response.json();
        console.log(data)
        if (data.status === 'success' && Array.isArray(data.data)) {
          setTimetable(data.data);
        } else {
          console.error('Invalid data format:', data);
          setTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
      }
    };

    fetchTimetable();

    const timeout = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [Tid]);

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = new Date().getDay();
    return days[currentDayIndex];
  };

  const currentDay = getCurrentDay();

  return (
    <View style={styles.container}>
      <Navbar
        title="LMS" 
        userName={userData.name} 
        des={'Teacher'} 
        onLogout={() => navigation.replace('Login')}
      />
      {loading ? (
        <ActivityIndicator size="large" color="blue" style={styles.loader} />
      ) : timetable.length > 0 ? (
        <FlatList
          data={timetable}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.tableContainer, item.day === currentDay && styles.highlight]}>
              <Text style={styles.dayText}>{item.day}</Text>
              <Table borderStyle={{ borderWidth: 1, borderColor: '#000' }}>
                <Row 
                  data={[ "Time","Course","Venue", "Section"]} 
                  style={styles.head} 
                  textStyle={styles.headText} 
                />
                <Rows 
                  data={item.schedule.map(sch => [
                    `${sch.start_time} - ${sch.end_time}`
                    ,sch.description, 
                    sch.venue, sch.section, 
                    
                   
                  ])} 
                  textStyle={styles.text} 
                />
              </Table>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No Data Available</Text>
      )}
    </View>
  );
};

export default FullTimetable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    marginBottom: 20,
    padding: 7,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  highlight: {
    backgroundColor: colors.blueLighter,
  },
  dayText: {
    fontSize: 22,
    marginLeft: 4,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  head: {
    height: 37,
    backgroundColor: colors.blueLight,
  },
  headText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
  text: {
    color: colors.black,
    
    textAlign: 'center',
    padding: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#000',
    marginTop: 20,
  },
});
