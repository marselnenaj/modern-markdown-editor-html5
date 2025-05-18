<div align="center">

<img src="https://i.ibb.co/WvtnnQvy/banner-markdown-editor.png" alt="Markdown Editor Banner" width="100%">

# ✨ Markdown Viewer & Editor ✨

<p align="center">
<strong>A modern, lightweight web application for viewing and editing Markdown files with an elegant iOS-inspired interface.</strong>
</p>

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg?style=for-the-badge)](https://github.com/marselnenaj/modern-markdown-editor-html5/releases)
[![Demo](https://img.shields.io/badge/demo-online-brightgreen.svg?style=for-the-badge)](https://marselnenaj.github.io/modern-markdown-editor-html5/)
[![Responsive](https://img.shields.io/badge/responsive-yes-orange.svg?style=for-the-badge)](#browser-compatibility)

<p align="center">
This application allows users to select local Markdown files or folders, view their rendered HTML, and edit them using a powerful WYSIWYG editor - all in a beautiful, responsive design.
</p>

<br>

<p align="center">
  <a href="#-features">✨ Features</a> •
  <a href="#-demo">🚀 Demo</a> •
  <a href="#-installation">💻 Installation</a> •
  <a href="#-usage">📝 Usage</a> •
  <a href="#️-technologies-used">🛠️ Technologies</a> •
  <a href="#-browser-compatibility">📱 Compatibility</a> •
  <a href="#-license">📄 License</a>
</p>

</div>

---

## ✨ Features

<table align="center">
  <tr>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/file-icon.svg" width="60" height="60" alt="File Management"/><br/>
      <h3>📂 File Management</h3>
      <ul align="left">
        <li>Select individual <code>.md</code> files or entire folders</li>
        <li>Browse and view multiple files from a folder</li>
        <li>Intuitive file navigation sidebar</li>
        <li>Session persistence through browser storage</li>
      </ul>
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/edit-icon.svg" width="60" height="60" alt="Editing Experience"/><br/>
      <h3>📝 Editing Experience</h3>
      <ul align="left">
        <li>WYSIWYG Markdown editing with Toast UI Editor</li>
        <li>Instant preview of formatted content</li>
        <li>Automatic file download when changes are saved</li>
        <li>Clean iOS-inspired design for distraction-free editing</li>
      </ul>
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/ui-icon.svg" width="60" height="60" alt="Modern UI/UX"/><br/>
      <h3>🎨 Modern UI/UX</h3>
      <ul align="left">
        <li>Responsive design works on all devices</li>
        <li>iOS-like aesthetics with intuitive controls</li>
        <li>Dark mode support through system preferences</li>
        <li>Animated transitions for a polished feel</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/performance-icon.svg" width="60" height="60" alt="Performance"/><br/>
      <h3>⚡ Performance</h3>
      <ul align="left">
        <li>Dynamic content loading without page reloads</li>
        <li>Fast Markdown rendering with Marked.js</li>
        <li>Local caching for improved speed</li>
        <li>Offline capability for editing without internet</li>
      </ul>
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/security-icon.svg" width="60" height="60" alt="Security"/><br/>
      <h3>🔒 Security</h3>
      <ul align="left">
        <li>All processing happens client-side</li>
        <li>No server uploads of your content</li>
        <li>No tracking or analytics</li>
        <li>Open source code for full transparency</li>
      </ul>
    </td>
    <td align="center" width="33%">
      <img src="https://raw.githubusercontent.com/marselnenaj/modern-markdown-editor-html5/assets/accessibility-icon.svg" width="60" height="60" alt="Accessibility"/><br/>
      <h3>♿ Accessibility</h3>
      <ul align="left">
        <li>Keyboard shortcuts for common actions</li>
        <li>Screen reader friendly markup</li>
        <li>High contrast mode support</li>
        <li>Resizable text and controls</li>
      </ul>
    </td>
  </tr>
</table>

## 🚀 Demo

<div align="center">
  <a href="https://marselnenaj.github.io/modern-markdown-editor-html5/" target="_blank">
    <img src="https://img.shields.io/badge/Try_the_Live_Demo-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo Button" />
  </a>
</div>

## 💻 Installation

<div class="installation-options">

### 🌐 Use Online

The quickest way to start using the app:

```
🔗 https://marselnenaj.github.io/modern-markdown-editor-html5/
```

### 📦 Download & Run Locally

**Option 1: Direct Download**
```bash
# 1. Download the latest release from the repo
# 2. Extract to your preferred location
# 3. Open index.html in your browser
```

**Option 2: Clone Repository**
```bash
# Clone the repository
git clone https://github.com/marselnenaj/modern-markdown-editor-html5.git

# Navigate to project directory
cd modern-markdown-editor-html5

# Open in browser (macOS)
open index.html

# Or on Windows
start index.html
```
</div>

## 📝 Usage

1. Open the application in your browser
2. Click "Select Folder" to browse a directory of Markdown files or "Select File" to open a single file
3. Your selected Markdown will render automatically in the viewer
4. Click "Edit" to modify the content using the WYSIWYG editor
5. Click "Save" to download your changes
6. Use "Clear" to remove the current file from the editor

## 🛠️ Technologies Used

* **HTML5:** Basic structure of the web application
* **CSS3:** Styling with CSS variables for theming and responsive design
* **JavaScript (ES6+):** Application logic, DOM manipulation, and browser API integration
* **[Marked.js](https://marked.js.org/):** Fast Markdown parser and compiler
* **[Toast UI Editor](https://ui.toast.com/tui-editor):** Powerful Markdown WYSIWYG editor

## ⚙️ How It Works

* The application uses HTML for structure, CSS for styling (with iOS-like design principles), and JavaScript for dynamic functionality
* When a file/folder is selected, JavaScript handles the file reading process
* For viewing, Markdown content is passed to Marked.js for HTML conversion
* For editing, Toast UI Editor provides a user-friendly interface
* When saving, the application downloads the modified file to preserve your work
* Current file content and name are stored in local storage for session persistence
* The application provides a seamless experience for users who frequently work with Markdown files

## 🌐 Browser Compatibility

The application works best in modern browsers that support ES6+ JavaScript and the File System Access API:

* Chrome 86+
* Edge 86+
* Firefox 82+
* Safari 15.4+
* Opera 72+

Note: Some features may be limited in browsers without File System Access API support.

## 👥 Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

Please ensure your code adheres to the existing style and includes appropriate comments.

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Marsel Nenaj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Attribution

* **Prompted by:** Marsel Nenaj
* **Coded by:**  Gemini 2.5 Pro & Claude 3.7
* **GitHub Repository:** [modern-markdown-editor-html5](https://github.com/marselnenaj/modern-markdown-editor-html5)