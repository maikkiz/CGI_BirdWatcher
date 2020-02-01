import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Header, Button, Input, ListItem } from 'react-native-elements';
import RNPickerSelect from 'react-native-picker-select';
import * as SQLite from 'expo-sqlite';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/EvilIcons';

export default function App() {

  const [species, setSpecies] = useState('');
  const [rarity, setRarity] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [observations, setObservations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const database = SQLite.openDatabase('observations.database');

  React.useEffect(() => {
    database.transaction(tx  => {
      tx.executeSql('create table if not exists species (id integer primary key not null, species text, notes text, rarity text, timestamp integer);');
    });
    updateList();
    getTimestamp();
  }, []);

  const getTimestamp = () => {
    var date = new Date().getDate(); //Current Date
    var month = new Date().getMonth() + 1; //Current Month
    var year = new Date().getFullYear(); //Current Year
    var hours = new Date().getHours(); //Current Hours
    var min = new Date().getMinutes(); //Current Minutes

    if (min < 10) {
      min = '0' + min;
    }
    setTimestamp(date + '.' + month + '.' + year + ' ' + hours + ':' + min);
  }

  const saveObservation = () => {
    getTimestamp();
  
    database.transaction(tx => {
      tx.executeSql('insert into species (species, notes, rarity, timestamp) values (?, ?, ?, ?);',
      [species, notes, rarity, timestamp]);
    }, null, updateList
    )
    setSpecies('');
    setRarity('');
    setNotes('');
    setTimestamp('');
  }

  const updateList = () => {
    database.transaction(tx => {
      tx.executeSql('select * from species;', [], (_, { rows}) =>
      setObservations(rows._array)
      );
    });
  }

  const cancelObservation = () => {
    setSpecies('');
    setRarity('');
    setNotes('');
    setTimestamp('');
  }

  const deleteObservation = (id) => {
    database.transaction(tx => {
      tx.executeSql('delete from species where id = ?;', [id]);}, 
      null, updateList
    )
  }

  const sortByRarity = () => {
    sortedList.sort((a, b) => b.rarity > a.rarity); 
    console.log(observations)
  }

  const sortBySpecies = () => {
    sortedList.sort((a, b) => a.species > b.species);
    console.log(observations)
  }

  const sortByDateTime = () => {
    sortedList.sort((a, b) => b.id - a.id);
    console.log(observations)

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
        <Text style={{textAlign: 'center', marginTop: 10, fontSize: 18}}>Sort by... </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        <Button 
        type="outline" 
        onPress={sortByRarity}       
        buttonStyle={{
          marginTop: 20,
          marginBottom: 10,
         
          borderColor: 'grey',
        }}
        titleStyle={{
          color: 'grey',
          fontSize: 18
        }}
        title="Rarity" 
      />
       <Button 
        type="outline" 
        onPress={sortBySpecies}       
        buttonStyle={{
          marginTop: 20,
          marginBottom: 10,
         
          borderColor: 'grey',
        }}
        titleStyle={{
          color: 'grey',
          fontSize: 18
        }}
        title="Species" 
      />
       <Button 
        type="outline" 
        onPress={sortByDateTime}       
        buttonStyle={{
          marginTop: 20,
          marginBottom: 10,
        
          borderColor: 'grey',
        }}
        titleStyle={{
          color: 'grey',
          fontSize: 18
        }}
        title="Date & time" 
      />
      </View>
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
                </View>
              }
         
              
              rightIcon={
                <Icon
                name='close'
                color='grey'
                size={30}
                onPress={() => deleteObservation(bird.id)}
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
              onPress={cancelObservation}
              onPressIn={toggleModal}       
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
              onPressIn={toggleModal}       
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

