import { countUsers } from "./common.mjs";
import { getSong, getUserIDs } from "./data.mjs";
import { getListenEvents } from "./data.mjs";

const usersSelect = document.getElementById("users-select");
const showDiv = document.getElementById("show");

const QUESTIONS = [
  "Most listened song(count)",
  "Most listened song(time)",
  " Most listened artist(count)",
  "Most listened artist(time)",
  "Friday night song(count)",
  "Friday night song(time)",
  "Longest streak song",
  " Every day songs",
  ["Top genre", "Top two genres", "Top three genres "],
];

const answers = [];

usersSelect.addEventListener("change", (e) => {
  answers.length = 0;
  const id = e.target.value;
  const userData = getListenEvents(id);

  if (userData.length !== 0) {
    mostListened(userData);
    findLongestStreak(userData);
    findEveryDaySong(userData);
    findTopGenres(userData);
  }
  render();
});

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

function findTopGenres(data) {
  if (!data || data.length === 0) return;

  const songCounts = songCountsCounter(data);
  const songGenres = {};
  for (let [song_id, count] of Object.entries(songCounts)) {
    const { genre } = getSong(song_id);
    songGenres[genre] = (songGenres[genre] || 0) + count;
  }
  const sortedSongGenres = Object.entries(songGenres).sort(
    (a, b) => b[1] - a[1],
  );
  const length = Math.min(3, sortedSongGenres.length);
  const genres = [];
  for (let i = 0; i < length; i++) {
    genres.push(sortedSongGenres[i]);
  }
  answers.push(genres);
}

function findEveryDaySong(data) {
  if (!data || data.length === 0) return;

  // 1. Get the total number of unique days the user listened to ANY music
  const userActiveDates = new Set(
    data.map((item) => item.timestamp.split("T")[0]),
  );
  const totalUserActiveDays = userActiveDates.size;

  // 2. Map each song to its set of unique listening dates
  const songDates = data.reduce((acc, curr) => {
    const songId = curr.song_id;
    const dateStr = curr.timestamp.split("T")[0];

    if (!acc[songId]) acc[songId] = new Set();
    acc[songId].add(dateStr);
    return acc;
  }, {});

  // 3. Filter for songs listened to on 100% of the user's active days
  const everyDaySongIds = Object.keys(songDates).filter(
    (songId) => songDates[songId].size === totalUserActiveDays,
  );
  if (everyDaySongIds.length === 0) {
    answers.push(undefined);
    return;
  }

  // 4. Safely format output (only if matching songs exist, per rubric requirement)

  const songTitles = everyDaySongIds.map((id) => {
    const { artist, title } = getSong(id);
    return `${artist} - ${title}`;
  });

  answers.push(songTitles.join(", "));
}

function findLongestStreak(userData) {
  if (!userData || userData.length === 0) return;
  let current = 0;
  let maxCount = 0;
  let maxSong = userData[0].song_id;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i].song_id === userData[i - 1].song_id) {
      current += 1;
      if (current > maxCount) {
        maxCount = current;
        maxSong = userData[i].song_id;
      }
    } else current = 1;
  }

  const { artist, title } = getSong(maxSong);
  answers.push(`${artist} - ${title} (length:${maxCount})`);
}

function mostListened(data) {
  if (!data || data.length === 0) return;
  const songCounts = songCountsCounter(data);

  const songListeningLength = calculateListeningDuration(songCounts);

  const songCountsFriday = data.reduce(
    (acc, { timestamp, seconds_since_midnight, song_id }) => {
      const day = new Date(timestamp).getDay();
      if (
        (day === 5 && seconds_since_midnight >= 17 * 3600) ||
        (day === 6 && seconds_since_midnight < 4 * 3600)
      ) {
        acc[song_id] = (acc[song_id] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  const songListeningLengthFriday =
    calculateListeningDuration(songCountsFriday);
  // console.log(songListeningLength);
  mostListenedSongCount(songCounts);
  mostListeningLengthSong(songListeningLength);
  mostListenedArtistCount(songCounts);
  mostListenedLengthArtist(songListeningLength);
  // calculates Friday song count and time
  mostListenedSongCount(songCountsFriday);
  mostListeningLengthSong(songListeningLengthFriday);
}
function calculateListeningDuration(counts) {
  return Object.entries(counts).reduce((acc, curr) => {
    const { duration_seconds } = getSong(curr[0]);
    acc[curr[0]] = (acc[curr[0]] || 0) + curr[1] * duration_seconds;
    return acc;
  }, {});
}

function mostListenedLengthArtist(songListeningLength) {
  const artistLengthTime = Object.entries(songListeningLength)
    .map(([id, length]) => {
      const song = getSong(id);
      return [song.artist, length];
    })
    .reduce((acc, curr) => {
      acc[curr[0]] = (acc[curr[0]] || 0) + curr[1];
      return acc;
    }, {});

  const [songArtist, timeLength] = findMax(artistLengthTime);
  answers.push(songArtist);
}

function mostListenedArtistCount(songCounts) {
  // calculates how many an artist has been listened to
  const artistCounts = Object.entries(songCounts)
    .map(([id, count]) => {
      const song = getSong(id);
      return [song.artist, count];
    })
    .reduce((acc, curr) => {
      acc[curr[0]] = (acc[curr[0]] || 0) + curr[1];
      return acc;
    }, {});
  // find the artist that the selected user has listened to the highest number of times
  const [songArtist, countArtist] = findMax(artistCounts);

  answers.push(songArtist);
}

function songCountsCounter(data) {
  // counts how many times a song has been listened to
  return data.reduce((acc, curr) => {
    acc[curr.song_id] = (acc[curr.song_id] || 0) + 1;
    return acc;
  }, {});
}
function mostListeningLengthSong(songListeningLength) {
  if (!songListeningLength || Object.keys(songListeningLength).length === 0) {
    answers.push(undefined);
    return;
  }

  const [id, length] = findMax(songListeningLength);

  const { artist, title } = getSong(id);
  answers.push(`${artist} - ${title}`);
}

function mostListenedSongCount(songCounts) {
  if (!songCounts || Object.keys(songCounts).length === 0) {
    answers.push(undefined);
    return;
  }
  // calculates maximum times a song has been listened to
  const [songId, count] = findMax(songCounts);
  // most listened song
  const { artist, title } = getSong(songId);
  answers.push(`${artist} - ${title}`);
}

function render() {
  if (answers.length === 0 || answers.every((answer) => !answer)) {
    const emptyNotice = document.createElement("p");
    emptyNotice.textContent = "This user did not listen to any songs";
    showDiv.replaceChildren(emptyNotice);
    return;
  }
  const elementsToReplace = [];

  answers.forEach((answer, i) => {
    if (answer) {
      const p = document.createElement("p");
      if (Array.isArray(answer)) {
        const genres = answer.map((ans) => ans[0]).join(", ");
        p.textContent = `${QUESTIONS[i][answer.length - 1]}   |  ${genres}`;
      } else p.textContent = `${QUESTIONS[i]}    |  ${answer}`;
      elementsToReplace.push(p);
    }
  });
  showDiv.replaceChildren(...elementsToReplace);
}

function findMax(items) {
  return Object.entries(items).reduce((max, curr) =>
    curr[1] > max[1] ? curr : max,
  );
}

document.addEventListener("DOMContentLoaded", function () {
  const users = getUserIDs();
  populateUsersDropDown(users);
});
