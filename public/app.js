// Je me connecte à mon socket
// l'objet IO est disponible grace au <script> de mon HTML
const socket = io("http://localhost:3000");

// Lorsque je reçois l'évènement 'welcomme' du serveur
socket.on("welcome", () => {
  console.log("coucou !")
})

// Lorsque je reçois l'évènement 'join' du serveur
socket.on("join", (data) => {
  console.log(`Le socket ${data} à rejoint la gang :)`)
})

// Lorsque je reçois l'évènement 'leave' du serveur
socket.on("leave", (data) => {
  console.log(`Le socket ${data} à quitté la gang :(`)
})

document.addEventListener('keydown', e => {
  socket.emit('message', `J'ai cliqué sur ${e.key} !`)
})