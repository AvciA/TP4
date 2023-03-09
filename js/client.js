/********** HTML **********/

// Variables pour récupurer les éléments HTML
var messages = document.getElementById('messages');
var utilisateurs = document.getElementById('utilisateurs');
var form = document.getElementById('form');
var input = document.getElementById('input');

/********** SOCKETS **********/

var socket = io();

// Selection pseudo
socket.emit('set-pseudo',prompt("Pseudo ?"));

// Écouteur et envoi du message du formulaire
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
      socket.emit('emission_message',{
          destId : id_salon,
          message : input.value
      });
    input.value = '';
  }
});

// Reception et affichage message
socket.on('reception_message', (contenu) => {
  lesMessages.push(contenu);
  salon(id_salon);
  check_unread();
});

// Reception et affichage utilisateurs
socket.on('reception_utilisateur', (lesUtilisateurs) => {
  //RAZ de la liste des utilisateurs
  utilisateurs.innerHTML=''; 
  // Création utilisateur salon par défaut
  var href = document.createElement('a');
  href.setAttribute('href','#');
  href.setAttribute('onClick','salon("salon")');
  var div = document.createElement('div');
  div.setAttribute('class','chat-user');
  div.innerHTML += '<img class="chat-avatar" src="/images/Group.png" alt="">';
  div.innerHTML += '<div class="chat-user-name">Salon</div>';
  href.appendChild(div);
  utilisateurs.appendChild(href);
  // Création des utilisateurs connectés
  lesUtilisateurs.forEach((utilisateur) => {
    if(utilisateur.id_client != socket.id){
      href = document.createElement('a');
      href.setAttribute('href','#');
      href.setAttribute('onClick','salon("'+utilisateur.id_client+'")');
      div = document.createElement('div');
      div.setAttribute('class','chat-user');
      div.innerHTML += '<img class="chat-avatar" src="/images/Solo.jpg" alt="">';
      div.innerHTML += '<div class="chat-user-name">'+utilisateur.pseudo_client
                       + '<span class="badge badge-secondary badge-nouveau-msg" id="'+utilisateur.id_client+'">'
                       + '</span>'
                       + '</div>';
      href.appendChild(div);
      utilisateurs.appendChild(href);
    }
  });
  window.scrollTo(0, document.body.scrollHeight);
});

/********** FONCTIONS **********/

var id_salon='salon';  //Variable qui va definir un destinataire, par défaut le salon général
var lesMessages = []; //Tableau qui va contenir l'ensemble des messages envoyés (semi-persistance)

// Affichage des messages en fonction du choix de l'utilisateur :
// - Soit les messages du salon général,
// - Soit les messages d'une conversation privée avec un autre utilisateur
function salon(id){
    id_salon = id;
    document.getElementById('nom-salon').innerHTML=id_salon;
    messages.innerHTML='';
    for(const contenu of lesMessages){
      if( // Cas ou msg vers salon général
         (contenu.dest_id == id_salon && id_salon =='salon') 
         ||
         // Cas ou msg vers salon privé
         (contenu.emet_id == id_salon && contenu.dest_id == socket.id)
         ||
         (contenu.emet_id == socket.id && contenu.dest_id == id_salon)
        ){
        var div = document.createElement('div');
        if(contenu.emet_id == socket.id){
          div.setAttribute('class','chat-message right');
        }else{
          div.setAttribute('class','chat-message left');
        }
        div.innerHTML += '<img class="message-avatar" src="/images/Solo.jpg" alt="">';
        div.innerHTML += '<div class="message">'
                      +  '<a class="message-author">'+contenu.pseudo+'</a>'
                      +  '<span class="message-date">'+contenu.date+'</span>'
                      +  '<span class="message-content">'+contenu.msg+'</span>';
        messages.appendChild(div);
        window.scrollTo(0, messages.scrollHeight);
        // MAJ de la variable reçu, afin de marquer les messages comme lus
        contenu.recu = true;
       // document.getElementById('last-msg').innerHTML="Dernier message : "+contenu.date;
      }
    }
    // On RAZ le badge de notification
    if(id_salon != 'salon'){
      document.getElementById(id_salon).innerHTML="";
    }
};

// Vérifie les messages non-lus, puis affiche un badge de notifciation
// incrémenté a côté de l'utilisateur en question
function check_unread(){
  // Tableau pour le compteur de messages de chaque utilisateur (via son ID)
  var compteurs = [];
  for(const contenu of lesMessages){
    if(contenu.dest_id != 'salon' && contenu.recu == false){
      // Si l'entrée n'existe pas, on la crée
      if(compteurs[contenu.dest_id] == undefined){
        compteurs[contenu.dest_id] = 0;
      }
      // Incrémentation du compteur, et écriture dans le badge
      compteurs[contenu.dest_id]++;
      document.getElementById(contenu.emet_id).innerHTML=compteurs[contenu.dest_id];
    }
  }
}