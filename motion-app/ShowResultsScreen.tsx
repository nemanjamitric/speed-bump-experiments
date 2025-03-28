import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import * as FileSystem from "expo-file-system";
import { SensorData } from "./App";

const { width } = Dimensions.get("window");

interface ShowResultsScreenProps {
  recordedData: SensorData[];
  onRetry: () => void;
  onSave: (data: SensorData[]) => void;
}

const ShowResultsScreen: React.FC<ShowResultsScreenProps> = ({
  recordedData,
  onRetry,
  onSave,
}) => {
  const accelerationData = recordedData.map((data) => ({
    timestamp: data.timestamp,
    acceleration: Math.sqrt(
      data.acceleration.x ** 2 +
        data.acceleration.y ** 2 +
        data.acceleration.z ** 2
    ),
  }));

  const speedData = recordedData.map((data) => ({
    timestamp: data.timestamp,
  }));

  const startTime = recordedData[0].timestamp;
  const usedTimes: number[] = [];

  const chartDataAcceleration = {
    labels: accelerationData.map((data) => {
      const timeDiff = data.timestamp - startTime;
      const roundedTimeDiff = Math.floor(timeDiff / 1000);
      if (!usedTimes.includes(roundedTimeDiff)) {
        usedTimes.push(roundedTimeDiff);
        return roundedTimeDiff.toString();
      }
      return "";
    }),
    datasets: [
      {
        data: accelerationData.map((data) => data.acceleration),
        strokeWidth: 2,
        color: () => "blue",
      },
    ],
  };

  const handleSave = async () => {
    try {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        return;
      }

      // const fileUri =
      //   FileSystem.documentDirectory +
      //   "results/sensorData" +
      //   Date.now().toString() +
      //   ".json";
      // await FileSystem.writeAsStringAsync(
      //   fileUri,
      //   JSON.stringify(recordedData)
      // );

      await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        "sensorData" + Date.now().toString(),
        "application/json"
      )
        .then(async (uri) => {
          await FileSystem.writeAsStringAsync(
            uri,
            JSON.stringify(recordedData)
          );
          alert(
            "Data saved to " +
              permissions.directoryUri +
              "sensorData" +
              Date.now().toString() +
              ".json"
          );
          onSave([]);
          onRetry();
        })
        .catch((e) => {
          console.log(e);
        });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: StatusBar.currentHeight }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Sensor Data Results</Text>

        <LineChart
          data={chartDataAcceleration}
          width={width - 20}
          height={220}
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientFrom: "white",
            backgroundGradientTo: "white",
            decimalPlaces: 2,
            color: () => "blue",
            labelColor: () => "black",
            style: { borderRadius: 16 },
            propsForBackgroundLines: {
              strokeOpacity: 1,
            },
          }}
          withVerticalLines={false}
          bezier
          style={styles.chart}
        />

        <View style={styles.buttonContainer}>
          <Button title="Retry" onPress={onRetry} />
          <Button title="Save Data" onPress={handleSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
  },
});

export default ShowResultsScreen;
