import express from 'express'
import { Server, Socket } from 'socket.io'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Obtenir le répertoire courant (équivalent de __dirname en ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

// Création d'un serveur web pour livrer le client sur le port 8080
const app: express.Application = express()
app.use(express.static('public'))

// Route pour servir les fichiers JSON des niveaux
app.get('/assets/json/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    // Vérifier que le nom du fichier est sûr (éviter les traversées de répertoire)
    if (!filename.match(/^level\d+\.json$/)) {
      res.status(400).send('Invalid filename')
      return
    }
    const data = await readFile(join(__dirname, 'src/assets/json', filename), 'utf-8')
    res.json(JSON.parse(data))
  } catch (err) {
    res.status(404).send('File not found')
  }
})

app.listen(8080)

// Création d'un serveur socket pour interaction client / serveur sur le port 3000
const io = new Server(3000, {
  cors: {
    origin: "*" // Autoriser toutes les origines
  }
});

let connectedPlayers: { [key: string]: number } = {}; // socketId -> playerIndex (0 ou 1)
let playerSockets: { [key: number]: string } = {}; // playerIndex (0 ou 1) -> socketId
let currentLevelIndex: number = 0; // Tracker le niveau actuellement actif

// Lorsqu'un client se connecte
io.on("connection", (socket: Socket) => {
  console.log(`Client connecté: ${socket.id}`);

  // Je lui envoi un évènement appelé 'welcome' avec son id
  socket.emit("welcome", socket.id)

  // Assigner le joueur : le premier client est joueur 0, le second est joueur 1
  let playerIndex = -1;
  if (Object.keys(connectedPlayers).length === 0) {
    playerIndex = 0;
  } else if (Object.keys(connectedPlayers).length === 1) {
    playerIndex = 1;
  } else {
    // Plus de 2 joueurs, on donne pas d'assignation
    socket.emit("error", "Trop de joueurs");
    socket.disconnect();
    return;
  }

  connectedPlayers[socket.id] = playerIndex;
  playerSockets[playerIndex] = socket.id;

  // Assigner le joueur au client
  socket.emit("playerAssigned", playerIndex);
  // Envoyer le niveau actuel au nouveau joueur
  socket.emit("syncLevelIndex", currentLevelIndex);
  console.log(`Joueur ${playerIndex} assigné à ${socket.id}`);

  // Prévenir les autres
  io.emit("join", socket.id)

  // Lorsque le client se déconnecte
  socket.on('disconnect', () => {
    const playerIdx = connectedPlayers[socket.id];
    delete connectedPlayers[socket.id];
    delete playerSockets[playerIdx];
    console.log(`Client ${socket.id} (joueur ${playerIdx}) déconnecté`);

    // Prévenir tous les autres
    io.emit("leave", socket.id)
  })

  // Lorsque le client envoie un mouvement
  socket.on("playerMove", (data: any) => {
    // Vérifier que le joueur ne contrôle que son propre personnage
    if (connectedPlayers[socket.id] === data.playerIndex) {
      // Envoyer à TOUS les clients (y compris l'émetteur) pour rafraîchir le jeu pour tout le monde
      io.emit("playerMove", data);
    } else {
      console.warn(`Tentative d'usurpation: ${socket.id} (joueur ${connectedPlayers[socket.id]}) a essayé de contrôler le joueur ${data.playerIndex}`);
    }
  })

  // Lorsque le client complète un niveau
  socket.on("levelCompleted", (data: any) => {
    console.log(`Joueur ${connectedPlayers[socket.id]} a complété le niveau ${data.levelIndex}`);
    // Mettre à jour le niveau actuel
    currentLevelIndex = data.levelIndex + 1;
    // Informer TOUS les clients (y compris l'émetteur) de passer au niveau suivant
    io.emit("levelCompleted", { levelIndex: data.levelIndex });
  })

  // Lorsque le client envoie un message générique
  socket.on("message", (data: any) => console.log(data))
});
