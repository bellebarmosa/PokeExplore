import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TypeIcon from './TypeIcon';

interface Type {
  name: string;
  url: string;
}

interface TypePickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  types: Type[];
}

// Type color mapping
const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };
  return colors[type.toLowerCase()] || '#A8A878';
};


const TypePicker: React.FC<TypePickerProps> = ({
  selectedValue,
  onValueChange,
  types,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedType = selectedValue === 'all' 
    ? null 
    : types.find(t => t.name === selectedValue);

  const allTypes = [{ name: 'all', url: '' }, ...types];

  const renderTypeItem = ({ item }: { item: Type }) => {
    const isSelected = item.name === selectedValue;
    const isAll = item.name === 'all';
    const typeColor = isAll ? '#7f8c8d' : getTypeColor(item.name);

    return (
      <TouchableOpacity
        style={[
          styles.typeItem,
          isSelected && styles.typeItemSelected,
          !isAll && { borderLeftColor: typeColor, borderLeftWidth: 4 },
        ]}
        onPress={() => {
          onValueChange(item.name);
          setModalVisible(false);
        }}
      >
        {!isAll && (
          <View style={styles.typeIconContainer}>
            <TypeIcon type={item.name} size={20} />
          </View>
        )}
        <Text
          style={[
            styles.typeItemText,
            isSelected && styles.typeItemTextSelected,
            !isAll && { color: typeColor },
          ]}
        >
          {isAll ? 'All Types' : item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        </Text>
        {isSelected && (
          <Icon name="check" size={20} color="#3498db" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        {selectedType ? (
          <Text style={styles.selectedText}>
            {selectedType.name.charAt(0).toUpperCase() + selectedType.name.slice(1)}
          </Text>
        ) : (
          <Text style={styles.placeholderText}>All Types</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allTypes}
              renderItem={renderTypeItem}
              keyExtractor={(item) => item.name}
              style={styles.typeList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 44,
  },
  selectedText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  typeList: {
    maxHeight: 400,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeItemText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    textTransform: 'capitalize',
  },
  typeItemTextSelected: {
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default TypePicker;

