import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Play, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { Colors } from "@/constants/colors";

export default function SetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);

  const addPlayer = () => {
    if (!playerName.trim()) return;
    if (players.includes(playerName.trim())) {
      Alert.alert("Duplicate Name", "Player already exists!");
      return;
    }
    setPlayers([...players, playerName.trim()]);
    setPlayerName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removePlayer = (index: number) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startGame = () => {
    if (players.length < 2) {
      Alert.alert("Not enough players", "Please add at least 2 players!");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: "/game",
      params: { players: JSON.stringify(players) },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
            <Users size={32} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Who&apos;s Playing?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Add friends to start the slap game
          </Text>
        </Animated.View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Enter player name"
            placeholderTextColor={theme.textSecondary}
            value={playerName}
            onChangeText={setPlayerName}
            onSubmitEditing={addPlayer}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.text },
              !playerName.trim() && { backgroundColor: theme.border },
            ]}
            onPress={addPlayer}
            disabled={!playerName.trim()}
          >
            <Plus size={24} color={theme.background} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp}
              layout={Layout.springify()}
              style={[
                styles.playerCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.playerName, { color: theme.text }]}>{item}</Text>
              <TouchableOpacity
                onPress={() => removePlayer(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={theme.danger} />
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              No players added yet
            </Text>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: theme.primary, shadowColor: theme.primary },
              players.length < 2 && { backgroundColor: theme.border, shadowOpacity: 0 },
            ]}
            onPress={startGame}
            disabled={players.length < 2}
          >
            <Text
              style={[
                styles.startButtonText,
                { color: theme.primaryForeground },
                players.length < 2 && { color: theme.textSecondary },
              ]}
            >
              Start Game
            </Text>
            <Play
              size={20}
              color={players.length < 2 ? theme.textSecondary : theme.primaryForeground}
              fill={players.length < 2 ? theme.textSecondary : theme.primaryForeground}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    borderWidth: 1,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 32,
  },
  footer: {
    paddingTop: 16,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderRadius: 20,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: "700",
  },
});
