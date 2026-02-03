import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";

type Tile = {
  id: number;
  revealed: boolean;
  isMine: boolean;
};

type Player = {
  id: number;
  name: string;
  slaps: number;
};

const GRID_SIZE = 5;
const MAX_PICKS = 3;

function createGrid(mineIndex: number): Tile[] {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    id: i,
    revealed: false,
    isMine: i === mineIndex,
  }));
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [mineIndex, setMineIndex] = useState<number>(() =>
    Math.floor(Math.random() * GRID_SIZE * GRID_SIZE)
  );
  const [grid, setGrid] = useState<Tile[]>(() => createGrid(mineIndex));
  const [picksLeft, setPicksLeft] = useState(MAX_PICKS);
  const [roundMessage, setRoundMessage] = useState("Pick up to 3 tiles.");

  const currentPlayer = useMemo(
    () => (players.length ? players[currentPlayerIndex] : undefined),
    [players, currentPlayerIndex]
  );

  const resetRound = (nextPlayerIndex: number, message?: string) => {
    const nextMine = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    setMineIndex(nextMine);
    setGrid(createGrid(nextMine));
    setPicksLeft(MAX_PICKS);
    setRoundMessage(message ?? "Pick up to 3 tiles.");
    setCurrentPlayerIndex(nextPlayerIndex);
  };

  const advanceTurn = (message?: string) => {
    if (players.length === 0) {
      return;
    }
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    resetRound(nextIndex, message);
  };

  const addPlayer = () => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [
      ...prev,
      { id: Date.now(), name: trimmed, slaps: 0 },
    ]);
    setPlayerName("");
    if (players.length === 0) {
      setCurrentPlayerIndex(0);
    }
  };

  const handlePick = (tileId: number) => {
    if (!currentPlayer || picksLeft === 0) return;
    const pickedTile = grid.find((tile) => tile.id === tileId);
    if (!pickedTile || pickedTile.revealed) return;

    setGrid((prev) =>
      prev.map((tile) =>
        tile.id === tileId ? { ...tile, revealed: true } : tile
      )
    );

    if (pickedTile.isMine) {
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === currentPlayerIndex ? { ...p, slaps: p.slaps + 1 } : p
        )
      );
      advanceTurn(`${currentPlayer.name} hit the mine! Slap!`);
      return;
    }

    const nextPicksLeft = picksLeft - 1;
    setPicksLeft(nextPicksLeft);

    if (nextPicksLeft === 0) {
      advanceTurn(`${currentPlayer.name} is safe. Next player.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Slap Grid</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Players</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
          />
          <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {players.length === 0 ? (
          <Text style={styles.subtle}>Add at least one player.</Text>
        ) : (
          <View style={styles.playerList}>
            {players.map((player, index) => (
              <View key={player.id} style={styles.playerRow}>
                <Text
                  style={
                    index === currentPlayerIndex
                      ? styles.currentPlayer
                      : styles.player
                  }
                >
                  {player.name}
                </Text>
                <Text style={styles.slapCount}>Slaps: {player.slaps}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Turn</Text>
        <Text style={styles.turnText}>
          {currentPlayer ? `${currentPlayer.name}'s turn` : "No player"}
        </Text>
        <Text style={styles.subtle}>Picks left: {picksLeft}</Text>
        <Text style={styles.message}>{roundMessage}</Text>
      </View>

      <View style={styles.grid}>
        {grid.map((tile) => (
          <TouchableOpacity
            key={tile.id}
            style={[
              styles.tile,
              tile.revealed && tile.isMine && styles.tileMine,
              tile.revealed && !tile.isMine && styles.tileSafe,
            ]}
            onPress={() => handlePick(tile.id)}
            disabled={tile.revealed || picksLeft === 0 || !currentPlayer}
          >
            <Text style={styles.tileText}>
              {tile.revealed ? (tile.isMine ? "💥" : "✅") : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 12,
  },
  section: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
  },
  addButton: {
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  subtle: {
    color: "#94a3b8",
    marginTop: 8,
  },
  playerList: {
    marginTop: 8,
    gap: 6,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  player: {
    color: "#e2e8f0",
    fontSize: 14,
  },
  currentPlayer: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "700",
  },
  slapCount: {
    color: "#facc15",
  },
  turnText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    color: "#f472b6",
    marginTop: 4,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "18%",
    aspectRatio: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tileSafe: {
    backgroundColor: "#14532d",
  },
  tileMine: {
    backgroundColor: "#7f1d1d",
  },
  tileText: {
    fontSize: 18,
  },
});
