/********** CONFIG **********/

// Configuration du serveur, et des modules

// Module Express
const express = require('express');
const app = express();

// Creation serveur http à partir du module Express
const http = require('http');
const server = http.createServer(app);

// Creation serveur Socket à partir du serveur http
const { Server } = require("socket.io");
const io = new Server(server);

var path = require("path");
let PORT = 8001;

// Port d'écoute
server.listen(PORT, () => {
  console.log('Serveur démarré sur le port :'+PORT);
});

/********** ROUTES **********/

// Routes fichiers statiques (JS et Bootstrap)
app.use('/css', express.static(path.join(__dirname,'..','/css')));
app.use('/images', express.static(path.join(__dirname,'..', '/images')));
app.use('/client.js', express.static(__dirname + '/client.js'));

app.use('/css', express.static(path.join(__dirname,'..', 'node_modules/bootstrap/dist/css')));
app.use('/css', express.static(path.join(__dirname,'..', 'node_modules/bootstrap-icons/font')));
app.use('/js', express.static(path.join(__dirname,'..', 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname,'..', 'node_modules/jquery/dist')));

// Routes pages site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'salon.html'));
});

/********** SOCKETS **********/

// Lancement du gestionnaire d'événements, qui va gérer notre Socket
io.on('connection',(socket)=>{

  // Socket de connexion et saisie du pseudo
  socket.on('set-pseudo',(pseudo)=>{
    socket.pseudo = pseudo;
    console.log("CONNECTION \n id: "+socket.id+" pseudo: "+ socket.pseudo +" date: "+socket.handshake.time);
    utilisateurs();
    /*
    // Recupération de la liste des utilisateurs (Sockets) connectés
    io.fetchSockets().then((room)=>{
      var utilisateurs=[];
      room.forEach((item) => {
        utilisateurs.push({
          id_client : item.id,
          pseudo_client : item.pseudo,
        });
      });
      io.emit('reception_utilisateur',utilisateurs);
    });
    */
  });

  // Socket pour l'émission/reception des messages
  socket.on('emission_message',(infos)=>{
    var laDate = new Date(); // Initialise un objet Date, avec la date en cours.
    var message = {
      emet_id : socket.id, // ID du client Socket émetteur du message
      dest_id : infos.destId, // ID du client Socket destinataire du message
      pseudo : socket.pseudo, // Pseudo du client Socket émetteur
      msg : infos.message, // Contenu du message
      date : laDate.toLocaleDateString()+' - '+laDate.toLocaleTimeString(), // Date sous format FR
      recu : false // Variable d'accusé de receptions
    };
    if(infos.destId == 'salon'){
      io.emit("reception_message",message);
    }else{
      io.to(socket.id).to(infos.destId).emit("reception_message",message);
    }
  });

  // Socket de déconnexion
  socket.on('disconnect',()=>{
    console.log("DECONNEXION \n id: "+socket.id+" pseudo: "+ socket.pseudo +" date: "+new Date());
    utilisateurs();
  });

   // Recupération de la liste des utilisateurs (Sockets) connectés
  async function utilisateurs(){
    const lesSockets = await io.fetchSockets();
    //console.log(lesSockets);
    let utilisateurs=[];
    for(const leSocket of lesSockets){
      utilisateurs.push({
        id_client : leSocket.id,
        pseudo_client : leSocket.pseudo,
      });
    };
    io.emit('reception_utilisateur',utilisateurs.sort(
      (a,b) => (a.pseudo_client > b.pseudo_client) ? 1 : ((b.pseudo_client > a.pseudo_client) ? -1 : 0)
    ));
  }
});
