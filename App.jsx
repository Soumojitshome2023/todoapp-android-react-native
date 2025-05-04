import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';

const FILE_PATH = `${RNFS.ExternalDirectoryPath}/todo_list.json`; // This works for Android 10+ and newer

const App = () => {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const exists = await RNFS.exists(FILE_PATH);
        if (exists) {
          const content = await RNFS.readFile(FILE_PATH, 'utf8');
          if (content) {
            setTaskList(JSON.parse(content));
          }
        } else {
          await RNFS.writeFile(FILE_PATH, JSON.stringify([]), 'utf8');
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const saveData = async () => {
      try {
        await RNFS.writeFile(FILE_PATH, JSON.stringify(taskList), 'utf8');
      } catch (error) {
        console.error('Error saving tasks:', error);
      }
    };
    saveData();
  }, [taskList]);

  const handleAddOrUpdateTask = () => {
    if (!task.trim()) return;

    if (editingTaskId) {
      setTaskList((prev) =>
        prev.map((item) =>
          item.id === editingTaskId ? { ...item, text: task.trim() } : item
        )
      );
      setEditingTaskId(null);
    } else {
      const newTask = {
        id: Date.now().toString(),
        text: task.trim(),
        done: false,
      };
      setTaskList((prev) => [newTask, ...prev]);
    }

    setTask('');
    Keyboard.dismiss();
  };

  const handleDeleteTask = (id) => {
    setTaskList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditTask = (item) => {
    setTask(item.text);
    setEditingTaskId(item.id);
  };

  const toggleDone = (id) => {
    setTaskList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.taskItem}>
      <Text style={{ marginRight: 5 }}>
        {index + 1})
      </Text>
      <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.checkbox}>
        <Text style={{ color: item.done ? '#28a745' : '#aaa', fontSize: 20 }}>
          {item.done ? '✅' : '⬜'}
        </Text>
      </TouchableOpacity>
      <Text
        style={[
          styles.taskText,
          { textDecorationLine: item.done ? 'line-through' : 'none', color: item.done ? '#888' : '#333' },
        ]}
      >
        {item.text}
      </Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleEditTask(item)} style={styles.editBtn}>
          <Text style={styles.actionText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.deleteBtn}>
          <Text style={styles.actionText}>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const copyToExternalStorage = async () => {
    try {
      const externalPath = `${RNFS.ExternalDirectoryPath}/todo_list.json`; // Scoped to the external directory
      await RNFS.copyFile(FILE_PATH, externalPath);
      Alert.alert('Copied', `File copied to: ${externalPath}`);
      console.log('File copied to:', externalPath);
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Error', 'Failed to copy file.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📝 My To-Do List ({taskList.length})</Text>
      <Text style={styles.subTitle}>Designed by Soumojit Shome</Text>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder={editingTaskId ? 'Edit your task...' : 'Enter new task...'}
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity onPress={handleAddOrUpdateTask} style={styles.addBtn}>
          <Text style={styles.addText}>{editingTaskId ? '✎' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity onPress={copyToExternalStorage} style={{ marginTop: 10, alignSelf: 'center' }}>
        <Text style={{ color: '#007bff' }}>📤 Export JSON to File Manager</Text>
      </TouchableOpacity> */}

      <FlatList
        data={taskList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.taskList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginVertical: 50,
    backgroundColor: '#f2f4f7'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
    alignSelf: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 20,
    alignSelf: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  addBtn: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontSize: 22 },
  taskList: { marginTop: 10 },
  taskItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  checkbox: { marginRight: 10 },
  taskText: { flex: 1, fontSize: 16 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  editBtn: {
    marginLeft: 10,
    padding: 4,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
  },
  actionText: {
    fontSize: 18,
  },
});

export default App;
