const modalHTML = `
<div id="buttonEditor" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Edit Button</h2>
        <div class="form-group">
            <label for="buttonText">Button Text:</label>
            <input type="text" id="buttonText" />
        </div>
        <div class="form-group">
            <label for="buttonUrl">Button URL:</label>
            <input type="text" id="buttonUrl" />
        </div>
        <button id="saveButton" class="save-btn">Save Changes</button>
    </div>
</div>

<div id="imageEditor" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Edit Image</h2>
        <div class="form-group">
            <label for="imageUrl">Image URL:</label>
            <input type="text" id="imageUrl" />
        </div>
        <div class="form-group">
            <label for="imageAlt">Alt Text:</label>
            <input type="text" id="imageAlt" />
        </div>
        <div class="form-group">
            <label for="imageWidth">Width:</label>
            <input type="text" id="imageWidth" />
        </div>
        <button id="saveImageButton" class="save-btn">Save Changes</button>
    </div>
</div>`;

document.body.insertAdjacentHTML('beforeend', modalHTML);
class EmailBuilder {
    constructor() {
        this.codeContainer = document.querySelector('#codeEditor code');
        this.preview = document.getElementById('preview');
        this.draggedElement = null;
        this.addScrollToTop();
        this.init();
    }

    init() {
        // Make the code block editable
        this.codeContainer.setAttribute('contenteditable', 'true');

        // Set placeholder text if empty
        if (!this.codeContainer.textContent) {
            this.codeContainer.textContent = '<!-- Add your HTML email content here -->';
            this.codeContainer.classList.add('placeholder');
        }

        // Add focus and blur event listeners for placeholder behavior
        this.codeContainer.addEventListener('focus', () => {
            if (this.codeContainer.classList.contains('placeholder')) {
                this.codeContainer.textContent = '';
                this.codeContainer.classList.remove('placeholder');
            }
        });

        this.codeContainer.addEventListener('blur', () => {
            if (!this.codeContainer.textContent.trim()) {
                this.codeContainer.textContent = '<!-- Add your HTML email content here -->';
                this.codeContainer.classList.add('placeholder');
            }
        });

        this.renderPreview(this.codeContainer.textContent);
        this.setupCodeEditor();
        this.setupDragAndDrop();
        this.addFormatButton();

        // Initial syntax highlighting and formatting
        const formattedCode = html_beautify(this.codeContainer.textContent, {
            indent_size: 2,
            indent_char: ' ',
            max_preserve_newlines: 1,
            preserve_newlines: true,
            indent_inner_html: true
        });
        this.codeContainer.textContent = formattedCode;
        Prism.highlightElement(this.codeContainer);
    }



    addScrollToTop() {
        // Create scroll to top button
        const scrollButton = document.createElement('button');
        scrollButton.className = 'scroll-top';
        scrollButton.innerHTML = '↑';
        scrollButton.title = 'Scroll to top';
        document.body.appendChild(scrollButton);

        // Get the code editor element
        const codeEditor = document.getElementById('codeEditor');

        // Show/hide button based on scroll position
        codeEditor.addEventListener('scroll', () => {
            if (codeEditor.scrollTop > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });

        // Scroll to top when clicked
        scrollButton.addEventListener('click', () => {
            codeEditor.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    setupCodeEditor() {
        let isTyping = false;
        let typingTimer = null;

        this.codeContainer.addEventListener('input', () => {
            if (isTyping) {
                clearTimeout(typingTimer);
            }

            isTyping = true;

            // Store cursor position
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const startOffset = range.startOffset;
            const startContainer = range.startContainer;

            // Update preview without immediate syntax highlighting
            const html = this.codeContainer.textContent;
            if (html) {
                this.renderPreview(html);
            }

            // Delay syntax highlighting until typing stops
            typingTimer = setTimeout(() => {
                isTyping = false;

                // Refresh syntax highlighting
                Prism.highlightElement(this.codeContainer);

                // Restore cursor position
                requestAnimationFrame(() => {
                    try {
                        const newRange = document.createRange();
                        newRange.setStart(startContainer, startOffset);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    } catch (e) {
                        // If restoring cursor fails, place it at the end
                        const range = document.createRange();
                        range.selectNodeContents(this.codeContainer);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                });
            }, 500); // Wait 500ms after typing stops before highlighting
        });

        // Prevent default tab behavior
        this.codeContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const tabNode = document.createTextNode('    ');
                range.insertNode(tabNode);
                range.setStartAfter(tabNode);
                range.setEndAfter(tabNode);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    }

    renderPreview(html) {
        if (!html) return;

        const scrollPos = this.preview.scrollTop;
        this.preview.innerHTML = html;
        this.preview.scrollTop = scrollPos;

        this.processContent();
    }

    makeContentEditable(wrapper) {
        // Find all text elements within the wrapper
        const textElements = wrapper.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
        textElements.forEach(element => {
            // Skip if element is already editable or is part of a button/link
            if (element.contentEditable === 'true' || element.closest('a')) return;

            // Make element editable
            element.contentEditable = 'true';
            element.classList.add('editable');

            // Prevent drag when editing text
            element.addEventListener('mousedown', (e) => {
                if (e.target.contentEditable === 'true') {
                    e.stopPropagation();
                }
            });

            // Update code editor when text changes
            element.addEventListener('input', () => {
                this.updateCodeEditor();
            });

            // Prevent drag start when editing
            element.addEventListener('dragstart', (e) => {
                if (e.target.contentEditable === 'true') {
                    e.preventDefault();
                }
            });
        });
    }

    processContent() {
        const mainTableTd = this.preview.querySelector('table[bgcolor="#000000"] > tbody > tr > td');
        if (!mainTableTd) return;

        const contentTables = Array.from(mainTableTd.children).filter(child =>
            child.tagName === 'TABLE' && !child.closest('.draggable-section')
        );

        contentTables.forEach(table => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('draggable-section');

            // Add delete button
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-block';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete this block';

            // Add clone button
            const cloneBtn = document.createElement('span');
            cloneBtn.className = 'clone-block';
            cloneBtn.innerHTML = '⎘';
            cloneBtn.title = 'Clone this block';

            wrapper.appendChild(deleteBtn);
            wrapper.appendChild(cloneBtn);

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);

            this.addDragListeners(wrapper);
            this.makeContentEditable(wrapper);
            this.setupButtonEditing(wrapper);
            this.setupImageEditing(wrapper);
            this.setupDeleteHandler(wrapper, deleteBtn);
            this.setupCloneHandler(wrapper, cloneBtn);
        });

        this.insertDropzones();
    }

    setupCloneHandler(wrapper, cloneBtn) {
        cloneBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Clone the wrapper and its contents
            const clone = wrapper.cloneNode(true);

            // Insert after the original wrapper
            wrapper.parentNode.insertBefore(clone, wrapper.nextSibling);

            // Re-add all event listeners to the cloned element
            this.addDragListeners(clone);
            this.makeContentEditable(clone);
            this.setupButtonEditing(clone);

            // Setup handlers for the cloned buttons
            const clonedDeleteBtn = clone.querySelector('.delete-block');
            const clonedCloneBtn = clone.querySelector('.clone-block');
            this.setupDeleteHandler(clone, clonedDeleteBtn);
            this.setupCloneHandler(clone, clonedCloneBtn);

            // Update the code editor and dropzones
            this.updateCodeEditor();
        });
    }

    setupImageEditing(wrapper) {
        const images = wrapper.getElementsByTagName('img');
        Array.from(images).forEach(img => {
            // Create container for the image
            const container = document.createElement('div');
            container.className = 'image-container';

            // Create edit icon
            const editIcon = document.createElement('span');
            editIcon.innerHTML = '✏️';
            editIcon.className = 'image-edit-icon';

            // Wrap image in container
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
            container.appendChild(editIcon);

            // Setup click handler
            editIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openImageEditor(img);
            });
        });
    }

    setupImageEditing(wrapper) {
        const images = wrapper.getElementsByTagName('img');
        Array.from(images).forEach(img => {
            // Skip if already setup
            if (img.closest('.image-container')) return;

            // Create container for the image
            const container = document.createElement('div');
            container.className = 'image-container';

            // Create edit icon
            const editIcon = document.createElement('span');
            editIcon.innerHTML = '✏️';
            editIcon.className = 'image-edit-icon';

            // Wrap image in container
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
            container.appendChild(editIcon);

            // Setup click handler
            editIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openImageEditor(img);
            });
        });
    }

    openImageEditor(img) {
        const modal = document.getElementById('imageEditor');
        const imageUrl = modal.querySelector('#imageUrl');
        const imageAlt = modal.querySelector('#imageAlt');
        const imageWidth = modal.querySelector('#imageWidth');
        const saveBtn = modal.querySelector('#saveImageButton');
        const closeBtn = modal.querySelector('.close');

        // Populate current values
        imageUrl.value = img.src;
        imageAlt.value = img.alt || '';
        imageWidth.value = img.getAttribute('width') || '';

        // Show modal
        modal.style.display = 'block';

        // Handle save
        const saveHandler = () => {
            img.src = imageUrl.value;
            img.alt = imageAlt.value;
            if (imageWidth.value) {
                img.setAttribute('width', imageWidth.value);
            } else {
                img.removeAttribute('width');
            }
            modal.style.display = 'none';
            this.updateCodeEditor();
        };

        // Handle close
        const closeHandler = () => {
            modal.style.display = 'none';
        };

        // Remove existing listeners
        saveBtn.removeEventListener('click', saveHandler);
        closeBtn.removeEventListener('click', closeHandler);

        // Add new listeners
        saveBtn.addEventListener('click', saveHandler);
        closeBtn.addEventListener('click', closeHandler);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    setupButtonEditing(wrapper) {
        const anchors = wrapper.getElementsByTagName('a');
        Array.from(anchors).forEach(anchor => {
            // Skip if already setup
            if (anchor.querySelector('.anchor-edit-icon')) return;

            // Create container for the anchor
            const container = document.createElement('span');
            container.className = 'anchor-container';

            // Create edit icon
            const editIcon = document.createElement('span');
            editIcon.innerHTML = '✏️';
            editIcon.className = 'anchor-edit-icon';

            // Setup the structure
            anchor.parentNode.insertBefore(container, anchor);
            container.appendChild(anchor);
            container.appendChild(editIcon);

            // Make anchor non-editable directly
            anchor.contentEditable = 'false';

            // Setup click handlers
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openButtonEditor(anchor);
            };

            // Add click handlers
            editIcon.addEventListener('click', clickHandler);
            anchor.addEventListener('click', clickHandler);
        });
    }

    setupDeleteHandler(wrapper, deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'confirm-dialog';
            confirmDialog.innerHTML = `
                <div class="confirm-content">
                    <p>Are you sure you want to delete this block?</p>
                    <div class="confirm-buttons">
                        <button class="confirm-yes">Yes, Delete</button>
                        <button class="confirm-no">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            const rect = deleteBtn.getBoundingClientRect();
            confirmDialog.style.top = `${rect.top + window.scrollY}px`;
            confirmDialog.style.left = `${rect.left + window.scrollX - 200}px`;

            const handleYes = () => {
                wrapper.remove();
                this.updateCodeEditor();
                confirmDialog.remove();
            };

            confirmDialog.querySelector('.confirm-yes').addEventListener('click', handleYes);
            confirmDialog.querySelector('.confirm-no').addEventListener('click', () => confirmDialog.remove());

            window.addEventListener('click', (e) => {
                if (!confirmDialog.contains(e.target) && e.target !== deleteBtn) {
                    confirmDialog.remove();
                }
            });
        });
    }

    openButtonEditor(anchor) {
        const modal = document.getElementById('buttonEditor');
        const buttonTextInput = document.getElementById('buttonText');
        const buttonUrlInput = document.getElementById('buttonUrl');
        const saveButton = document.getElementById('saveButton');
        const closeBtn = modal.querySelector('.close');

        // Populate current values
        buttonTextInput.value = anchor.textContent.trim();
        buttonUrlInput.value = anchor.href;

        // Show modal
        modal.style.display = 'block';

        // Handle save
        const saveHandler = () => {
            anchor.textContent = buttonTextInput.value;
            anchor.href = buttonUrlInput.value;
            modal.style.display = 'none';
            this.updateCodeEditor();
        };

        // Handle close
        const closeHandler = () => {
            modal.style.display = 'none';
        };

        // Add event listeners
        saveButton.addEventListener('click', saveHandler);
        closeBtn.addEventListener('click', closeHandler);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    addDragListeners(element) {
        element.setAttribute('draggable', true);

        element.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            this.draggedElement = element;
            element.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
            this.updateDropzones(true);
        });

        element.addEventListener('dragend', () => {
            if (this.draggedElement) {
                this.draggedElement.style.opacity = '1';
            }
        });
    }

    setupDragAndDrop() {
        this.preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropzone = e.target.closest('.dropzone');
            if (dropzone) {
                dropzone.classList.add('active');
            }
        });

        this.preview.addEventListener('dragleave', (e) => {
            const dropzone = e.target.closest('.dropzone');
            if (dropzone) {
                dropzone.classList.remove('active');
            }
        });

        this.preview.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropzone = e.target.closest('.dropzone');

            if (dropzone && this.draggedElement) {
                dropzone.parentNode.insertBefore(this.draggedElement, dropzone.nextSibling);
                this.draggedElement.style.opacity = '1';
                this.updateDropzones(true);
                this.updateCodeEditor();
            }
        });
    }

    insertDropzones() {
        const sections = Array.from(this.preview.getElementsByClassName('draggable-section'));

        // Remove existing dropzones
        const existingDropzones = Array.from(this.preview.getElementsByClassName('dropzone'));
        existingDropzones.forEach(dropzone => dropzone.remove());

        // Add dropzones between sections
        sections.forEach(section => {
            const dropzone = document.createElement('div');
            dropzone.classList.add('dropzone');
            section.parentNode.insertBefore(dropzone, section);
        });

        // Add final dropzone
        if (sections.length > 0) {
            const finalDropzone = document.createElement('div');
            finalDropzone.classList.add('dropzone');
            sections[sections.length - 1].parentNode.appendChild(finalDropzone);
        }
    }

    updateDropzones(isDragging) {
        const dropzones = Array.from(this.preview.getElementsByClassName('dropzone'));
        dropzones.forEach(dropzone => {
            dropzone.classList.remove('active');
            dropzone.style.display = isDragging ? 'block' : 'none';
        });
    }

    updateCodeEditor() {
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = this.preview.innerHTML;

        // Remove all editing UI elements
        const elementsToRemove = [
            '.anchor-edit-icon',
            '.image-edit-icon',
            '.delete-block',
            '.clone-block',
            '.dropzone',
            '.image-container',
            '.anchor-container'
        ];

        elementsToRemove.forEach(selector => {
            const elements = tempContainer.querySelectorAll(selector);
            elements.forEach(element => element.remove());
        });

        // Unwrap elements from containers
        const containers = tempContainer.querySelectorAll('.draggable-section');
        containers.forEach(container => {
            while (container.firstChild) {
                container.parentNode.insertBefore(container.firstChild, container);
            }
            container.remove();
        });

        // Format the HTML with modified beautifier options
        const formattedHtml = html_beautify(tempContainer.innerHTML, {
            indent_size: 2,
            indent_char: ' ',
            max_preserve_newlines: 1,
            preserve_newlines: true,
            keep_array_indentation: false,
            break_chained_methods: false,
            indent_scripts: 'keep',
            brace_style: 'collapse',
            space_before_conditional: true,
            unescape_strings: false,
            jslint_happy: false,
            end_with_newline: false,
            wrap_line_length: 0,
            indent_inner_html: true,
            comma_first: false,
            e4x: false,
            indent_empty_lines: false,
            wrap_attributes: 'force-aligned',
            wrap_attributes_min_attrs: 99999,
            inline: ['a', 'span', 'img', 'code', 'pre', 'sub', 'sup', 'em', 'strong', 'b', 'i', 'u', 'strike', 'big', 'small', 'pre'],
            unformatted: ['code', 'pre'],
            content_unformatted: ['pre', 'textarea'],
            extra_liners: ['head', 'body', '/html']
        });

        // Update code editor with formatted HTML
        this.codeContainer.textContent = formattedHtml;

        // Refresh syntax highlighting
        Prism.highlightElement(this.codeContainer);

        // Re-process the content to maintain functionality
        this.processContent();
    }

    // Add a format button functionality
    addFormatButton() {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'editor-buttons';
        this.codeContainer.parentNode.insertBefore(buttonContainer, this.codeContainer);

        // Format Code button
        const formatButton = document.createElement('button');
        formatButton.textContent = 'Format Code';
        formatButton.className = 'editor-button format-button';

        // Copy Code button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Code';
        copyButton.className = 'editor-button copy-button';

        // Download Code button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download Code';
        downloadButton.className = 'editor-button download-button';

        // Add buttons to container
        buttonContainer.appendChild(formatButton);
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(downloadButton);

        // Format button click handler
        formatButton.addEventListener('click', () => {
            const currentCode = this.codeContainer.textContent;
            const formattedCode = html_beautify(currentCode, {
                indent_size: 2,
                indent_char: ' ',
                max_preserve_newlines: 1,
                preserve_newlines: true,
                indent_inner_html: true
            });
            this.codeContainer.textContent = formattedCode;
            Prism.highlightElement(this.codeContainer);
        });

        // Copy button click handler
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.codeContainer.textContent);
                this.showNotification('Code copied to clipboard!');
            } catch (err) {
                this.showNotification('Failed to copy code', true);
            }
        });

        // Download button click handler
        downloadButton.addEventListener('click', () => {
            const blob = new Blob([this.codeContainer.textContent], {
                type: 'text/plain'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'email-template.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            this.showNotification('Code downloaded!');
        });
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 2 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }


}

// Initialize the builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmailBuilder();
});