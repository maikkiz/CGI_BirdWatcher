import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView,  Alert } from 'react-native';
import { Header, Button, Input, ListItem } from 'react-native-elements';
import RNPickerSelect from 'react-native-picker-select';
import * as SQLite from 'expo-sqlite';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/EvilIcons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';

export default function App() {

  const [species, setSpecies] = useState('');
  const [rarity, setRarity] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(null);
  const [observations, setObservations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [saving, setSaving] = useState('');

  const db = SQLite.openDatabase('observationsdb.db');

  React.useEffect(() => {
    db.transaction(tx  => {
      tx.executeSql('create table if not exists observation (id integer primary key not null, species text, notes text, rarity text, timestamp text, longitude integer, latitude integer);');
    });
    updateList();
    getLocation();
    getTimestamp();
    console.log(latitude);
  }, []);

  const getLocation = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      Alert.alert('No permission to access location');
    }
    else {
      let location = await Location.getCurrentPositionAsync({});
      setLongitude(JSON.stringify(location.coords.longitude));
      setLatitude(JSON.stringify(location.coords.latitude));
    }
  };

  const getTimestamp = () => {
    var date = new Date().getDate(); //Current Date
    var month = new Date().getMonth() + 1; //Current Month
    var year = new Date().getFullYear(); //Current Year
    var hours = new Date().getHours(); //Current Hours
    var min = new Date().getMinutes(); //Current Minutes

    if (min < 10) {
      setTimestamp(date + '.' + month + '.' + year + ' ' + hours + ':0' + min);
    }
    else {
      setTimestamp(date + '.' + month + '.' + year + ' ' + hours + ':' + min);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    setSpecies('');
    setRarity('');
    setNotes('');
  };

  const saveObservation = async () => {
    Waiter();
    await getLocation();
    getTimestamp();

    while (longitude == 0 && latitude == 0) {
      console.log('Waiting for coordinates...');
    };
  
    db.transaction(tx => {
      tx.executeSql('insert into observation (species, notes, rarity, timestamp, longitude, latitude) values (?, ?, ?, ?. ?, ?);',
      [species, notes, rarity, timestamp, longitude, latitude]);
      toggleModal();
    }, null, updateList
    )
    console.log(observations);
  };

  const updateList = () => {
    db.transaction(tx => {
      tx.executeSql('select * from observation;', [], (_, { rows }) =>
      setObservations(rows._array)
      );
    });
  };

  const deleteObservation = (id) => {
    db.transaction(tx => {
      tx.executeSql('delete from observation where id = ?;', [id]);}, 
      null, updateList
    )
  };

  const Waiter = () => {
    setSaving('Saving... May take a few seconds!');
  }

  const placeholder = {
    label: 'Select rarity...',
    value: null,
    color: '#9EA0A4',
    marginLeft: 10
  };

  const pickerItems = [
    {
      label: 'Common',
      value: 'Common',
    },
    {
      label: 'Rare',
      value: 'Rare',
    },
    {
      label: 'Extremely rare',
      value: 'Extremely rare',
    },
  ];
 
  const sortedList = observations.slice().sort((a, b) => b.id - a.id);
  
  return (
    <View style={styles.container}>
      <Header
        containerStyle={{
          backgroundColor: '#006666'
        }}
        centerComponent={{ 
          text: 'Bird Watcher', 
          style: { color: '#fff', fontSize: 30 }
        }}
      />
      <ScrollView>
        <Text style={{textAlign: 'center', fontSize: 25, marginTop: 10}}>List of observations </Text>
        {
          sortedList.map((bird, index) => (
            <ListItem
              key={index}
              title={
              <View>
                <Text style={{fontWeight: 'bold', fontSize:18}}>Species: {bird.species}</Text>
                </View>
                }
              subtitle={
                <View>
                  <Text style={{fontSize: 15}}>Notes: {bird.notes}</Text>
                  <Text style={{fontSize: 15}}>Rarity: {bird.rarity}</Text>
                  <Text style={{fontSize: 15}}>Date and time: {bird.timestamp}</Text>
                  <Text style={{fontSize: 15}}>Longitude: {bird.longitude}</Text>
                  <Text style={{fontSize: 15}}>Latitude: {bird.latitude}</Text>
                </View>
              }
              rightIcon={
                <Icon
                name='close'
                color='grey'
                size={30}
                onPress={() => Alert.alert('Are you sure you want to delete this observation?', '',
                [
                  {text: 'Cancel', onPress: () => console.log('Deletion cancelled'), style: 'cancel'},
                  {text: 'Delete', onPress: () => {deleteObservation(bird.id)}},
                ],
                { cancelable: false }
                )}
                />
              }
              bottomDivider
            />
          ))
        }
      </ScrollView>  

      <Button 
        type="outline" 
        onPress={toggleModal}       
        buttonStyle={{
          marginTop: 20,
          marginBottom: 10,
          marginRight: 10,
          marginLeft:10,
          borderColor: 'grey',
        }}
        titleStyle={{
          color: 'grey',
          fontSize: 18
        }}
        title="Add observation" 
      />
      
      <Modal isVisible={isModalVisible}>
        <View style={{ 
          backgroundColor: "#fff",
          marginTop: 25,
          borderRadius: 5 
        }}>
          <Text style={{fontSize: 22, textAlign: 'center', marginTop: 10}}>Add new observation </Text>
          <Input
            placeholder='Species'
            onChangeText={species => setSpecies(species)}
            value={species}
          />

          <View style={{marginBottom: 8}}>
            <Input
              multiline={true}
              placeholder='Notes'
              onChangeText={notes => setNotes(notes)}
              value={notes}
            />
          </View>

          <RNPickerSelect
            placeholder={placeholder}
            onValueChange={rarity => setRarity(rarity)}
            useNativeAndroidPickerStyle={false}
            textInputProps={{ 
              underlineColorAndroid: 'grey', 
              fontSize: 20, 
              paddingBottom: 11, 
              marginLeft: 6, 
              marginRight: 6, 
              paddingLeft: 5 }}
              items={pickerItems}
          />
             
          <View style={{flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 15}}>
            <Button 
              type="outline" 
              onPress={toggleModal}       
              buttonStyle={{
                marginTop: 20, 
                borderColor: 'red',
                width: 100
              }}
              titleStyle={{
                color: 'red',
                fontSize: 18
              }}
              title="Cancel" 
            />
            <Button 
              type="outline" 
              onPress={saveObservation}   
              buttonStyle={{
                marginTop: 20,
                borderColor: 'green',
                width: 100
              }}
              titleStyle={{
                color: 'green',
                fontSize: 18
              }}
              title="Save" 
            />
          </View>
          <Text style={{textAlign:'center', fontSize:16, marginTop:2,marginBottom:10}}>{saving}</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    
  },
  thumbnail: {
    width: 300,
    height: 300,
    resizeMode: "cover"
  }
});

