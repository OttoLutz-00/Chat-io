// --what goes in local storage--
// * username
// * id??? if this was persisted on refresh, then we could send this to the server and it could know we were the same user
// * 

export const getItem = (key) => {
  return localStorage.getItem(key);
};

export const setItem = (key, value) => {
  localStorage.setItem(key, value);
};

// --what each page needs from local storage--

// HomePage
// - username
// -


// ChatPage