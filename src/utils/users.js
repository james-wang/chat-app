const users = [];

const addUser = ({id, username, room}) => {
  //clean the data
  username = username.trim();
  room = room.trim();

  //validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are required'
    }
  }

  //check for existing user
  const existingUser = users.find((user) => {
    return user.room.toLowerCase() === room.toLowerCase() && 
      user.username.toLowerCase() === username.toLowerCase();
  });

  //validate username
  if (existingUser) {
    return {
      error: 'Username is in use'
    }
  }

  //store user
  const user = {id, username, room};
  users.push(user);
  return {user};
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0]; //[0] to return the item from the sub-array that was removed
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room.toLowerCase() === room.trim().toLowerCase());
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}