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
        
        // Event Listener for Mobile Menu Button: Toggles sidebar visibility on mobile devices
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false; // Check current state
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded); // Toggle ARIA attribute
            sidebar.classList.toggle('mobile-visible'); // Toggle CSS class to show/hide sidebar
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
        }

        // Function to Display File Content: Reads and displays the content of a selected file
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
                    currentFileRawContent = e.target.result; // Stores the raw file content
                    originalFileContent = e.target.result; // Stores original content for comparison
                    currentFileName = fileName; // Stores the current file name
                    contentHeaderText.textContent = fileName; // Updates the header with the file name
                    editButton.style.display = 'inline-block'; // Shows the Edit button
                    editButton.disabled = false; // Enables the Edit button
                    downloadButton.style.display = 'none'; // Hides the Download button initially

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
                        // If content changes during editing, this is noted
                        if (tuiEditor) {                            const currentContent = tuiEditor.getMarkdown();
                            // We only note that the content has changed, but update the download button
                            // only on save, to avoid showing it during editing
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
        }
        
        // Function to Handle No File Selected: Updates UI when no file is active
        function handleNoFileSelected(message) {
            displayPlaceholder(message); // Displays the provided message as a placeholder
            contentHeaderText.textContent = "No file selected"; // Resets header text
            editButton.style.display = 'none'; // Hides Edit button
            downloadButton.style.display = 'none'; // Hides Download button
            currentFileName = ''; // Clears current file name
            originalFileContent = ''; // Clears original content
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
            editButton.style.display = 'none'; // Hides Edit button
            downloadButton.style.display = 'none'; // Hides Download button
            
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
        }
        
        // Function to Save Content and Switch to View Mode: Saves changes and returns to viewing
        function saveAndSwitchToViewMode() {
            if (tuiEditor) { // If the TUI editor instance exists
                currentFileRawContent = tuiEditor.getMarkdown(); // Gets the Markdown content from the editor
                tuiEditor.destroy(); // Destroys the editor instance properly
                tuiEditor = null; // Resets the editor variable
            }
            
            // Displays the (potentially updated) content as rendered Markdown
            markdownOutput.innerHTML = marked.parse(currentFileRawContent);
            markdownOutput.style.display = 'block'; // Shows Markdown output
            wysiwygEditorContainer.style.display = 'none'; // Hides WYSIWYG editor
            wysiwygEditorContainer.innerHTML = ''; // Clears the editor container

            editButton.textContent = 'Edit'; // Changes button text back to "Edit"
            isEditMode = false; // Resets edit mode flag

            // Checks if content was changed and we have a valid file name
            const contentChanged = currentFileRawContent !== originalFileContent && currentFileName;
            
            // Shows/hides the Download button based on whether content has changed
            downloadButton.style.display = contentChanged ? 'inline-block' : 'none';

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
            if (!currentFileName) return; // Safety check
            
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
        }
        
        // Event Listener for Download Button
        downloadButton.addEventListener('click', downloadModifiedFile);
        
        // Initial Application State Setup
        displayPlaceholder("Select a folder or a file."); // Displays initial placeholder message
        editButton.style.display = 'none'; // Hides the Edit button initially
        downloadButton.style.display = 'none'; // Hides the Download button initially
