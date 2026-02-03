import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Hand, Bomb, RotateCcw, Plus, Minus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const GAP = 12;
const GRID_PADDING = 24;
const MAX_GRID_WIDTH = 420;

type Tile = {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth = Math.min(windowWidth - GRID_PADDING * 2, MAX_GRID_WIDTH);
  const tileSize = Math.floor(
    (availableWidth - GAP * (GRID_SIZE - 1)) / GRID_SIZE
  );

  const players = (() => {
    try {
      return params.players ? (JSON.parse(params.players as string) as string[]) : [];
    } catch {
      return [];
    }
  })();

  const [grid, setGrid] = useState<Tile[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [picksLeft, setPicksLeft] = useState(3);
  const [slappedPlayer, setSlappedPlayer] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [mineCount, setMineCount] = useState(1);
  const picksLeftRef = useRef(picksLeft);
  const turnLockedRef = useRef(false);

  const initializeGame = useCallback(() => {
    const newGrid: Tile[] = Array.from({ length: TOTAL_TILES }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
    }));

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const randomIndex = Math.floor(Math.random() * TOTAL_TILES);
      if (!newGrid[randomIndex].isMine) {
        newGrid[randomIndex].isMine = true;
        minesPlaced++;
      }
    }

    setGrid(newGrid);
    setPicksLeft(3);
    setIsGameOver(false);
    setSlappedPlayer(null);
    turnLockedRef.current = false;
  }, [mineCount]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    picksLeftRef.current = picksLeft;
  }, [picksLeft]);

  const nextTurn = useCallback(() => {
    setPicksLeft(3);
    turnLockedRef.current = false;
    setCurrentPlayerIndex((prev) => (players.length ? (prev + 1) % players.length : 0));
    Haptics.selectionAsync();
  }, [players.length]);

  const handleTilePress = (index: number) => {
    if (
      isGameOver ||
      grid[index]?.isRevealed ||
      slappedPlayer ||
      picksLeftRef.current <= 0 ||
      turnLockedRef.current
    )
      return;

    const tile = grid[index];
    if (!tile) return;

    const newGrid = [...grid];
    newGrid[index].isRevealed = true;
    setGrid(newGrid);

    if (tile.isMine) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      turnLockedRef.current = true;
      setSlappedPlayer(players[currentPlayerIndex]);
      setIsGameOver(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newPicksLeft = picksLeftRef.current - 1;
      picksLeftRef.current = newPicksLeft;

      if (newPicksLeft === 0) {
        setPicksLeft(0);
        turnLockedRef.current = true;
        setTimeout(() => {
          nextTurn();
        }, 500);
      } else {
        setPicksLeft(newPicksLeft);
      }
    }
  };

  const handleEndTurn = () => {
    if (picksLeft === 3) return;
    turnLockedRef.current = true;
    nextTurn();
  };

  const handleSlapDismiss = () => {
    setSlappedPlayer(null);
    initializeGame();
    setCurrentPlayerIndex((prev) => (players.length ? (prev + 1) % players.length : 0));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: theme.card }]}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.turnContainer}>
          <Text style={[styles.turnLabel, { color: theme.textSecondary }]}
          >
            Current Turn
          </Text>
          <Text style={[styles.currentPlayer, { color: theme.text }]}
          >
            {players[currentPlayerIndex] ?? ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={initializeGame}
          style={[styles.iconButton, { backgroundColor: theme.card }]}
        >
          <RotateCcw size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{picksLeft}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}
          >
            Picks Left
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statBox}>
          <View style={styles.mineControls}>
            <TouchableOpacity
              onPress={() => setMineCount((prev) => Math.max(1, prev - 1))}
              style={[styles.controlButton, { backgroundColor: theme.cardSecondary }]}
              hitSlop={8}
            >
              <Minus size={16} color={theme.text} />
            </TouchableOpacity>

            <Text
              style={[
                styles.statValue,
                { color: theme.primary, minWidth: 30, textAlign: "center" },
              ]}
            >
              {mineCount}
            </Text>

            <TouchableOpacity
              onPress={() => setMineCount((prev) => Math.min(24, prev + 1))}
              style={[styles.controlButton, { backgroundColor: theme.cardSecondary }]}
              hitSlop={8}
            >
              <Plus size={16} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}
          >
            Hidden Mines
          </Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        <View style={[styles.grid, { width: availableWidth }]}>
          {grid.map((tile, index) => (
            <TileComponent
              key={tile.id}
              tile={tile}
              onPress={() => handleTilePress(index)}
              disabled={isGameOver || tile.isRevealed || picksLeft === 0}
              theme={theme}
              tileSize={tileSize}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.endTurnButton,
            { backgroundColor: theme.text },
            (picksLeft === 3 || isGameOver) && { backgroundColor: theme.border },
          ]}
          onPress={handleEndTurn}
          disabled={picksLeft === 3 || isGameOver}
        >
          <Text
            style={[
              styles.endTurnText,
              { color: theme.background },
              (picksLeft === 3 || isGameOver) && { color: theme.textSecondary },
            ]}
          >
            End Turn
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!slappedPlayer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.duration(400)}
            style={[styles.slapCard, { backgroundColor: theme.card }]}
          >
            <View style={[styles.slapIconContainer, { backgroundColor: theme.danger }]}
            >
              <Hand size={64} color="#FFF" />
            </View>
            <Text style={[styles.slapTitle, { color: theme.danger }]}
            >
              You get slapped
            </Text>
            <Text style={[styles.slapSubtitle, { color: theme.textSecondary }]}
            >
              <Text style={[styles.slapName, { color: theme.text }]}>
                {slappedPlayer}
              </Text>{" "}
              hit the mine!
            </Text>

            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: theme.text }]}
              onPress={handleSlapDismiss}
            >
              <Text style={[styles.continueText, { color: theme.background }]}>
                Next Round
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TileComponent({
  tile,
  onPress,
  disabled,
  theme,
  tileSize,
}: {
  tile: Tile;
  onPress: () => void;
  disabled: boolean;
  theme: typeof Colors.light;
  tileSize: number;
}) {
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (tile.isRevealed) {
      rotate.value = withTiming(180, { duration: 300 });
    } else {
      rotate.value = withTiming(0, { duration: 0 });
    }
  }, [tile.isRevealed, rotate]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotate.value}deg` }],
    backfaceVisibility: "hidden",
    position: "absolute",
    width: "100%",
    height: "100%",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotate.value - 180}deg` }],
    backfaceVisibility: "hidden",
    width: "100%",
    height: "100%",
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.tileWrapper, { width: tileSize, height: tileSize }]}
    >
      <Animated.View
        style={[
          styles.tile,
          styles.tileFront,
          { backgroundColor: theme.card, borderColor: theme.border },
          frontStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.tile,
          styles.tileBack,
          tile.isMine
            ? { backgroundColor: theme.mine, borderColor: theme.danger }
            : { backgroundColor: theme.safe, borderColor: theme.success },
          backStyle,
        ]}
      >
        {tile.isMine ? <Bomb size={24} color="#FFF" /> : <View style={styles.safeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  turnContainer: {
    alignItems: "center",
  },
  turnLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentPlayer: {
    fontSize: 20,
    fontWeight: "800",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  mineControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    width: 1,
    height: 32,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  gridContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GRID_PADDING,
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    justifyContent: "center",
  },
  tileWrapper: {},
  tile: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tileFront: {
    borderWidth: 1,
  },
  tileBack: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: 1,
  },
  safeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  footer: {
    padding: 24,
    paddingBottom: 8,
  },
  endTurnButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  endTurnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  slapCard: {
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  slapIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transform: [{ rotate: "-15deg" }],
  },
  slapTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
  slapSubtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  slapName: {
    fontWeight: "700",
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
