// This is a placeholder file which shows how you can access functions defined in other files.
// It can be loaded into index.html.
// You can delete the contents of the file once you have understood how it works.
// Note that when running locally, in order to open a web page which uses modules, you must serve the directory over HTTP e.g. with https://www.npmjs.com/package/http-server
// You can't open the index.html file using a file:// URL.

import { countUsers } from "./common.mjs";
import { getUserIDs } from "./data.mjs";

const usersSelect = document.getElementById("users-select");

// Functions
function populateUsersDropDown(users) {
  const options = users.map((user) => {
    const option = document.createElement("option");
    option.value = user;
    option.textContent = `User ${user}`;
    return option;
  });
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select a user";

  usersSelect.append(defaultOption, ...options);
}

document.addEventListener("DOMContentLoaded", function () {
  const users = getUserIDs();
  populateUsersDropDown(users);
});
