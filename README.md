# Campus Lost & Found Management System

A responsive web application where students can report lost items, report found items, browse listings and search across campus. Built as a Project-Based Assessment using only HTML, CSS and vanilla JavaScript. No framework, backend or paid API is needed.

## Features

- **Dual tabs:** switch between *Lost Items* and *Found Items* (each tab shows a live count).
- **Category filters:** Electronics, ID Cards, Books/Notes, Keys, Personal Accessories (plus "All").
- **Live search:** results update on every keystroke, matching item name, description, location and category.
- **Report form:** choose Lost or Found, then enter item name, category, location, date, contact and description.
- **Validation with clear messages:** minimum lengths, a required category, a date that cannot be in the future, and a contact that must be a valid email or 10-digit mobile number.
- **Item cards:** colour-coded Lost (orange) and Found (green) cards showing name, category, location, date, description and contact.
- **LocalStorage:** listings are saved in the browser and survive page refreshes.
- **Delete listings:** each card has a Delete button with a confirmation prompt.
- **Claim / contact dialog:** every card has a "Claim this item" (found) or "I found this" (lost) button that opens a dialog with the reporter's contact, a demo Campus Help Desk number (+91 90000 00000, fictional) with Call and Copy buttons, and safe-collection tips.
- **Returned status:** mark an item as returned/recovered (and reopen it); the hero shows a live "Returned to owner" count.
- **Status filter and sorting:** filter by All / Still open / Returned, and sort by newest, oldest or name.
- **Friendly dates:** each card shows a "Today / Yesterday / 3 days ago" label next to the date.
- **Demo contact helper:** a "Use the demo number" link in the report form fills a sample number for testing.
- **Usability:** empty states, success/error toast notifications, form reset after submit, Clear Filters button, hamburger menu on mobile.
- **Security basics:** user text is escaped before being shown, so typed HTML cannot run on the page.

## Technology Stack

| Technology | Used for |
|---|---|
| HTML5 | Page structure (semantic tags, form, accessible labels) |
| CSS3 | Styling, CSS variables, Grid/Flexbox, responsive media queries |
| JavaScript (ES6) | Tabs, filtering, search, validation, rendering, LocalStorage |
| LocalStorage | Saving data in the browser |

The only external resource is the Inter font from Google Fonts. If it cannot load, the browser falls back to a system font and nothing breaks.

## Project Structure

```
Campus-Lost-and-Found/
├── index.html   # Page structure
├── style.css    # All styling and responsive rules
├── app.js       # All application logic
└── README.md    # Project instructions
```

All project files are kept directly in one folder; there are no CSS or JavaScript subfolders.

## How to Run Locally

1. Download or clone the project folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No installation or server is needed.

The help desk number is fictional; change `HELP_DESK` at the top of `app.js` to use a real one. Six sample listings are added on the first visit so the page is not empty. You can delete them like any other listing.

To reset the demo data, open browser DevTools, go to Application > Local Storage, and clear the site's entries. Then refresh.

## Deployment (GitHub Pages)

1. Create a free account at [github.com](https://github.com) and click **New repository**. Name it, for example, `campus-lost-and-found`, set it to **Public**, and create it.
2. Upload the project files, upload all four files (`index.html`, `style.css`, `app.js`, and `README.md`) together in the repository root. Use **Add file > Upload files**, or from a terminal in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Campus Lost and Found project"
   git branch -M main
   git remote add origin https://github.com/<your-username>/campus-lost-and-found.git
   git push -u origin main
   ```
3. In the repository, open **Settings > Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, choose branch **main** and folder **/ (root)**, then click **Save**.
5. Wait 1 to 2 minutes. The live link will be `https://<your-username>.github.io/campus-lost-and-found/`.
6. Open the live link and test it (tabs, search, adding and deleting an item) before submitting.

Netlify and Vercel also work: drag the project folder onto the Netlify "Deploy manually" page, or import the GitHub repository in Vercel. No build settings are required.

## How the Code Works (viva notes)

- **One array, one source of truth:** all listings are in the `items` array. `saveItems()` stores it in LocalStorage with `JSON.stringify`, and `loadItems()` reads it back with `JSON.parse`.
- **`state` object:** remembers the active tab, selected category and search text.
- **`getFilteredItems()`:** applies three filters in order (tab, then category, then search text) and sorts newest first.
- **`renderItems()`:** builds card HTML from the filtered list, shows or hides the empty state, and updates counts. It runs after every change.
- **`validateReport()`:** returns an object of error messages. If the object is empty, the form is valid and `handleFormSubmit()` adds the item.
- **Event delegation:** one click listener on the card grid handles every Delete button, and one on the chip container handles every category chip, even though cards and chips are created dynamically.
- **Claim dialog:** uses the native `<dialog>` element. `openClaimModal(id)` fills it with the item's details and calls `showModal()`, which gives Esc-to-close and a backdrop for free.
- **`toggleReturned(id)`:** flips `item.returned`, saves, and re-renders.
- **`escapeHTML()`:** protects against code injection by turning user text into plain text.

## Known Limitations

- Data is stored per browser. Different devices or browsers do not share listings (a real deployment would need a backend database).
- Contact details are visible to anyone using the same browser, since this is a demo without user accounts.
- Any listing can be deleted, because there is no login to tell who owns a listing.
