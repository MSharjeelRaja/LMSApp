import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { API_URL } from '../ControlsAPI/Comps';
const Grader = () => {
  const [graderInfo, setGraderInfo] = useState([]);

  useEffect(() => {
    fetchGraderInfo();
  }, []);

  const fetchGraderInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Grader/GraderInfo?student_id=39`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      

      const text = await response.text();

      console.log('Raw Response:', text);

      const result = JSON.parse(text);
      if (result.data) {
        setGraderInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grader Information</Text>
      <FlatList
        data={graderInfo}
        keyExtractor={(item) => item.grader_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.heading}>👨‍🎓 Name:</Text>
            <Text style={styles.text}>{item.grader_name}</Text>
            <Text style={styles.heading}>📜 Reg No:</Text>
            <Text style={styles.text}>{item.grader_RegNo}</Text>
            <Text style={styles.heading}>📌 Section:</Text>
            <Text style={styles.text}>{item.grader_section}</Text>
            <Text style={styles.heading}>📅 Session:</Text>
            <Text style={styles.text}>{item["This Session"]}</Text>
            <Text style={styles.heading}>🏆 Type:</Text>
            <Text style={styles.text}>{item.type}</Text>

            <Text style={styles.subtitle}>Grader Allocations:</Text>
            <FlatList
              data={item["Grader Allocations"]}
              keyExtractor={(alloc, index) => index.toString()}
              renderItem={({ item: alloc }) => (
                <View style={styles.allocationCard}>
                  <Text style={styles.heading}>📚 Teacher:</Text>
                  <Text style={styles.text}>{alloc.teacher_name}</Text>
                  <Text style={styles.heading}>🎓 Session:</Text>
                  <Text style={styles.text}>{alloc.session_name}</Text>
                  <Text style={styles.heading}>⚡ Status:</Text>
                  <Text style={styles.text}>{alloc["Allocation Status"]}</Text>
                  <Text style={styles.heading}>📝 Feedback:</Text>
                  <Text style={styles.text}>{alloc.feedback || 'N/A'}</Text>
                </View>
              )}
            />
          </View>
        )}
      />
    </View>
  );
};

export default Grader;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, marginVertical: 10, borderRadius: 10, elevation: 3 },
  allocationCard: { backgroundColor: '#e9f5ff', padding: 10, marginVertical: 5, borderRadius: 5 },
  text: { fontSize: 16, color: '#555' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: '#222' },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#333' },  // Bold and bigger for headings
});
