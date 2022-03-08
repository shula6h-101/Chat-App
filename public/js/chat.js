const socket = io();
import mustache from "https://cdnjs.cloudflare.com/ajax/libs/mustache.js/4.2.0/mustache.min.js"

//Elements
const $messageForm = document.getElementById('message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
  //New Message Element
  const $newMessage = $messages.lastElementChild;
  
  //Height of New Message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  
  //Visible Height
  const visibleHeight = $messages.offsetHeight;
  
  //Height of Messages Container
  const containerHeight = $messages.scrollHeight;
  
  //How Far have I Scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  
  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight;
  }
}

socket.emit('join', {username, room}, (error)=>{
  if(error){
    alert(error)
    location.href='/';
  }
});

socket.on('message', (message) => {
  const html = mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})


socket.on('roomData', ({room, users})=>{
  const html = mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  $messageFormButton.setAttribute('disabled', 'disabled');
  
  const message = e.target.elements.message.value;
  
  socket.emit('sentMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled' );
    $messageFormInput.value = '';
    $messageFormInput.focus();
    
    if(error){
      return console.log(error)
    }
    console.log('Delivered!');
  });
})

document.getElementById('send-location').addEventListener('click', (e) => {
  if(!navigator.geolocation){
    return alert('Geolocation is not supported by your browser!');
  }
  
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sentLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })
  })
})
