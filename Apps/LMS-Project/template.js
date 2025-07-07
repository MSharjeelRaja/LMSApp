import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {API_URL, Navbar} from '../ControlsAPI/Comps';

const MyScreen = ({route, navigation}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const userData = route.params.userData;
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/endpoint`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Navbar
        title="Course Audit"
        userName={userData.name}
        des="Teacher"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          renderItem={({item}) => <Text>{item.name}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
});

export default MyScreen;
