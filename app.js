
const $ = id => document.getElementById(id);

const STORAGE_KEY = "dview_posts_v1";
const PROFILE_KEY = "dview_profile_v1";
const THEME_KEY = "dview_dark_v1";

const samplePosts = [
  {
    id: "sample-1",
    author: "Jamie Doe",
    title: "Finding calm in the mountains",
    body: "A little time away from the noise can make room for new ideas.",
    topic: "Nature",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
    likes: 128,
    liked: false,
    createdAt: Date.now() - 7200000
  },
  {
    id: "sample-2",
    author: "Mia Carter",
    title: "A quiet forest morning",
    body: "Fresh air, soft light and a reminder to slow down.",
    topic: "Photography",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    likes: 96,
    liked: false,
    createdAt: Date.now() - 18000000
  },
  {
    id: "sample-3",
    author: "Alex Morgan",
    title: "Collect moments, not things",
    body: "Every new road has something to teach us.",
    topic: "Travel",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    likes: 74,
    liked: false,
    createdAt: Date.now() - 36000000
  },
  {
    id: "sample-4",
    author: "Taylor Reed",
    title: "The city after sunset",
    body: "Some beautiful colours appear at the end of the day.",
    topic: "Lifestyle",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
    likes: 56,
    liked: false,
    createdAt: Date.now() - 65000000
  }
];

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

let posts = loadData(STORAGE_KEY, samplePosts);
let profile = loadData(PROFILE_KEY, {
  name: "Guest User",
  bio: "Sharing ideas and everyday moments."
});

let currentPage = "Home";
let currentFilter = "all";
let query = "";
let toastTimer;

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    showToast("Could not save data in this browser.");
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function initials(name) {
  return (name || "G")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase() || "G";
}

function timeAgo(timestamp) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000)
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function postMarkup(post) {
  const image = post.image
    ? `<img class="post-image" src="${escapeHTML(post.image)}" alt="${escapeHTML(post.title)}" loading="lazy">`
    : "";

  return `
    <article class="post-card">
      ${image}
      <div class="post-content">
        <div class="post-meta">
          <span class="topic-badge">${escapeHTML(post.topic)}</span>
          <span>${escapeHTML(post.author)}</span>
          <span>· ${timeAgo(post.createdAt)}</span>
        </div>

        <h3>${escapeHTML(post.title)}</h3>
        <p class="post-body">${escapeHTML(post.body)}</p>

        <div class="post-actions">
          <button class="post-action ${post.liked ? "liked" : ""}"
            data-action="like" data-id="${escapeHTML(post.id)}">
            ${post.liked ? "♥" : "♡"} ${Number(post.likes) || 0} Likes
          </button>

          <button class="post-action"
            data-action="share" data-id="${escapeHTML(post.id)}">
            ↗ Share
          </button>

          ${post.author === profile.name ? `
            <button class="post-action"
              data-action="delete" data-id="${escapeHTML(post.id)}">
              Delete
            </button>` : ""}
        </div>
      </div>
    </article>`;
}

function matches(post) {
  const text = [
    post.title,
    post.body,
    post.author,
    post.topic
  ].join(" ").toLowerCase();

  if (query && !text.includes(query.toLowerCase())) {
    return false;
  }

  if (currentFilter === "photos" && !post.image) return false;
  if (currentFilter === "popular" && post.likes < 50) return false;

  return true;
}

function sortPosts(list, mode = "new") {
  return [...list].sort((a, b) => {
    if (mode === "likes") return b.likes - a.likes;
    return b.createdAt - a.createdAt;
  });
}

function fill(id, list) {
  $(id).innerHTML = list.map(postMarkup).join("");
}

function renderPosts() {
  const visible = sortPosts(
    posts.filter(matches),
    $("sortSelect").value
  );

  fill(
    "popularPosts",
    [...posts].sort((a, b) => b.likes - a.likes).slice(0, 4)
  );

  fill("latestPosts", visible.slice(0, 5));
  fill("allPosts", visible);
  fill(
    "popularList",
    [...posts].sort((a, b) => b.likes - a.likes)
  );

  $("emptyPosts").hidden = visible.length !== 0;

  const mine = posts.filter(post => post.author === profile.name);

  fill("myPosts", sortPosts(mine));

  $("statPosts").textContent = mine.length;
  $("statLikes").textContent = mine.reduce(
    (total, post) => total + post.likes, 0
  );
  $("statTopics").textContent =
    new Set(mine.map(post => post.topic)).size;
}

const pageInfo = {
  "Home": ["YOUR COMMUNITY", "Home", "Discover ideas, stories and people worth following."],
  "All List": ["EXPLORE THE COMMUNITY", "All posts", "Find the latest stories from everyone."],
  "Popular": ["COMMUNITY FAVOURITES", "Popular", "See what people are enjoying."],
  "New Post": ["CREATE SOMETHING", "New post", "Share a thought, story or moment."],
  "Profile": ["YOUR SPACE", "Profile", "Manage your profile and contributions."],
  "Settings": ["MAKE IT YOURS", "Settings", "Personalize your DView experience."],
  "Sign in": ["WELCOME TO DVIEW", "Sign in", "Create a local demo profile."]
};

function goPage(page) {
  currentPage = page;

  const sections = {
    "Home": "homePage",
    "All List": "listPage",
    "Popular": "popularPage",
    "New Post": "newPage",
    "Profile": "profilePage",
    "Settings": "settingsPage",
    "Sign in": "authPage"
  };

  Object.entries(sections).forEach(([name, id]) => {
    $(id).hidden = name !== page;
  });

  const info = pageInfo[page] || pageInfo.Home;
  $("eyebrow").textContent = info[0];
  $("pageTitle").textContent = info[1];
  $("pageSubtitle").textContent = info[2];

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "Settings") {
    $("settingsName").value = profile.name;
    $("settingsBio").value = profile.bio;
  }

  if (page === "Profile") updateProfileUI();

  $("sidebar").classList.remove("open");
  $("shade").classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProfileUI() {
  const avatar = initials(profile.name);

  $("sideAvatar").textContent = avatar;
  $("topName").textContent = profile.name.split(" ")[0];
  $("topProfile").querySelector(".mini-avatar").textContent = avatar;
  $("sideName").textContent = profile.name;
  $("profileAvatar").textContent = avatar;
  $("composerAvatar").textContent = avatar;
  $("composerName").textContent = profile.name;
  $("profileName").textContent = profile.name;
  $("profileBio").textContent = profile.bio || "No bio added yet.";
}

function render() {
  updateProfileUI();
  renderPosts();
}

document.addEventListener("click", async event => {
  const pageButton = event.target.closest("[data-page]");

  if (pageButton) {
    event.preventDefault();
    const page = pageButton.dataset.page;

    if (page === "All List") currentFilter = "all";
    goPage(page);

    if (page === "New Post") $("postTitle").focus();
    renderPosts();
    return;
  }

  const filterButton = event.target.closest("[data-filter]");

  if (filterButton) {
    currentFilter = filterButton.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("active", button === filterButton);
    });

    goPage("All List");
    renderPosts();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  const post = posts.find(item => String(item.id) === action.dataset.id);
  if (!post) return;

  if (action.dataset.action === "like") {
    post.liked = !post.liked;
    post.likes = Math.max(0, post.likes + (post.liked ? 1 : -1));
    savePosts();
    renderPosts();
  }

  if (action.dataset.action === "delete") {
    if (post.author !== profile.name) {
      showToast("You can only delete your own posts.");
      return;
    }

    if (confirm("Delete this post?")) {
      posts = posts.filter(item => item.id !== post.id);
      savePosts();
      renderPosts();
      showToast("Post deleted.");
    }
  }

  if (action.dataset.action === "share") {
    const text = `${post.title}\n${post.body}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Post copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") showToast("Could not share.");
    }
  }
});

$("searchInput").addEventListener("input", event => {
  query = event.target.value.trim();
  renderPosts();
});

$("menuToggle").addEventListener("click", () => {
  $("sidebar").classList.add("open");
  $("shade").classList.add("show");
});

$("shade").addEventListener("click", () => {
  $("sidebar").classList.remove("open");
  $("shade").classList.remove("show");
});

$("sortSelect").addEventListener("change", renderPosts);

$("topProfile").addEventListener("click", () => goPage("Profile"));
$("accountMenu").addEventListener("click", () => goPage("Settings"));

$("noticeBtn").addEventListener("click", () => {
  showToast("You are all caught up!");
});

$("postForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("postTitle").value.trim();
  const body = $("postBody").value.trim();
  const image = $("postImage").value.trim();

  if (!title || !body) {
    showToast("Please add a title and text.");
    return;
  }

  if (image) {
    try {
      const url = new URL(image);
      if (!["http:", "https:"].includes(url.protocol)) throw Error();
    } catch {
      showToast("Enter a valid image URL.");
      return;
    }
  }

  posts.unshift({
    id: Date.now().toString(),
    author: profile.name,
    title,
    body,
    topic: $("postTopic").value,
    image,
    likes: 0,
    liked: false,
    createdAt: Date.now()
  });

  savePosts();
  $("postForm").reset();
  query = "";
  $("searchInput").value = "";
  currentFilter = "all";

  render();
  goPage("All List");
  showToast("Post added to this browser!");
});

$("editProfileBtn").addEventListener("click", () => {
  $("editName").value = profile.name;
  $("editBio").value = profile.bio;
  $("editDialog").showModal();
});

$("closeEdit").addEventListener("click", () => {
  $("editDialog").close();
});

$("editForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("editName").value.trim();
  if (!name) return;

  const oldName = profile.name;
  profile = { name, bio: $("editBio").value.trim() };

  posts.forEach(post => {
    if (post.author === oldName) post.author = name;
  });

  saveProfile();
  savePosts();
  $("editDialog").close();
  render();
  showToast("Profile updated!");
});

$("saveSettings").addEventListener("click", () => {
  const name = $("settingsName").value.trim();
  if (!name) {
    showToast("Please enter a name.");
    return;
  }

  const oldName = profile.name;
  profile = { name, bio: $("settingsBio").value.trim() };

  posts.forEach(post => {
    if (post.author === oldName) post.author = name;
  });

  saveProfile();
  savePosts();
  render();
  showToast("Settings saved!");
});

$("darkToggle").checked = localStorage.getItem(THEME_KEY) === "true";
document.body.classList.toggle("dark", $("darkToggle").checked);

$("darkToggle").addEventListener("change", event => {
  document.body.classList.toggle("dark", event.target.checked);
  localStorage.setItem(THEME_KEY, String(event.target.checked));
});

$("clearLocal").addEventListener("click", () => {
  if (!confirm("Reset demo posts and profile?")) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);

  posts = samplePosts.map(post => ({ ...post }));
  profile = {
    name: "Guest User",
    bio: "Sharing ideas and everyday moments."
  };

  savePosts();
  saveProfile();
  render();
  goPage("Settings");
  showToast("Demo data reset.");
});

$("continueGuest").addEventListener("click", () => {
  const name = $("guestName").value.trim();

  if (!name) {
    showToast("Please enter your name.");
    return;
  }

  profile = {
    name,
    bio: $("guestBio").value.trim()
  };

  saveProfile();
  render();
  goPage("Home");
  showToast("Demo profile created!");
});

document.addEventListener("keydown", event => {
  if (event.key === "/" &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    $("searchInput").focus();
  }

  if (event.key === "Escape") {
    $("sidebar").classList.remove("open");
    $("shade").classList.remove("show");
  }
});

render();
