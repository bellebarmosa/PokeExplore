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

interface Generation {
  name: string;
  url: string;
}

interface RegionPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  generations: Generation[];
}

// Map generation names to region numbers and display names
const getRegionInfo = (genName: string): { number: number; displayName: string } => {
  const regionMap: { [key: string]: { number: number; displayName: string } } = {
    'generation-i': { number: 1, displayName: 'Kanto' },
    'generation-ii': { number: 2, displayName: 'Johto' },
    'generation-iii': { number: 3, displayName: 'Hoenn' },
    'generation-iv': { number: 4, displayName: 'Sinnoh' },
    'generation-v': { number: 5, displayName: 'Unova' },
    'generation-vi': { number: 6, displayName: 'Kalos' },
    'generation-vii': { number: 7, displayName: 'Alola' },
    'generation-viii': { number: 8, displayName: 'Galar' },
    'generation-ix': { number: 9, displayName: 'Paldea' },
  };

  return regionMap[genName] || { number: 0, displayName: genName };
};

const RegionPicker: React.FC<RegionPickerProps> = ({
  selectedValue,
  onValueChange,
  generations,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedGen = selectedValue === 'all'
    ? null
    : generations.find(g => g.name === selectedValue);

  const allGenerations = [{ name: 'all', url: '' }, ...generations];

  const renderRegionItem = ({ item }: { item: Generation }) => {
    const isSelected = item.name === selectedValue;
    const isAll = item.name === 'all';
    const regionInfo = isAll ? null : getRegionInfo(item.name);

    return (
      <TouchableOpacity
        style={[
          styles.regionItem,
          isSelected && styles.regionItemSelected,
        ]}
        onPress={() => {
          onValueChange(item.name);
          setModalVisible(false);
        }}
      >
        <View style={styles.regionItemContent}>
          {!isAll && regionInfo && (
            <View style={styles.regionNumberContainer}>
              <Text style={styles.regionNumber}>{regionInfo.number}</Text>
            </View>
          )}
          <Text
            style={[
              styles.regionItemText,
              isSelected && styles.regionItemTextSelected,
            ]}
          >
            {isAll
              ? 'All Region'
              : `Region ${regionInfo!.number} (${regionInfo!.displayName})`}
          </Text>
        </View>
        {isSelected && (
          <Icon name="check" size={20} color="#3498db" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const getDisplayText = () => {
    if (selectedValue === 'all') {
      return 'All Region';
    }
    if (selectedGen) {
      const regionInfo = getRegionInfo(selectedGen.name);
      return `Region ${regionInfo.number} (${regionInfo.displayName})`;
    }
    return 'All Region';
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectedText}>{getDisplayText()}</Text>
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
              <Text style={styles.modalTitle}>Select Region</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allGenerations}
              renderItem={renderRegionItem}
              keyExtractor={(item) => item.name}
              style={styles.regionList}
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
  regionList: {
    maxHeight: 400,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  regionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  regionNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regionNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  regionIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regionItemText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  regionItemTextSelected: {
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default RegionPicker;

