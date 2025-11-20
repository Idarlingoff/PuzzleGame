import { PuzzleGame } from "../src/PuzzleGame.ts";
import { io } from "socket.io-client";

// Obtenir le serveur Socket.IO à partir de l'URL actuelle
const socketURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? "http://localhost:3000"
  : `http://${window.location.hostname}:3000`;

// Connexion au serveur Socket.IO
export const socket = io(socketURL);

let game: PuzzleGame | null = null;

// Lorsque je reçois l'évènement 'welcome' du serveur
socket.on("welcome", (playerId: string) => {
  console.log(`Connecté en tant que : ${playerId}`)
})

// Lorsque je reçois l'évènement 'playerAssigned' du serveur
socket.on("playerAssigned", (playerIndex: number) => {
  console.log(`Vous êtes le joueur ${playerIndex + 1}`);

  // Initialiser le jeu seulement une fois avec l'assignation du joueur
  if (!game) {
    game = new PuzzleGame(socket, playerIndex);
  }
})

// Synchroniser le niveau au démarrage
socket.on("syncLevelIndex", (levelIndex: number) => {
  console.log(`Synchronisation du niveau: ${levelIndex}`);
  if (game && levelIndex > 0) {
    // Si ce n'est pas le niveau 0, charger le niveau correspondant
    game.loadSpecificLevel(levelIndex).catch(err => console.error(err));
  }
})

// Lorsque je reçois l'évènement 'join' du serveur
socket.on("join", (data) => {
  console.log(`Le socket ${data} à rejoint la gang :)`)
})

// Lorsque je reçois l'évènement 'leave' du serveur
socket.on("leave", (data) => {
  console.log(`Le socket ${data} à quitté la gang :(`)
})

// Recevoir les mouvements du joueur distant
socket.on("playerMove", (data: any) => {
  console.log("Mouvement du joueur reçu:", data);
  if (game) {
    game.applyRemotePlayerMove(data.playerIndex, data.x, data.y);
  }
})

// Recevoir l'événement de passage de niveau du serveur
socket.on("levelCompleted", (data: any) => {
  console.log("Passage au niveau suivant demandé par le serveur");
  if (game) {
    game.loadNextLevelRemote().catch(err => console.error(err));
  }
})

// Gestion des erreurs
socket.on("error", (error: string) => {
  console.error(`Erreur du serveur: ${error}`);
  alert(error);
})

// Gestion des déconnexions
socket.on("disconnect", () => {
  console.log("Déconnecté du serveur");
})

// Initialiser le jeu quand le DOM est prêt (attendre l'assignation du joueur)
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM chargé, en attente de l'assignation du joueur...");
})




