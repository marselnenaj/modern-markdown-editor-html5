# Markdown Viewer & Editor

A simple, modern web application for viewing and editing Markdown files with an iOS-inspired interface. This application allows users to select local Markdown files or folders, view their rendered HTML, and edit them using a WYSIWYG editor.
![image](https://i.ibb.co/WvtnnQvy/banner-markdown-editor.png)

## Features

* **Local File & Folder Access:** Users can select individual `.md` files or entire folders to browse and view Markdown content.
* **Markdown Rendering:** Utilizes Marked.js to convert Markdown into HTML for display.
* **WYSIWYG Editing:** Integrates Toast UI Editor for a rich text editing experience, allowing users to easily modify Markdown content.
* **Automatic File Download:** When changes are saved, the modified file is automatically downloaded to preserve your edits.
* **Session Persistence:** The last opened file is saved in the browser's local storage and automatically restored when the page is reloaded.
* **Clear Function:** Provides a button to clear the current file from the editor and local storage.
* **Responsive Design:** The interface adapts to different screen sizes, offering a consistent experience on desktop, tablet, and mobile devices.
* **iOS-like Aesthetics:** The UI is styled to mimic the clean and modern look and feel of iOS applications.
* **File Navigation:** A sidebar allows for easy navigation between files when a folder is selected.
* **Dynamic Content Loading:** Content is loaded and rendered dynamically without page reloads.

## Technologies Used

* **HTML5:** For the basic structure of the web application.
* **CSS3:** For styling the application, including the use of CSS variables for theming and responsive design.
* **JavaScript (ES6+):** For application logic, DOM manipulation, event handling, and interacting with browser APIs (File System Access API where available).
* **Marked.js:** A fast Markdown parser and compiler.
* **Toast UI Editor:** A powerful and productive Markdown WYSIWYG editor.

## Getting Started

1. Clone this repository or download the source files.
2. Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Safari, Edge).
3. Use the "Select Folder" or "Select File" button to load your Markdown files.

## How It Works

* The application uses HTML for the structure, CSS for styling (with a heavy emphasis on iOS-like design principles and responsive layouts), and JavaScript for all dynamic functionalities.
* When a user selects a file or folder, JavaScript handles the file reading process.
* For viewing, the Markdown content is passed to Marked.js, which converts it to HTML, and then displayed in the main content area.
* For editing, Toast UI Editor is initialized with the Markdown content, providing a user-friendly interface to make changes.
* When changes are saved, the application automatically initiates a download of the modified file to preserve your work.
* The current file content and name are stored in the browser's local storage, allowing the application to restore your last session when the page is reloaded.
* The Clear button allows users to unload the current file from the editor and remove it from local storage.
* The application aims to provide a seamless experience for users who frequently work with Markdown files.

## Attribution

* **Prompted by:** Marsel Nenaj
* **Coded by:** Model Gemini 2.5 Pro
* **GitHub Repository:** [modern-markdown-editor-html5](https://github.com/marselnenaj/modern-markdown-editor-html5)