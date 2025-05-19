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
        let userMadeChangesInEditor = false; // Tracks if the user has made changes in the editor
        
        // Event Listener for Mobile Menu Button: Toggles sidebar visibility on mobile devices
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false;
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            sidebar.classList.toggle('mobile-visible'); // Einfaches Umschalten der Sichtbarkeit
            
            // Get sidebar height to adjust content area
            setTimeout(() => {
                if (sidebar.classList.contains('mobile-visible')) {
                    // If the sidebar is now visible, adjust content area position
                    const sidebarHeight = sidebar.getBoundingClientRect().height;
                      // Always use the exact sidebar height for better responsive layout
                    document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                } else {
                    // If sidebar is hidden, reset margin
                    document.querySelector('.content-area').style.marginTop = '0';
                }
                
                // Smooth scroll to top when menu opens with content
                if (currentFileRawContent && !isExpanded) {
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }
            }, 10); // Small timeout to ensure the sidebar toggle has applied
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
                
                // Show mobile menu when folder is loaded in mobile view
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('mobile-visible');
                    mobileMenuButton.setAttribute('aria-expanded', 'true');
                    
                    // Adjust content area margin based on sidebar height
                    setTimeout(() => {
                        const sidebarHeight = sidebar.getBoundingClientRect().height;
                        document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                    }, 10);
                }

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
                currentFolderPath = ''; // No folder path for single file                selectedFolderNameDiv.style.display = 'none'; // Hide folder name display
                fileBrowserHeader.style.display = 'block'; // Show file browser header (for the single file)
                renderFileList(); // Display single file in the list
                
                // Show mobile menu when a file is loaded in mobile view
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('mobile-visible');
                    mobileMenuButton.setAttribute('aria-expanded', 'true');
                    
                    // Adjust content area margin based on sidebar height
                    setTimeout(() => {
                        const sidebarHeight = sidebar.getBoundingClientRect().height;
                        document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                    }, 10);
                }
                
                await displayFileContent(file, file.name); // Display its content
                    }
        });        // Function to Render File List: Populates the sidebar with names of loaded files
        function renderFileList() {
            fileList.innerHTML = ''; // Clears existing file list items
            currentFiles.forEach(file => { // Iterates through current files
                const li = document.createElement('li'); // Creates a new list item element
                li.textContent = file.name; // Sets the text to the file name
                
                // Markiere Dateien, die im Cache verfügbar sind
                if (file.cachedContent) {
                    li.classList.add('cached'); // Füge Klasse für im Browser gespeicherte Dateien hinzu
                }
                  // Adds event listener to display file content when a file name is clicked
                li.addEventListener('click', async () => { 
                    await displayFileContent(file, file.name); // Displays content
                    highlightSelectedFile(file.name); // Highlights the clicked file in the list
                    
                    // Auf Mobilgeräten die Sidebar geöffnet lassen und den Inhalt darunter anpassen
                    if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-visible')) {
                        // Statt die Sidebar zu schließen, passen wir den Inhalt an ihre Höhe an
                        setTimeout(() => {
                            const sidebarHeight = sidebar.getBoundingClientRect().height;
                            document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                        }, 10);
                    }
                });
                fileList.appendChild(li); // Adds the list item to the file list
            });
        }        // Function to Display File Content: Reads and displays the content of a selected file
        async function displayFileContent(fileOrHandle, fileName) {
            try {
                // Prüfen, ob wir den Inhalt bereits im Objekt haben (für gecachte Dateien)
                if (fileOrHandle.cachedContent) {
                    // Direkt den gecachten Inhalt verwenden
                    const content = fileOrHandle.cachedContent.replace(/\r\n/g, '\n');
                    
                    // Update the file object with normalized content
                    fileOrHandle.cachedContent = content;
                    
                    updateUIWithFileContent(content, fileName);
                    return;
                }
                
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
                    
                    // Always save content in the cachedContent attribute
                    fileOrHandle.cachedContent = content;
                    
                    // Update localStorage whenever we load a new file
                    updateUIWithFileContent(content, fileName);
                    
                    // After loading, save to localStorage to ensure it's cached
                    saveStateToLocalStorage(true);
                };
                // Defines what happens if an error occurs while reading the file
                reader.onerror = () => displayErrorLoadingFile(fileName);
                reader.readAsText(file); // Starts reading the file as text
            } catch (error) {
                console.error('Error accessing file:', error); // Logs error to the console
                displayErrorLoadingFile(fileName); // Shows error message in the UI
            }
        }// Hilfsfunktion, die die UI mit dem Dateiinhalt aktualisiert
        function updateUIWithFileContent(content, fileName) {
            // Prüfen, ob wir eine neue Datei laden oder eine andere als zuvor
            const isNewFile = currentFileName !== fileName;
            
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
            
            // Aktuellen Zustand nur speichern, wenn wir eine neue Datei laden (nicht bei Wechsel zwischen Files)
            // oder wenn der Zustand noch nie gespeichert wurde
            if (isNewFile && !localStorage.getItem('markdownViewerState')) {
                saveStateToLocalStorage(true); // Silent-Modus - keine Toast-Nachricht
            }            // Always update the cached content in the current file object
            if (currentFiles && currentFiles.length > 0) {
                const currentFileObj = currentFiles.find(file => file.name === fileName);
                if (currentFileObj) {
                    currentFileObj.cachedContent = content;
                }
            }

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
              
            // Wenn wir auf Mobilgeräten sind, sicherstellen, dass das Menü geöffnet bleibt und der Inhalt richtig angezeigt wird
            if (window.innerWidth <= 768) {
                // Keep the sidebar visible on mobile and adjust content margin
                sidebar.classList.add('mobile-visible');
                mobileMenuButton.setAttribute('aria-expanded', 'true');
                
                // Adjust content area margin based on sidebar height
                setTimeout(() => {
                    const sidebarHeight = sidebar.getBoundingClientRect().height;
                    document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                }, 10);
            }
        }
        
        // Function to Initialize Toast UI Editor: Creates or recreates the WYSIWYG editor
        function initializeTuiEditor(content) {
            if (tuiEditor) { tuiEditor.destroy(); tuiEditor = null; } // Destroys existing instance if present
            userMadeChangesInEditor = false; // Reset flag when editor is initialized
            
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
                            userMadeChangesInEditor = true; // Set flag when user makes a change
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
        function saveStateToLocalStorage(silent = false) {
            // Speichern der Dateiinformationen
            if (currentFileName && currentFileRawContent) {
                // Erstelle ein Objekt für alle Dateiinhalte
                const fileContents = {};
                
                // Speichere die aktuelle Datei
                fileContents[currentFileName] = currentFileRawContent;
                
                // Überprüfe, ob andere Dateien bereits im localStorage gespeichert sind
                try {
                    const existingState = JSON.parse(localStorage.getItem('markdownViewerState'));
                    if (existingState && existingState.fileContents) {
                        // Übernehme bestehende Dateiinhalte und überschreibe die aktuelle Datei
                        Object.assign(fileContents, existingState.fileContents, fileContents);
                    }
                } catch (error) {
                    console.error('Error reading existing state:', error);
                }
                
                // Update the file objects with cached content to ensure consistency
                if (currentFiles.length > 0) {
                    // First update the current file objects with cached content 
                    currentFiles.forEach(file => {
                        const fileName = file.name;
                        if (fileContents[fileName] && !file.cachedContent) {
                            file.cachedContent = fileContents[fileName];
                        }
                    });
                    
                    // Then save all files including those that were not yet cached
                    const readPromises = currentFiles.map(file => {
                        // Skip the current file, it's already saved
                        if (file.name === currentFileName) return Promise.resolve();
                        
                        return new Promise(resolve => {
                            // If the file already has cachedContent, use that directly
                            if (file.cachedContent) {
                                fileContents[file.name] = file.cachedContent;
                                resolve();
                                return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = e => {
                                // Normalisiere Zeilenumbrüche und speichere im fileContents-Objekt
                                const content = e.target.result.replace(/\r\n/g, '\n');
                                fileContents[file.name] = content;
                                // Also update the file object's cachedContent property
                                file.cachedContent = content;
                                resolve();
                            };
                            reader.onerror = () => resolve(); // Bei Fehler überspringen
                            
                            // Wenn es sich um ein File-Objekt handelt
                            if (file instanceof File) {
                                reader.readAsText(file);
                            } else if (file.getFile) {
                                // Wenn es ein FileSystemFileHandle ist
                                file.getFile().then(f => reader.readAsText(f)).catch(() => resolve());
                            } else {
                                resolve();
                            }
                        });
                    });
                    
                    // Alle Dateien lesen und dann den State speichern
                    Promise.all(readPromises).then(() => {
                        // Überprüfe die Größe des zu speichernden Objekts
                        const stateString = JSON.stringify({
                            fileName: currentFileName,
                            timestamp: new Date().getTime(),
                            folderPath: currentFolderPath || '',
                            fileContents: fileContents,
                            files: currentFiles.map(file => ({
                                name: file.name,
                                path: file.webkitRelativePath || ''
                            }))
                        });
                          // Überprüfe die Größe (localStorage hat typischerweise ~5MB Limit)
                        if (stateString.length < 4 * 1024 * 1024) { // 4MB Sicherheitsgrenze
                            localStorage.setItem('markdownViewerState', stateString);
                            if (!silent) showToast('Cache updated.', 'success');
                            
                            // Update cached indicator in the file list after saving
                            updateFileListCacheIndicators(fileContents);
                        } else {
                            // Nur die aktuelle Datei speichern, wenn alles zu groß ist
                            const reducedState = {
                                fileName: currentFileName,
                                timestamp: new Date().getTime(),
                                folderPath: currentFolderPath || '',
                                fileContents: { [currentFileName]: currentFileRawContent },
                                files: currentFiles.map(file => ({
                                    name: file.name,
                                    path: file.webkitRelativePath || ''
                                }))
                            };
                            localStorage.setItem('markdownViewerState', JSON.stringify(reducedState));
                            if (!silent) showToast('Only the current file was saved. The folder contains too many/large files.', 'info');

                            // Update cached indicator for the current file only
                            updateFileListCacheIndicators({ [currentFileName]: currentFileRawContent });
                        }
                    });
                } else {
                    // Save individual file directly
                    const stateToSave = {
                        fileName: currentFileName,
                        timestamp: new Date().getTime(),
                        folderPath: currentFolderPath || '',
                        fileContents: fileContents,
                        files: currentFiles.map(file => ({
                            name: file.name,
                            path: file.webkitRelativePath || ''
                        }))
                    };                    
                    localStorage.setItem('markdownViewerState', JSON.stringify(stateToSave));
                    if (!silent) showToast('File saved to browser cache.', 'success');

                    // Update cached indicator in the file list
                    updateFileListCacheIndicators(fileContents);
                }
            }
        }
        
        // Hilfsfunktion zur Gewährleistung der Cache-Konsistenz
        function updateCacheAndLocalStorage(fileName, content, silent = true) {
            // Update the file object's cached content
            if (currentFiles && currentFiles.length > 0) {
                const fileObj = currentFiles.find(file => file.name === fileName);
                if (fileObj) {
                    fileObj.cachedContent = content;
                }
            }
            
            // Save to localStorage
            if (fileName && content) {
                // Get existing state if available
                let fileContents = {};
                try {
                    const existingState = JSON.parse(localStorage.getItem('markdownViewerState'));
                    if (existingState && existingState.fileContents) {
                        fileContents = existingState.fileContents;
                    }
                } catch (error) {
                    console.error('Error reading existing cache state:', error);
                }
                
                // Update with current file content
                fileContents[fileName] = content;
                
                // Create the state object
                const stateToSave = {
                    fileName: currentFileName,
                    timestamp: new Date().getTime(),
                    folderPath: currentFolderPath || '',
                    fileContents: fileContents,
                    files: currentFiles.map(file => ({
                        name: file.name,
                        path: file.webkitRelativePath || ''
                    }))
                };
                
                // Save to localStorage
                localStorage.setItem('markdownViewerState', JSON.stringify(stateToSave));
                
                // Show notification if not silent
                if (!silent) {
                    showToast('Cache updated.', 'success');
                }
                
                // Update UI indicators
                updateFileListCacheIndicators(fileContents);
            }
        }
        
        // Function to update the cached indicators in the file list
        function updateFileListCacheIndicators(fileContents) {
            const items = fileList.querySelectorAll('li');
            items.forEach(item => {
                const fileName = item.textContent.trim();
                if (fileContents[fileName]) {
                    item.classList.add('cached');
                } else {
                    item.classList.remove('cached');
                }
            });
        }        function loadStateFromLocalStorage() {
            const savedState = localStorage.getItem('markdownViewerState');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    // Prüfen ob der gespeicherte Zustand nicht älter als 7 Tage ist
                    const now = new Date().getTime();
                    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
                    
                    if (state.fileName && (state.content || state.fileContents) && (now - state.timestamp < sevenDays)) {
                        // Unterstützung für altes Format (mit state.content) und neues Format (mit state.fileContents)
                        const fileContents = state.fileContents || { [state.fileName]: state.content };
                        const normalizedContent = (fileContents[state.fileName] || "").replace(/\r\n/g, '\n');
                        
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
                                const fileName = fileInfo.name;
                                // Wir erstellen ein erweitertes File-ähnliches Objekt mit zusätzlichen Eigenschaften
                                return {
                                    name: fileName,
                                    webkitRelativePath: fileInfo.path || '',
                                    // Hilfsmethode, die beim Klick auf den Dateinamen aufgerufen wird
                                    cachedContent: fileContents[fileName] || null,
                                    // Wir emulieren die getFile-Methode für File-Handle Kompatibilität
                                    getFile: function() {
                                        // Prüfen, ob wir den Inhalt dieser Datei gespeichert haben
                                        if (fileContents[fileName]) {
                                            return Promise.resolve(new Blob([fileContents[fileName]], { type: 'text/markdown' }));
                                        }
                                        
                                        // Bei nicht gespeicherten Dateien zeigen wir eine Nachricht an
                                        return Promise.resolve(new Blob([
                                            "# File content not available\n\n" +
                                            "The content of this file was not saved in the browser cache.\n\n" +
                                            "Please reload the folder using the 'Open Folder' button to access all files in the folder."
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
                        
                        // Show mobile menu when saved state is loaded on mobile
                        if (window.innerWidth <= 768) {
                            sidebar.classList.add('mobile-visible');
                            mobileMenuButton.setAttribute('aria-expanded', 'true');
                            
                            // Adjust content area margin based on sidebar height
                            setTimeout(() => {
                                const sidebarHeight = sidebar.getBoundingClientRect().height;
                                document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                            }, 10);
                        }
                        
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
            let newContentFromEditor = '';
            let contentChanged = false;

            if (tuiEditor) { // If the TUI editor instance exists
                if (userMadeChangesInEditor) {
                    newContentFromEditor = tuiEditor.getMarkdown(); // Gets the Markdown content from the editor
                    // Direct comparison: contentChanged is true if the strings are not identical.
                    contentChanged = newContentFromEditor !== originalFileContent;
                } else {
                    // If user made no changes, ensure we don't use editor's potentially re-serialized content
                    newContentFromEditor = originalFileContent; // Keep original content
                    contentChanged = false; // No changes to save or download
                }
                tuiEditor.destroy(); // Destroys the editor instance properly
                tuiEditor = null; // Resets the editor variable
            }
            
            if (contentChanged) {
                currentFileRawContent = newContentFromEditor; 
                contentWasChanged = true; // Markieren, dass Änderungen vorgenommen wurden
                  // Update cache and localStorage with the updated content, but silent to avoid duplicate toast
                updateCacheAndLocalStorage(currentFileName, newContentFromEditor, true); 
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
                // Speichert den Zustand - zeige Toast-Benachrichtigung
                saveStateToLocalStorage(false);
                
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
            showToast(`Download of "${currentFileName}" initiated.`, 'success');
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
        }        // Function to Clear Current File: Unloads the current file and resets the UI
        function clearCurrentFile() {
            // Bestätigungsdialog anzeigen
            if (currentFileName && confirm(`Do you really want to unload "${currentFileName}"?`)) {
                // Lokalen Speicher löschen
                localStorage.removeItem('markdownViewerState');
                
                // Toast-Benachrichtigung zeigen
                showToast('All saved files have been removed from the browser storage.', 'info');
                
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
                
                // Tatsächliche Höhe des Menüs für den Abstand verwenden
                setTimeout(() => {
                    const sidebarHeight = sidebar.getBoundingClientRect().height;
                    document.querySelector('.content-area').style.marginTop = `${sidebarHeight}px`;
                }, 10);
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