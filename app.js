/* =========================================================
   Campus Lost & Found - Main JavaScript
   ---------------------------------------------------------
   How the app works (good to explain in the viva):
   1. All items live in ONE array called `items`.
   2. The array is saved to LocalStorage as JSON text, and
      loaded again when the page opens.
   3. `state` remembers what the user is looking at
      (active tab, selected category, search text).
   4. Every time something changes we call renderItems(),
      which filters the array and redraws the cards.
   ========================================================= */

"use strict";

/* ---------- 1. CONSTANTS ---------- */
const STORAGE_KEY = "campusLostFound.items";      // where items are saved
const SEEDED_KEY = "campusLostFound.seeded";      // remembers that demo data was added once

const CATEGORIES = ["Electronics", "ID Cards", "Books/Notes", "Keys", "Personal Accessories"];

// Fictional numbers used only for the project demo (not real people).
const HELP_DESK = {
  name: "Campus Help Desk",
  phoneDisplay: "+91 90000 00000",
  phoneDial: "+919000000000"
};
const DEMO_CONTACT = "9000000001";   // fills the form's contact box when testing

/* ---------- 2. APPLICATION DATA ---------- */
let items = [];            // every reported item

const state = {
  activeTab: "lost",       // "lost" or "found"
  category: "All",         // selected category chip
  searchText: "",          // text typed in the search box
  status: "all",           // "all", "open" or "returned"
  sortBy: "newest"         // "newest", "oldest" or "name"
};

let claimItemId = null;    // which item the claim dialog is showing

/* ---------- 3. GRAB HTML ELEMENTS ONCE ---------- */
const els = {
  navToggle: document.getElementById("navToggle"),
  navLinks: document.getElementById("navLinks"),
  tabs: document.querySelectorAll(".tab"),
  searchInput: document.getElementById("searchInput"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  emptyResetBtn: document.getElementById("emptyResetBtn"),
  categoryChips: document.getElementById("categoryChips"),
  resultsInfo: document.getElementById("resultsInfo"),
  itemsGrid: document.getElementById("itemsGrid"),
  emptyState: document.getElementById("emptyState"),
  emptyMessage: document.getElementById("emptyMessage"),
  countLost: document.getElementById("countLost"),
  countFound: document.getElementById("countFound"),
  statLost: document.getElementById("statLost"),
  statFound: document.getElementById("statFound"),
  statTotal: document.getElementById("statTotal"),
  statReturned: document.getElementById("statReturned"),
  statusSelect: document.getElementById("statusSelect"),
  sortSelect: document.getElementById("sortSelect"),
  demoContactBtn: document.getElementById("demoContactBtn"),
  contactInput: document.getElementById("contact"),
  claimModal: document.getElementById("claimModal"),
  claimEyebrow: document.getElementById("claimEyebrow"),
  claimTitle: document.getElementById("claimTitle"),
  claimWhere: document.getElementById("claimWhere"),
  claimReporter: document.getElementById("claimReporter"),
  claimPhone: document.getElementById("claimPhone"),
  claimCall: document.getElementById("claimCall"),
  claimCopy: document.getElementById("claimCopy"),
  claimClose: document.getElementById("claimClose"),
  claimDone: document.getElementById("claimDone"),
  form: document.getElementById("reportForm"),
  categorySelect: document.getElementById("category"),
  locationLabel: document.getElementById("locationLabel"),
  locationInput: document.getElementById("location"),
  dateInput: document.getElementById("date"),
  description: document.getElementById("description"),
  descCounter: document.getElementById("descCounter"),
  toastContainer: document.getElementById("toastContainer"),
  year: document.getElementById("year")
};

/* ---------- 4. LOCALSTORAGE HELPERS ---------- */

// Save the items array as a JSON string.
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Happens if storage is full or blocked (e.g. private mode)
    showToast("Could not save data in this browser.", "error");
  }
}

// Read the items array back. If anything is wrong, return an empty list.
function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];   // corrupted data: start fresh instead of crashing
  }
}

// Returns a date string (YYYY-MM-DD) for "today minus N days".
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toInputDate(d);
}

// Formats a Date as YYYY-MM-DD using LOCAL time (what <input type="date"> uses).
function toInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// On the very first visit, add a few sample listings so the app is not empty.
function seedDemoItems() {
  if (localStorage.getItem(SEEDED_KEY)) return;   // already done before

  items = [
    { id: 1, type: "lost", name: "Black Wireless Earbuds", category: "Electronics", location: "Central Library", date: daysAgo(2), contact: "demo.student1@campus.edu", description: "Black earbuds in a small charging case with a scratch on the lid." },
    { id: 2, type: "lost", name: "Student ID Card", category: "ID Cards", location: "Main Canteen", date: daysAgo(1), contact: "9876543210", description: "ID card with a blue lanyard. Name printed on the front." },
    { id: 3, type: "found", name: "Scientific Calculator", category: "Electronics", location: "Block A, Room 204", date: daysAgo(3), contact: "9000000002", description: "Casio calculator left on the last bench after the maths lecture." },
    { id: 4, type: "found", name: "Bunch of Keys", category: "Keys", location: "Parking Area", date: daysAgo(1), contact: "9123456780", description: "Three keys on a red keychain with a small football charm." },
    { id: 5, type: "lost", name: "Physics Notebook", category: "Books/Notes", location: "Block B Corridor", date: daysAgo(4), contact: "demo.student2@campus.edu", description: "Green spiral notebook with handwritten Unit 3 and 4 notes." },
    { id: 6, type: "found", name: "Silver Wrist Watch", category: "Personal Accessories", location: "Sports Ground", date: daysAgo(2), contact: "demo.finder2@campus.edu", description: "Analog watch with a metal strap, found near the basketball court." }
  ];
  saveItems();
  localStorage.setItem(SEEDED_KEY, "yes");
}

/* ---------- 5. SMALL UTILITY FUNCTIONS ---------- */

// Stops user text from being treated as HTML (prevents code injection / XSS).
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Turns "2026-11-02" into "Today", "Yesterday" or "3 days ago".
function timeAgo(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const then = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - then) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

// Turns "2026-11-02" into "2 Nov 2026" for display.
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Makes a new unique id. Date.now() is the time in milliseconds.
function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/* ---------- 6. FILTERING AND SEARCH ---------- */

// Returns only the items that match the active tab, category and search text.
function getFilteredItems() {
  const search = state.searchText.trim().toLowerCase();

  return items
    .filter(item => item.type === state.activeTab)
    .filter(item => state.category === "All" || item.category === state.category)
    .filter(item => {
      if (state.status === "open") return !item.returned;
      if (state.status === "returned") return Boolean(item.returned);
      return true;
    })
    .filter(item => {
      if (search === "") return true;
      // Combine all searchable fields into one string and look for the text in it.
      const searchableText = `${item.name} ${item.description} ${item.location} ${item.category}`.toLowerCase();
      return searchableText.includes(search);
    })
    .sort((a, b) => {
      if (state.sortBy === "oldest") return a.date.localeCompare(b.date) || a.id - b.id;
      if (state.sortBy === "name") return a.name.localeCompare(b.name);
      return b.date.localeCompare(a.date) || b.id - a.id;            // newest first
    });
}

// True when any search, category, status or sort option has been changed.
function hasActiveFilter() {
  return state.category !== "All" || state.searchText.trim() !== "" || state.status !== "all";
}

/* ---------- 7. RENDERING (drawing things on the page) ---------- */

// Builds the HTML for one card.
function createCardHTML(item) {
  const isLost = item.type === "lost";
  const isReturned = Boolean(item.returned);
  const locationLabel = isLost ? "Last seen" : "Found at";
  const claimLabel = isLost ? "I found this" : "Claim this item";
  const returnLabel = isLost ? "Mark as recovered" : "Mark as returned";
  const safeName = escapeHTML(item.name);

  return `
    <article class="card ${isLost ? "" : "card--found"} ${isReturned ? "card--returned" : ""}" data-id="${item.id}">
      <div class="card__top">
        <span class="badge ${isLost ? "badge--lost" : "badge--found"}">${isLost ? "Lost" : "Found"}</span>
        ${isReturned ? '<span class="badge badge--returned">Returned</span>' : ""}
        <span class="card__category">${escapeHTML(item.category)}</span>
      </div>
      <h3 class="card__title">${safeName}</h3>
      <ul class="card__meta">
        <li><span aria-hidden="true">&#128205;</span><span>${locationLabel}: ${escapeHTML(item.location)}</span></li>
        <li><span aria-hidden="true">&#128197;</span><span>${formatDate(item.date)} <em class="card__ago">(${timeAgo(item.date)})</em></span></li>
      </ul>
      <p class="card__description">${escapeHTML(item.description)}</p>
      <div class="card__actions">
        <button class="btn btn--primary btn--sm" type="button" data-claim-id="${item.id}" ${isReturned ? "disabled" : ""}>${claimLabel}</button>
        <button class="btn btn--secondary btn--sm" type="button" data-return-id="${item.id}">${isReturned ? "Reopen" : returnLabel}</button>
      </div>
      <div class="card__footer">
        <span class="card__contact">&#9993; ${escapeHTML(item.contact)}</span>
        <button class="btn-delete" type="button" data-delete-id="${item.id}" aria-label="Delete listing ${safeName}">Delete</button>
      </div>
    </article>`;
}

// Redraws the card grid, the empty state and the result text.
function renderItems() {
  const visibleItems = getFilteredItems();
  const typeName = state.activeTab === "lost" ? "lost" : "found";

  els.itemsGrid.innerHTML = visibleItems.map(createCardHTML).join("");

  const isEmpty = visibleItems.length === 0;
  els.emptyState.hidden = !isEmpty;
  els.itemsGrid.hidden = isEmpty;

  if (isEmpty) {
    const filtered = hasActiveFilter();
    els.emptyMessage.textContent = filtered
      ? `No ${typeName} items match your search or filter. Try different keywords or clear the filters.`
      : `No ${typeName} items have been reported yet. Use the form below to add one.`;
    els.emptyResetBtn.hidden = !filtered;
  }

  els.resultsInfo.textContent = `Showing ${visibleItems.length} ${typeName} item${visibleItems.length === 1 ? "" : "s"}`;
  updateCounts();
}

// Updates the numbers on the tabs and in the hero statistics.
function updateCounts() {
  const lostCount = items.filter(item => item.type === "lost").length;
  const foundCount = items.filter(item => item.type === "found").length;

  els.countLost.textContent = lostCount;
  els.countFound.textContent = foundCount;
  els.statLost.textContent = lostCount;
  els.statFound.textContent = foundCount;
  els.statTotal.textContent = items.length;
  els.statReturned.textContent = items.filter(item => item.returned).length;
}

// Creates the category chips ("All" + one per category) and fills the form dropdown.
function buildCategoryControls() {
  const chipNames = ["All", ...CATEGORIES];
  els.categoryChips.innerHTML = chipNames.map(name =>
    `<button type="button" class="chip ${name === state.category ? "chip--active" : ""}" data-category="${name}" aria-pressed="${name === state.category}">${name}</button>`
  ).join("");

  CATEGORIES.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.categorySelect.appendChild(option);
  });
}

// Highlights the chip that matches state.category.
function updateChipStyles() {
  els.categoryChips.querySelectorAll(".chip").forEach(chip => {
    const isActive = chip.dataset.category === state.category;
    chip.classList.toggle("chip--active", isActive);
    chip.setAttribute("aria-pressed", isActive);
  });
}

/* ---------- 8. TOAST NOTIFICATIONS ---------- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);

  // Fade out after 3 seconds, then remove from the page.
  setTimeout(() => {
    toast.classList.add("toast--hide");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---------- 9. TABS, SEARCH, FILTERS ---------- */

function switchTab(type) {
  state.activeTab = type;
  els.tabs.forEach(tab => {
    const isActive = tab.dataset.type === type;
    tab.classList.toggle("tab--active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
  renderItems();
}

function resetFilters() {
  state.category = "All";
  state.searchText = "";
  state.status = "all";
  state.sortBy = "newest";
  els.searchInput.value = "";
  els.statusSelect.value = "all";
  els.sortSelect.value = "newest";
  updateChipStyles();
  renderItems();
}

/* ---------- 10. FORM VALIDATION ---------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;      // 10-digit Indian mobile number

// Checks all form values. Returns an object of errors (empty object = valid).
function validateReport(data) {
  const errors = {};

  if (data.name.length < 3) errors.itemName = "Item name must be at least 3 characters.";

  if (!CATEGORIES.includes(data.category)) errors.category = "Please select a category.";

  if (data.location.length < 3) {
    errors.location = data.type === "lost"
      ? "Please enter where the item was last seen."
      : "Please enter where the item was found.";
  }

  if (!data.date) {
    errors.date = "Please choose a date.";
  } else if (data.date > toInputDate(new Date())) {
    errors.date = "Date cannot be in the future.";
  }

  const contactIsPhone = PHONE_PATTERN.test(data.contact.replace(/[\s-]/g, ""));
  if (!data.contact) {
    errors.contact = "Contact information is required.";
  } else if (!EMAIL_PATTERN.test(data.contact) && !contactIsPhone) {
    errors.contact = "Enter a valid email address or 10-digit mobile number.";
  }

  if (data.description.length < 10) errors.description = "Description must be at least 10 characters.";

  return errors;
}

// Shows each error message under its field and marks the field red.
function showErrors(errors) {
  const fieldIds = ["itemName", "category", "location", "date", "contact", "description"];
  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    const errorBox = document.getElementById(id + "Error");
    errorBox.textContent = errors[id] || "";
    input.classList.toggle("input--invalid", Boolean(errors[id]));
  });
}

// Reads the values from the form into a clean object.
function readFormData() {
  return {
    type: els.form.elements.itemType.value,
    name: els.form.elements.itemName.value.trim(),
    category: els.form.elements.category.value,
    location: els.form.elements.location.value.trim(),
    date: els.form.elements.date.value,
    contact: els.form.elements.contact.value.trim(),
    description: els.form.elements.description.value.trim()
  };
}

function handleFormSubmit(event) {
  event.preventDefault();                 // stop the page from reloading

  const data = readFormData();
  const errors = validateReport(data);
  showErrors(errors);

  if (Object.keys(errors).length > 0) {
    showToast("Please fix the highlighted fields.", "error");
    const firstInvalid = els.form.querySelector(".input--invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Add the new item at the start of the array and save.
  items.unshift({ id: generateId(), ...data, returned: false });
  saveItems();

  // Show the matching tab and clear filters so the new card is visible.
  state.category = "All";
  state.searchText = "";
  state.status = "all";
  state.sortBy = "newest";
  els.searchInput.value = "";
  els.statusSelect.value = "all";
  els.sortSelect.value = "newest";
  updateChipStyles();
  switchTab(data.type);

  resetForm();
  showToast(`Your ${data.type} item was reported successfully.`);
  document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
}

// Clears error messages, the character counter and the location label.
// (It does NOT call form.reset(), because that would trigger the "reset" event again.)
function clearFormMessages() {
  showErrors({});
  updateLocationLabel();
  els.descCounter.textContent = "0";
}

// Used after a successful submit: empty the fields, then clear the messages.
function resetForm() {
  els.form.reset();        // fires the "reset" event, which also calls clearFormMessages()
  clearFormMessages();
}

// The location label changes depending on lost / found.
function updateLocationLabel() {
  const type = els.form.elements.itemType.value;
  els.locationLabel.textContent = type === "lost" ? "Location Last Seen *" : "Location Found *";
}

/* ---------- 11. DELETING ---------- */
function deleteItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  if (!window.confirm(`Delete the listing "${item.name}"? This cannot be undone.`)) return;

  items = items.filter(entry => entry.id !== id);
  saveItems();
  renderItems();
  showToast("Listing deleted.");
}

/* ---------- 11b. RETURNED STATUS ---------- */
// Flips an item between "open" and "returned".
function toggleReturned(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  item.returned = !item.returned;
  saveItems();
  renderItems();
  showToast(item.returned ? "Great! Marked as returned." : "Listing reopened.");
}

/* ---------- 11c. CLAIM / CONTACT DIALOG ---------- */
function openClaimModal(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  claimItemId = id;
  const isLost = item.type === "lost";

  els.claimEyebrow.textContent = isLost ? "You found this item?" : "Want to claim this item?";
  els.claimTitle.textContent = item.name;
  els.claimWhere.textContent = `${isLost ? "Last seen" : "Found at"}: ${item.location}`;
  els.claimReporter.textContent = `${isLost ? "Owner" : "Finder"}: ${item.contact}`;
  els.claimPhone.textContent = HELP_DESK.phoneDisplay;
  els.claimPhone.href = `tel:${HELP_DESK.phoneDial}`;
  els.claimCall.href = `tel:${HELP_DESK.phoneDial}`;

  els.claimModal.showModal();
}

function closeClaimModal() {
  if (els.claimModal.open) els.claimModal.close();
  claimItemId = null;
}

// Copies the help desk number. Falls back gracefully if the clipboard is blocked.
function copyHelpDeskNumber() {
  const text = HELP_DESK.phoneDisplay;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast("Number copied."))
      .catch(() => showToast(`Copy failed. Number: ${text}`, "error"));
  } else {
    showToast(`Help Desk number: ${text}`);
  }
}

/* ---------- 12. EVENT LISTENERS ---------- */
function setupEventListeners() {
  // Mobile menu open / close
  els.navToggle.addEventListener("click", () => {
    const isOpen = els.navLinks.classList.toggle("nav-links--open");
    els.navToggle.setAttribute("aria-expanded", isOpen);
  });
  // Close the mobile menu after clicking a link
  els.navLinks.addEventListener("click", event => {
    if (event.target.tagName === "A") {
      els.navLinks.classList.remove("nav-links--open");
      els.navToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Tabs
  els.tabs.forEach(tab => tab.addEventListener("click", () => switchTab(tab.dataset.type)));

  // Live search: "input" fires on every keystroke
  els.searchInput.addEventListener("input", () => {
    state.searchText = els.searchInput.value;
    renderItems();
  });

  // Category chips (event delegation: one listener for all chips)
  els.categoryChips.addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    updateChipStyles();
    renderItems();
  });

  // Clear filter buttons
  els.resetFiltersBtn.addEventListener("click", resetFilters);
  els.emptyResetBtn.addEventListener("click", resetFilters);

  // Status and sort dropdowns
  els.statusSelect.addEventListener("change", () => {
    state.status = els.statusSelect.value;
    renderItems();
  });
  els.sortSelect.addEventListener("change", () => {
    state.sortBy = els.sortSelect.value;
    renderItems();
  });

  // Card buttons (event delegation, because cards are created dynamically)
  els.itemsGrid.addEventListener("click", event => {
    const deleteBtn = event.target.closest("[data-delete-id]");
    if (deleteBtn) return deleteItem(Number(deleteBtn.dataset.deleteId));

    const claimBtn = event.target.closest("[data-claim-id]");
    if (claimBtn) return openClaimModal(Number(claimBtn.dataset.claimId));

    const returnBtn = event.target.closest("[data-return-id]");
    if (returnBtn) toggleReturned(Number(returnBtn.dataset.returnId));
  });

  // Claim dialog: close buttons, click outside the box, copy number
  els.claimClose.addEventListener("click", closeClaimModal);
  els.claimDone.addEventListener("click", closeClaimModal);
  els.claimModal.addEventListener("click", event => {
    if (event.target === els.claimModal) closeClaimModal();   // click on the dark backdrop
  });
  els.claimModal.addEventListener("close", () => { claimItemId = null; });
  els.claimCopy.addEventListener("click", copyHelpDeskNumber);

  // Fills the contact box with a demo number (handy while testing the form)
  els.demoContactBtn.addEventListener("click", () => {
    els.contactInput.value = DEMO_CONTACT;
    els.contactInput.dispatchEvent(new Event("input", { bubbles: true }));
    els.contactInput.focus();
  });

  // Form
  els.form.addEventListener("submit", handleFormSubmit);
  // The Reset Form button: wait a moment for the browser to clear the fields, then clear messages
  els.form.addEventListener("reset", () => setTimeout(clearFormMessages, 0));
  // Change the location label when the Lost / Found radio changes
  els.form.querySelectorAll('input[name="itemType"]').forEach(radio =>
    radio.addEventListener("change", updateLocationLabel)
  );
  els.description.addEventListener("input", () => {
    els.descCounter.textContent = els.description.value.length;
  });
  // Remove the red error style as soon as the user edits a field
  els.form.addEventListener("input", event => {
    if (event.target.classList.contains("input--invalid")) {
      event.target.classList.remove("input--invalid");
      const errorBox = document.getElementById(event.target.id + "Error");
      if (errorBox) errorBox.textContent = "";
    }
  });
}

/* ---------- 13. START THE APP ---------- */
function init() {
  els.year.textContent = new Date().getFullYear();
  els.dateInput.max = toInputDate(new Date());      // browser blocks future dates in the picker

  buildCategoryControls();
  items = loadItems();     // load saved listings
  seedDemoItems();         // adds sample listings on the very first visit only
  setupEventListeners();
  updateLocationLabel();
  renderItems();
}

init();
