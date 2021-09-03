//io() comes from socket.io.js (the client side library) and is used to create a new connection
const socket = io();

//Elements
const $messageForm = document.querySelector('#chatForm');
const $messageFormInput = $messageForm.querySelector('#chatFormMessage');
const $messageFormButton = $messageForm.querySelector('#chatFormSend');
const $locationButton = document.querySelector('#locationButton');
const $messagesSection = document.querySelector('#messagesSection');

//Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationTemplate = document.querySelector('#locationTemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});  //ignoreQueryPrefix removes '?' from query string

const autoscroll = () => {
  //Get new message element
  const $newMessage = $messagesSection.lastElementChild;

  //Get height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Get visible (viewport) height
  const visibleHeight = $messagesSection.offsetHeight;

  //Get messages div full height
  const contentHeight = $messagesSection.scrollHeight;

  //Get scroll distance from top (top of scrollbar bar)
  const scrollOffsetTop = $messagesSection.scrollTop;

  //Get scroll distance from bottom (bottom of scrollbar bar)
  const scrollOffset = scrollOffsetTop + visibleHeight;

  //Were we already at the bottom before the new message was apended?
  if (contentHeight - newMessageHeight <= scrollOffset) { 
    $messagesSection.scrollTop = $messagesSection.scrollHeight; 
  }
};

socket.on('message', (message) => {
  console.log(message);

  const html = Mustache.render(messageTemplate, {  //Mustache renders a template by filling in strings
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm:ss a')
  });
  $messagesSection.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    href: message.locationUrl,
    createdAt: moment(message.createdAt).format('h:mm:ss a')
  });
  $messagesSection.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (event) => {
  // const messageField = document.querySelector('#chatFormMessage');
  //alternatively
  //const messageField = event.target.elements.chatMessage;

  event.preventDefault();

  if ($messageFormInput.value === '') {
    return;
  }

  $messageFormButton.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', $messageFormInput.value, (error) => {
    //acknowledgement callback
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      console.log(error);
      return;
    } 
    
    console.log('Message delivered');
  });
});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  $locationButton.setAttribute('disabled', 'disabled');

  //getCurrentPosition() doesn't support promises
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude, 
      longitude: position.coords.longitude
    }, () => {
      $locationButton.removeAttribute('disabled');
      console.log('Location shared');
    });
  });
});

socket.emit('join', {username, room}, (error) => {
  if (!error) {
    return;
  }

  alert(error);
  location.href = '/';
});