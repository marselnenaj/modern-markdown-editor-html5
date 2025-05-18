// DOM Element References: References to various HTML elements by their IDs
        const folderInput = document.getElementById('folderInput'); // Hidden input for folder selection
        const singleFileInput = document.getElementById('singleFileInput'); // Hidden input for single file selection
        const folderInputButton = document.getElementById('folderInputButton'); // Button to trigger folder selection
        const singleFileInputButton = document.getElementById('singleFileInputButton'); // Button to trigger single file selection
        const fileList = document.getElementById('fileList'); // UL element to display the file list
        const markdownOutput = document.getElementById('markdown-output'); // Div to display rendered markdown or placeholder
        const contentHeaderText = document.getElementById('contentHeaderText'); // Div to display the current file name in the header
        const selectedFolderNameDiv = document.getElementById('selectedFolderName'); // Div to display the name of the selected folder
        const fileBrowserHeader = document.getElementById('fileBrowserHeader'); // Header for the file browser area
        const mobileMenuButton = document.getElementById('mobileMenuButton'); // Button to toggle the sidebar on mobile devices
        const sidebar = document.getElementById('sidebar'); // The sidebar element
        const editButton = document.getElementById('editButton'); // Button to toggle between edit and save mode
        const downloadButton = document.getElementById('downloadButton'); // Button to download the modified content
        const clearButton = document.getElementById('clearButton'); // Button to clear/unload the current file
        const wysiwygEditorContainer = document.getElementById('wysiwyg-editor-container'); // Container for the Toast UI WYSIWYG editor
        let tuiEditor = null; // Variable to hold the Toast UI Editor instance
        
        // State Variables: Manage the current state of the application
        let currentFiles = []; // Array to store currently loaded files (either from a folder or a single file)
        let currentFolderHandle = null; // File System API folder handle (not used in this version, but good for the future)
        let currentFileHandle = null; // File System API file handle (not used in this version)
        let currentFolderPath = ''; // Path or name of the currently selected folder
        
        let isEditMode = false; // Boolean flag indicating if the application is in edit mode
        let currentFileRawContent = ''; // Stores the raw text content of the currently displayed file
        let originalFileContent = ''; // Stores the original unchanged content to detect changes
        let currentFileName = ''; // Stores the name of the currently edited/displayed file
        let contentWasChanged = false; // Speichert, ob der Inhalt seit dem letzten Laden geändert wurde

        // Event Listener for Mobile Menu Button: Toggles sidebar visibility on mobile devices
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false;
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            sidebar.classList.toggle('mobile-visible'); // Einfaches Umschalten der Sichtbarkeit
            
            // Zusätzliche Behandlung für geladene Inhalte
            if (currentFileRawContent) {
                // Wenn Inhalt geladen ist und das Menü geöffnet wird, scrolle zum Anfang des Inhalts
                if (!isExpanded) {
                    setTimeout(() => {
                        window.scrollTo({top: 0, behavior: 'smooth'});
                    }, 300);
                }
            }
        });

        // Event Listeners for File/Folder Selection Buttons: Trigger click on hidden file input elements
        folderInputButton.addEventListener('click', () => folderInput.click()); // Opens folder selection dialog
        singleFileInputButton.addEventListener('click', () => singleFileInput.click()); // Opens file selection dialog

        // Event Listener for Folder Input: Handles folder selection
        folderInput.addEventListener('change', async (event) => {
            const files = event.target.files; // Get list of files from the selected folder
            if (files.length > 0) {
                // Filter for Markdown and text files
                currentFiles = Array.from(files).filter(file => file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'));
                currentFolderHandle = null; // Reset folder handle (not directly used with <input type="file"> for handle)
                currentFileHandle = null; // Reset file handle
                const firstFile = files[0]; // Get first file to determine folder path
                // Try to get a folder name from webkitRelativePath, otherwise use a generic name
                currentFolderPath = firstFile.webkitRelativePath ? firstFile.webkitRelativePath.split('/')[0] : 'Selected Folder';
                
                // Update UI to display selected folder name and file browser
                selectedFolderNameDiv.textContent = currentFolderPath;
                selectedFolderNameDiv.style.display = 'block';
                fileBrowserHeader.style.display = 'block';
                renderFileList(); // Create file list in the sidebar

                // Try to display the first found Markdown file, otherwise show a message
                if (currentFiles.length > 0) {
                    const firstMdFile = currentFiles.find(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
                    if (firstMdFile) {
                        await displayFileContent(firstMdFile, firstMdFile.name); // Display its content
                    } else {
                        handleNoFileSelected("No Markdown file found in the folder."); // No Markdown files
                    }
                } else {
                    handleNoFileSelected("No displayable files found in the folder."); // No suitable files at all
                }
            }
        });

        // Event Listener for Single File Input: Handles single file selection
        singleFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0]; // Get selected file
            if (file) {
                currentFiles = [file]; // Store file in currentFiles array
                currentFolderHandle = null; // Reset folder handle
                currentFileHandle = null; // Reset file handle
                currentFolderPath = ''; // No folder path for single file
                selectedFolderNameDiv.style.display = 'none'; // Hide folder name display
                fileBrowserHeader.style.display = 'block'; // Show file browser header (for the single file)
                renderFileList(); // Display single file in the list
                await displayFileContent(file, file.name); // Display its content
                    }
        });

        // Function to Render File List: Populates the sidebar with names of loaded files
        function renderFileList() {
            fileList.innerHTML = ''; // Clears existing file list items
            currentFiles.forEach(file => { // Iterates through current files
                const li = document.createElement('li'); // Creates a new list item element
                li.textContent = file.name; // Sets the text to the file name
                // Adds event listener to display file content when a file name is clicked
                li.addEventListener('click', async () => { 
                    await displayFileContent(file, file.name); // Displays content
                    highlightSelectedFile(file.name); // Highlights the clicked file in the list
                    // If on mobile and sidebar is visible, hide it after selection
                    if (sidebar.classList.contains('mobile-visible')) {
                        sidebar.classList.remove('mobile-visible');
                        mobileMenuButton.setAttribute('aria-expanded', 'false');
                    }
                });
                fileList.appendChild(li); // Adds the list item to the file list
            });
        }        // Function to Display File Content: Reads and displays the content of a selected file
        async function displayFileContent(fileOrHandle, fileName) {
            try {
                let file;
                // Checks if it's a FileSystemFileHandle (not used in current input method, but good for the future) or a standard File object
                if (fileOrHandle.getFile) {  // This would be for File System Access API handles
                    file = await fileOrHandle.getFile();
                } else { // This is for standard File objects from <input type="file">
                    file = fileOrHandle;
                }
                const reader = new FileReader(); // Creates a FileReader to read the file content
                
                // Defines what happens when the file is successfully loaded
                reader.onload = (e) => {
                    // Normalisiere Zeilenumbrüche im gelesenen Inhalt
                    const content = e.target.result.replace(/\r\n/g, '\n');
                    
                    currentFileRawContent = content; // Stores the raw file content
                    originalFileContent = content; // Stores original content for comparison
                    currentFileName = fileName; // Stores the current file name
                    contentHeaderText.textContent = fileName; // Updates the header with the file name
                    editButton.style.display = 'inline-block'; // Shows the Edit button
                    editButton.disabled = false; // Enables the Edit button
                    
                    // Reset contentWasChanged when loading a new file
                    contentWasChanged = false;
                    downloadButton.style.display = 'none'; // Hides the Download button initially
                    
                    clearButton.style.display = 'inline-block'; // Shows the Clear button
                    
                    // Aktuellen Zustand im localStorage speichern
                    saveStateToLocalStorage();

                    if (isEditMode) {
                        // If in edit mode, updates the content of the TUI editor
                        if (tuiEditor) tuiEditor.setMarkdown(currentFileRawContent);
                        // Fallback: If TUI editor is not initialized (should not happen if logic is correct)
                        else initializeTuiEditor(currentFileRawContent); 
                    } else {
                        // If in view mode, renders Markdown and destroys TUI editor if present
                        markdownOutput.innerHTML = marked.parse(currentFileRawContent); // Parses Markdown to HTML
                        markdownOutput.style.display = 'block'; // Shows Markdown output area
                        wysiwygEditorContainer.style.display = 'none'; // Hides WYSIWYG editor
                        if (tuiEditor) { tuiEditor.destroy(); tuiEditor = null; } // Cleans up TUI editor instance
                    }
                    markdownOutput.classList.remove('placeholder'); // Removes placeholder class when content is loaded
                    
                    // Wenn wir auf Mobilgeräten sind, sicherstellen, dass das Menü geschlossen wird und der Inhalt richtig angezeigt wird
                    if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-visible')) {
                        sidebar.classList.remove('mobile-visible');
                        mobileMenuButton.setAttribute('aria-expanded', 'false');
                    }
                };
                // Defines what happens if an error occurs while reading the file
                reader.onerror = () => displayErrorLoadingFile(fileName);
                reader.readAsText(file); // Starts reading the file as text
            } catch (error) {
                console.error('Error accessing file:', error); // Logs error to the console
                displayErrorLoadingFile(fileName); // Shows error message in the UI
            }
        }
        
        // Function to Initialize Toast UI Editor: Creates or recreates the WYSIWYG editor
        function initializeTuiEditor(content) {
            if (tuiEditor) { tuiEditor.destroy(); tuiEditor = null; } // Destroys existing instance if present
            
            // Determines the correct editor height based on the device
            const isMobile = window.innerWidth <= 768;
            const editorHeight = isMobile ? '300px' : '100%';
            
            // Creates a new Toast UI Editor instance
            tuiEditor = new toastui.Editor({
                el: wysiwygEditorContainer, // The HTML element hosting the editor
                initialValue: content, // The initial content for the editor
                previewStyle: 'tab', // Uses TUI's own preview/mode switching (though we manage modes externally)
                height: editorHeight, // Lets the editor take the full height of its container or fixed height on mobile
                initialEditType: 'wysiwyg', // Starts in WYSIWYG mode by default
                usageStatistics: false, // Disables Toast UI's usage statistics tracking
                toolbarItems: [
                    // Simplified toolbar for better mobile display
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote', 'ul', 'ol'],
                    ['link', 'image', 'code', 'codeblock']
                ],
                events: {
                    // Listens to editor focus to ensure proper rendering on mobile
                    focus: () => {
                        // Slight delay to ensure DOM is ready
                        setTimeout(() => {
                            const editorEl = document.querySelector('.toastui-editor-ww-container');
                            if (editorEl) {
                                editorEl.style.minHeight = isMobile ? '200px' : '100px';
                            }
                        }, 100);
                    },
                    // Adds change event to track modifications
                    change: () => {
                        // Wenn Editor Inhalt geändert wurde
                        if (tuiEditor) {
                            const currentContent = tuiEditor.getMarkdown();
                            
                            // Prüfen, ob der Inhalt wirklich geändert wurde (normalisiert Zeilenumbrüche)
                            const normalizedOriginal = originalFileContent.replace(/\r\n/g, '\n');
                            const normalizedNew = currentContent.replace(/\r\n/g, '\n');
                            
                            // Prüft, ob es eine echte Änderung gibt
                            contentWasChanged = normalizedNew !== normalizedOriginal && 
                                              normalizedNew.trim() !== normalizedOriginal.trim();
                        }
                    }
                }
            });
            
            // Additional step to ensure the editor renders correctly on mobile
            if (isMobile) {
                // Forces a layout recalculation
                setTimeout(() => {
                    if (tuiEditor) {
                        tuiEditor.focus();
                    }
                }, 300);
            }
        }        // Function to Handle No File Selected: Updates UI when no file is active
        function handleNoFileSelected(message) {
            displayPlaceholder(message); // Displays the provided message as a placeholder
            contentHeaderText.textContent = "No file selected"; // Resets header text
            editButton.style.display = 'none'; // Hides Edit button
            downloadButton.style.display = 'none'; // Hides Download button
            clearButton.style.display = 'none'; // Hides Clear button
            currentFileName = ''; // Clears current file name
            originalFileContent = ''; // Clears original content
            contentWasChanged = false; // Reset change tracking
            
            // Den gespeicherten Zustand nicht löschen, wenn nur keine Datei in einem geladenen Ordner ausgewählt ist
            // Nur löschen, wenn wirklich alles zurückgesetzt werden soll (wird in clearCurrentFile() aufgerufen)
            
            if (isEditMode) {
                isEditMode = false; // Resets edit mode without saving
                if (tuiEditor) {
                    tuiEditor.destroy(); // Cleans up editor
                    tuiEditor = null;
                }
                markdownOutput.style.display = 'block'; // Shows Markdown area
                wysiwygEditorContainer.style.display = 'none'; // Hides editor
            }
        }

        // Function to Display Error Loading File: Shows an error message in the UI
        function displayErrorLoadingFile(fileName) {
            markdownOutput.innerHTML = `<div class="placeholder">Error loading file: ${fileName}.</div>`; // Displays error
            markdownOutput.classList.add('placeholder'); // Adds placeholder class for styling
            contentHeaderText.textContent = "Error"; // Updates header text
            currentFileRawContent = ''; // Clears raw content
            originalFileContent = ''; // Clears original content
            currentFileName = ''; // Clears file name
            contentWasChanged = false; // Reset change tracking
            editButton.style.display = 'none'; // Hides Edit button
            downloadButton.style.display = 'none'; // Hides Download button
            if (isEditMode) {
                isEditMode = false; // Resets edit mode without saving
                if (tuiEditor) {
                    tuiEditor.destroy(); // Cleans up editor
                    tuiEditor = null;
                }
                markdownOutput.style.display = 'block'; // Shows Markdown area
                wysiwygEditorContainer.style.display = 'none'; // Hides editor
            }
        }
          // Function to Display Placeholder: Shows a message in the main content area
        function displayPlaceholder(message) {
            markdownOutput.innerHTML = message; // Sets the message
            markdownOutput.classList.add('placeholder'); // Adds placeholder class
            currentFileRawContent = ''; // Clears raw content
            originalFileContent = ''; // Clears original content
            currentFileName = ''; // Clears file name
            contentWasChanged = false; // Reset change tracking
            editButton.style.display = 'none'; // Hides Edit button
            downloadButton.style.display = 'none'; // Hides Download button
            
            // Überprüfen, ob wir uns in einer mobilen Ansicht befinden und kein Inhalt vorhanden ist
            checkAndShowMobileMenu();
            
            if (isEditMode) {
                isEditMode = false; // Resets edit mode
                editButton.textContent = 'Edit';
                
                // Cleans up TUI editor if present
                if (tuiEditor) {
                    tuiEditor.destroy();
                    tuiEditor = null;
                }
                
                markdownOutput.style.display = 'block';
                wysiwygEditorContainer.style.display = 'none';
                wysiwygEditorContainer.innerHTML = '';
            }
        }

        // Function to Highlight Selected File: Visually marks the active file in the sidebar list
        function highlightSelectedFile(fileName) {
            const items = fileList.querySelectorAll('li'); // Gets all file list items
            items.forEach(item => {
                // Adds 'selected' class if the item's text matches fileName, otherwise removes it
                item.classList.toggle('selected', item.textContent === fileName);
            });
        }        // Funktionen zum Speichern und Wiederherstellen des Anwendungszustands
        function saveStateToLocalStorage() {
            // Speichern der Dateiinformationen
            if (currentFileName && currentFileRawContent) {
                const stateToSave = {
                    fileName: currentFileName,
                    content: currentFileRawContent,
                    timestamp: new Date().getTime(),
                    // Speichern der Ordnerinformationen, falls vorhanden
                    folderPath: currentFolderPath || '',
                    // Speichern der Dateiliste, wenn ein Ordner geladen wurde
                    files: currentFiles.length > 1 ? currentFiles.map(file => ({
                        name: file.name,
                        // Nur die wichtigsten Informationen speichern
                        path: file.webkitRelativePath || ''
                    })) : []
                };
                localStorage.setItem('markdownViewerState', JSON.stringify(stateToSave));
            }
        }        function loadStateFromLocalStorage() {
            const savedState = localStorage.getItem('markdownViewerState');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    // Prüfen ob der gespeicherte Zustand nicht älter als 7 Tage ist
                    const now = new Date().getTime();
                    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
                    
                    if (state.fileName && state.content && (now - state.timestamp < sevenDays)) {
                        // Normalisiere Zeilenumbrüche im gespeicherten Inhalt
                        const normalizedContent = state.content.replace(/\r\n/g, '\n');
                        
                        currentFileName = state.fileName;
                        currentFileRawContent = normalizedContent;
                        originalFileContent = normalizedContent;
                        contentWasChanged = false; // Zustand wurde gerade geladen, keine Änderungen
                        
                        // Ordnerinformationen wiederherstellen, falls vorhanden
                        if (state.folderPath) {
                            currentFolderPath = state.folderPath;
                            selectedFolderNameDiv.textContent = currentFolderPath;
                            selectedFolderNameDiv.style.display = 'block';
                        } else {
                            selectedFolderNameDiv.style.display = 'none';
                        }
                        
                        // UI aktualisieren
                        contentHeaderText.textContent = currentFileName;
                        markdownOutput.innerHTML = marked.parse(currentFileRawContent);
                        markdownOutput.classList.remove('placeholder');
                        markdownOutput.style.display = 'block';
                        
                        // Buttons aktivieren
                        editButton.style.display = 'inline-block';
                        editButton.disabled = false;
                        clearButton.style.display = 'inline-block';
                        
                        // Dateibrowser und Dateiliste wiederherstellen
                        fileBrowserHeader.style.display = 'block';
                        
                        // Wenn gespeicherte Dateien aus einem Ordner vorhanden sind
                        if (state.files && state.files.length > 0) {
                            // Initialisierung der Click-Handler für Dateiliste
                            // Wir erstellen ein Array mit File-ähnlichen Objekten, die für die Anzeige verwendet werden
                            currentFiles = state.files.map(fileInfo => {
                                // Wir erstellen ein erweitertes File-ähnliches Objekt mit zusätzlichen Eigenschaften
                                return {
                                    name: fileInfo.name,
                                    webkitRelativePath: fileInfo.path || '',
                                    // Hilfsmethode, die beim Klick auf den Dateinamen aufgerufen wird
                                    cachedContent: fileInfo.name === currentFileName ? currentFileRawContent : null,
                                    // Wir emulieren die getFile-Methode für File-Handle Kompatibilität
                                    getFile: function() {
                                        // Wenn es sich um die aktuell geladene Datei handelt, kennen wir den Inhalt
                                        if (this.name === currentFileName) {
                                            return Promise.resolve(new Blob([currentFileRawContent], { type: 'text/markdown' }));
                                        }
                                        
                                        // Bei anderen Dateien zeigen wir eine Nachricht an, dass der Inhalt nicht verfügbar ist
                                        // und der Benutzer die Datei erneut laden muss
                                        return Promise.resolve(new Blob([
                                            "# Dateiinhalt nicht verfügbar\n\n" +
                                            "Der Inhalt dieser Datei wurde nicht im Browserspeicher gesichert.\n\n" +
                                            "Bitte laden Sie den Ordner erneut über den 'Ordner öffnen' Button, " + 
                                            "um auf alle Dateien im Ordner zugreifen zu können."
                                        ], { type: 'text/markdown' }));
                                    }
                                };
                            });
                        } else {
                            // Einzelne Datei wiederherstellen
                            currentFiles = [{
                                name: currentFileName,
                                cachedContent: currentFileRawContent,
                                // Ein minimales File-Objekt erstellen
                                getFile: function() {
                                    return Promise.resolve(new Blob([currentFileRawContent], { type: 'text/markdown' }));
                                }
                            }];
                        }
                        
                        renderFileList();
                        highlightSelectedFile(currentFileName);
                        
                        return true; // Erfolgreich geladen
                    }
                } catch (error) {
                    console.error('Error loading state from localStorage:', error);
                    // Bei Fehler den localStorage-Eintrag löschen
                    localStorage.removeItem('markdownViewerState');
                }
            }
            return false; // Nichts geladen
        }

        // Event Listener for Edit/Save Button: Toggles between view and edit mode
        editButton.addEventListener('click', () => {
            if (isEditMode) { // If currently in edit mode (button shows "Save")
                saveAndSwitchToViewMode(); // Saves content and switches to view mode
            } else { // If currently in view mode (button shows "Edit")                // Checks if there is content to edit
                if (!currentFileRawContent && currentFiles.length === 0 && !currentFileHandle) { 
                     alert("Please load a file first to edit it."); // Shows warning if no file is loaded
                     return;
                }
                switchToEditMode(); // Switches to edit mode
            }
        });
        
        // Function to Switch to Edit Mode: Configures UI for editing
        function switchToEditMode() {
            isEditMode = true; // Sets edit mode flag
            editButton.textContent = 'Save'; // Changes button text to "Save"
            markdownOutput.style.display = 'none'; // Hides the rendered Markdown output
            downloadButton.style.display = 'none'; // Hides Download button during editing

            // Initializes or updates the Toast UI Editor with the current file content
            initializeTuiEditor(currentFileRawContent);
            wysiwygEditorContainer.style.display = 'flex'; // Makes it flex to help with mobile layout
            
            // Gives the editor a moment to initialize and then focuses it
            setTimeout(() => {
                if (tuiEditor) {
                    tuiEditor.focus();
                }
            }, 200);
        }        // Function to Save Content and Switch to View Mode: Saves changes and returns to viewing
        function saveAndSwitchToViewMode() {
            let newContent = '';
            
            if (tuiEditor) { // If the TUI editor instance exists
                newContent = tuiEditor.getMarkdown(); // Gets the Markdown content from the editor
                tuiEditor.destroy(); // Destroys the editor instance properly
                tuiEditor = null; // Resets the editor variable
            }
            
            // Finale Prüfung, ob der Inhalt wirklich geändert wurde (normalisiert Zeilenumbrüche)
            const normalizedOriginal = originalFileContent.replace(/\r\n/g, '\n');
            const normalizedNew = newContent.replace(/\r\n/g, '\n');
            const contentChanged = normalizedNew !== normalizedOriginal && normalizedNew.trim() !== normalizedOriginal.trim();
            
            // Nur aktualisieren, wenn Änderungen vorgenommen wurden
            if (contentChanged) {
                currentFileRawContent = newContent;
                contentWasChanged = true; // Markieren, dass Änderungen vorgenommen wurden
            }
            
            // Displays the (potentially updated) content as rendered Markdown
            markdownOutput.innerHTML = marked.parse(currentFileRawContent);
            markdownOutput.style.display = 'block'; // Shows Markdown output
            wysiwygEditorContainer.style.display = 'none'; // Hides WYSIWYG editor
            wysiwygEditorContainer.innerHTML = ''; // Clears the editor container

            editButton.textContent = 'Edit'; // Changes button text back to "Edit"
            isEditMode = false; // Resets edit mode flag
            
            // Wenn Inhalt geändert wurde und ein gültiger Dateiname existiert
            if (contentChanged && currentFileName) {
                // Speichert den Zustand
                saveStateToLocalStorage();
                
                // Automatischer Download der geänderten Datei nur, wenn es Änderungen gab
                downloadModifiedFile(); // Automatically trigger download
                
                // Zeigt den Download-Button für weitere Downloads an
                downloadButton.style.display = 'inline-block';
            } else if (contentWasChanged && currentFileName) {
                // Wenn der Inhalt bereits zuvor geändert wurde (aber nicht in diesem Speichervorgang),
                // zeige trotzdem den Download-Button an
                downloadButton.style.display = 'inline-block';
            } else {
                // Keine Änderungen, Download-Button verstecken
                downloadButton.style.display = 'none';
            }
            
            // Determines if the Edit button should still be visible and enabled
            if (currentFileRawContent || currentFiles.length > 0 || currentFileHandle) { 
                 editButton.style.display = 'inline-block';
                 editButton.disabled = false;
            } else {
                 editButton.style.display = 'none';
            }
        }
        
        // Function to Handle File Download: Creates and triggers download of modified content
        function downloadModifiedFile() {
            if (!currentFileName || !contentWasChanged) return; // Nur wenn ein Dateiname existiert und Änderungen vorliegen
            
            // Creates a Blob with the current file content
            const blob = new Blob([currentFileRawContent], { type: 'text/markdown' });
            
            // Creates a temporary URL for the Blob
            const url = URL.createObjectURL(blob);
            
            // Creates a temporary anchor element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName; // Uses the current file name
            document.body.appendChild(a);
            a.click(); // Triggers the download
            
            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Toast-Benachrichtigung anzeigen
            showToast(`Datei "${currentFileName}" wurde heruntergeladen.`, 'success');
        }
        
        // Event Listener for Download Button
        downloadButton.addEventListener('click', downloadModifiedFile);
        
        // Toast-Benachrichtigungsfunktion
        function showToast(message, type = 'info') {
            const toastContainer = document.querySelector('.toast-container') || createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            toastContainer.appendChild(toast);
            
            // Toast nach 3 Sekunden entfernen
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }
        
        // Toast-Container erstellen, falls er noch nicht existiert
        function createToastContainer() {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        }

        // Function to Clear Current File: Unloads the current file and resets the UI
        function clearCurrentFile() {
            // Bestätigungsdialog anzeigen
            if (currentFileName && confirm(`Möchten Sie wirklich "${currentFileName}" entladen?`)) {
                // Lokalen Speicher löschen
                localStorage.removeItem('markdownViewerState');
                
                // UI zurücksetzen
                displayPlaceholder("Select a folder or a file.");
                contentHeaderText.textContent = "No file selected";
                
                // Buttons ausblenden
                editButton.style.display = 'none';
                downloadButton.style.display = 'none';
                clearButton.style.display = 'none';
                
                // Zustandsvariablen zurücksetzen
                currentFileName = '';
                currentFileRawContent = '';
                originalFileContent = '';
                contentWasChanged = false;
                currentFiles = [];
                currentFolderPath = '';
                
                // Dateibrowser zurücksetzen
                fileList.innerHTML = '';
                fileBrowserHeader.style.display = 'none';
                selectedFolderNameDiv.style.display = 'none';
                selectedFolderNameDiv.textContent = '';
                
                // Editor zurücksetzen wenn aktiv
                if (isEditMode) {
                    isEditMode = false;
                    editButton.textContent = 'Edit';
                    if (tuiEditor) {
                        tuiEditor.destroy();
                        tuiEditor = null;
                    }
                    markdownOutput.style.display = 'block';
                    wysiwygEditorContainer.style.display = 'none';
                    wysiwygEditorContainer.innerHTML = '';
                }
            }
        }
          // Event Listener for Clear Button
        clearButton.addEventListener('click', clearCurrentFile);
        
        // Hilfsfunktion zur Überprüfung und Anzeige des mobilen Menüs
        function checkAndShowMobileMenu() {
            const isMobileView = window.innerWidth <= 768;
            
            // Automatisches Anzeigen des Menüs nur, wenn kein Inhalt geladen ist
            if (isMobileView && !currentFileRawContent) {
                sidebar.classList.add('mobile-visible');
                mobileMenuButton.setAttribute('aria-expanded', 'true');
            }
        }
        
        // Überprüfung bei Änderung der Fenstergröße
        window.addEventListener('resize', () => {
            checkAndShowMobileMenu();
        });

        // Initial Application State Setup
        // Versuche zuerst, den gespeicherten Zustand zu laden
        if (!loadStateFromLocalStorage()) {
            // Wenn kein gespeicherter Zustand vorhanden ist, zeige den Standardplatzhalter an
            displayPlaceholder("Select a folder or a file."); // Displays initial placeholder message
            editButton.style.display = 'none'; // Hides the Edit button initially
            downloadButton.style.display = 'none'; // Hides the Download button initially
            
            // Sicherstellen, dass der Text in der mobilen Ansicht nach dem Laden korrekt positioniert ist
            setTimeout(() => {
                // Überprüfen und anzeigen des mobilen Menüs, wenn nötig
                checkAndShowMobileMenu();
            }, 100);
        }