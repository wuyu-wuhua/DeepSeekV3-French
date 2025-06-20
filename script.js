const GOOGLE_AUTH_ENDPOINT = 'https://erweima3.com/google_login.php'; // Your authentication endpoint

const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = IS_LOCALHOST ? 'http://localhost:3001' : window.location.origin;

// Function to get the primary domain (e.g., a.com from www.a.com or sub.a.com)
function getPrimaryDomain() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/)) { // IP address or localhost
        return hostname; 
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
        if (parts[parts.length-2] === 'co' || parts[parts.length-2] === 'com' || parts[parts.length-2] === 'org' || parts[parts.length-2] === 'net') {
            if (parts.length > 3) { 
                 return parts.slice(-3).join('.');
            }
        }
        return parts.slice(-2).join('.');
    }
    return hostname;
}

function handleGoogleLogin() {
    const primaryDomain = getPrimaryDomain();
    const siteUrlForAuth = primaryDomain; 
    const callbackUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const googleLoginUrl = `${GOOGLE_AUTH_ENDPOINT}?url=syzy89.com;&redirect_uri=${callbackUri}`;
    window.location.href = googleLoginUrl;
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function updateLoginUI() {
    const navAuthLink = document.querySelector('.nav-auth-link');
    const sidebar = document.querySelector('.sidebar'); 

    if (!sidebar) {
        // If on a page without a sidebar (e.g. login, register, privacy), 
        // still check for a generic auth link if one exists (e.g. in a header)
        if (navAuthLink) {
            if (isLoggedIn()) {
                navAuthLink.style.display = 'none'; // Or change to user info/logout
            } else {
                navAuthLink.style.display = 'block';
            }
        }
        return; 
    }

    const existingProfile = sidebar.querySelector('.user-profile-sidebar');
    if (existingProfile) {
        existingProfile.remove();
    }

    if (isLoggedIn()) {
        const userName = localStorage.getItem('name') || 'Utilisateur';
        const userPicture = localStorage.getItem('picture');
        
        if (navAuthLink) {
            navAuthLink.style.display = 'none'; 
        }

        const userProfileDiv = document.createElement('div');
        userProfileDiv.classList.add('user-profile-sidebar');
        
        let avatarHTML = '';
        if (userPicture) {
            avatarHTML = `<img src="${userPicture}" alt="${userName}" class="user-avatar-sidebar">`;
        } else {
            const firstLetter = userName.charAt(0).toUpperCase();
            avatarHTML = `<div class="user-avatar-sidebar text-avatar">${firstLetter}</div>`;
        }

        userProfileDiv.innerHTML = `
            ${avatarHTML}
            <span class="user-name-sidebar">${userName}</span>
            <div class="user-profile-dropdown">
                <a href="#" id="viewProfileBtnSidebar">Voir le profil</a>
                <a href="#" id="logoutBtnSidebar">Déconnexion</a>
            </div>
        `;
        
        const sidebarNav = sidebar.querySelector('.sidebar-nav');
        if (sidebarNav) {
            // Insert profile before the first direct child of sidebarNav that is not an auth link or other profile
            // This attempts to place it before the UL or other main nav links
            const firstRealNavItem = sidebarNav.querySelector('ul, a:not(.nav-auth-link):not(.user-profile-sidebar)');
            if (firstRealNavItem) {
                 sidebarNav.insertBefore(userProfileDiv, firstRealNavItem);
            } else {
                 sidebarNav.appendChild(userProfileDiv); // Fallback
            }
        } else { 
            sidebar.insertBefore(userProfileDiv, sidebar.firstChild);
        }

        userProfileDiv.addEventListener('click', (e) => {
            const dropdown = userProfileDiv.querySelector('.user-profile-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
        
        const logoutBtn = userProfileDiv.querySelector('#logoutBtnSidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        const viewProfileBtn = userProfileDiv.querySelector('#viewProfileBtnSidebar');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'view-profile.html'; 
            });
        }

    } else { 
        if (navAuthLink) {
            navAuthLink.style.display = 'block'; 
        }
    }
}

function logout() {
    localStorage.removeItem('google_id');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('picture');
    localStorage.removeItem('token');
    
    updateLoginUI(); 
    
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
         window.location.href = 'index.html';
    } else {
        window.location.reload(); 
    }
}

function checkGoogleLoginCallback() {
    const url = window.location.href;
    if (url.includes('google_id=')) {
        const params = new URLSearchParams(url.split('?')[1]);
        
        const googleId = params.get('google_id');
        const name = params.get('name');
        const email = params.get('email');
        const picture = params.get('picture');
        
        console.log("Google Login Data:", { googleId, name, email, picture });

        if (googleId) localStorage.setItem('google_id', googleId);
        if (name) localStorage.setItem('name', name);
        if (email) localStorage.setItem('email', email);
        if (picture) localStorage.setItem('picture', picture);
        
        const tokenPayload = { googleId, name, email, picture };
        const token = btoa(JSON.stringify(tokenPayload)); 
        localStorage.setItem('token', token);
        
        updateLoginUI(); 

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Modified redirect logic:
        // Stay on view-profile.html if that's the callback page.
        // Redirect from login.html/register.html to index.html.
        // Other pages (if any were to be callback targets) also redirect to index.html.
        const currentPath = window.location.pathname;
        if (currentPath.endsWith('/login.html') || currentPath.endsWith('/register.html')) {
            window.location.href = 'index.html';
        } else if (currentPath !== '/index.html' && currentPath !== '/' && !currentPath.endsWith('/view-profile.html')) {
            // This condition handles other unexpected callback pages by redirecting to index.html
            window.location.href = 'index.html';
        }
        // If currentPath is index.html, view-profile.html, or '/', no automatic redirect from here.
        // For view-profile.html, populateUserProfilePage() will run shortly after this.
    }
}

function populateUserProfilePage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const userProfileAvatarImg = document.getElementById('userProfileAvatar');
    const userProfileAvatarText = document.getElementById('userProfileAvatarText');
    const userProfileNameSpan = document.getElementById('userProfileName');
    const userProfileEmailSpan = document.getElementById('userProfileEmail');

    const userName = localStorage.getItem('name') || 'Utilisateur';
    const userEmail = localStorage.getItem('email') || 'N/D';
    const userPicture = localStorage.getItem('picture');

    if (userPicture) {
        if (userProfileAvatarImg) {
            userProfileAvatarImg.src = userPicture;
            userProfileAvatarImg.alt = userName;
            userProfileAvatarImg.style.display = 'block';
        }
        if (userProfileAvatarText) userProfileAvatarText.style.display = 'none';
    } else {
        if (userProfileAvatarText) {
            userProfileAvatarText.textContent = userName.charAt(0).toUpperCase();
            userProfileAvatarText.style.display = 'flex'; 
        }
        if (userProfileAvatarImg) userProfileAvatarImg.style.display = 'none';
    }

    if (userProfileNameSpan) userProfileNameSpan.textContent = userName;
    if (userProfileEmailSpan) userProfileEmailSpan.textContent = userEmail;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- General Navigation & Sidebar --- 
    const newChatBtnSidebar = document.getElementById('newChatBtnSidebar');
    if (newChatBtnSidebar) {
        newChatBtnSidebar.addEventListener('click', () => {
            window.location.href = 'index.html';
            currentLoadedChatId = null; // Reset when starting a new chat
        });
    }
    const newChatBtnSidebarFeedback = document.getElementById('newChatBtnSidebarFeedback');
    if (newChatBtnSidebarFeedback) {
        newChatBtnSidebarFeedback.addEventListener('click', () => {
            window.location.href = 'index.html';
            currentLoadedChatId = null; // Reset when starting a new chat from feedback page
        });
    }

    // Highlight active page in sidebar
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // --- Chat Interface Specifics (index.html) --- 
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messageArea = document.getElementById('messageArea');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const useCaseButtons = document.querySelectorAll('.use-case-btn');
    const imageAspectRatioSelector = document.getElementById('image-aspect-ratio-selector');
    let selectedAspectRatio = null; // Variable to store selected ratio
    let uploadedFileObjects = []; // Store actual File objects for API calls

    function showAspectRatioSelector() {
        if (imageAspectRatioSelector) {
            imageAspectRatioSelector.style.display = 'block';
        }
    }

    function hideAspectRatioSelector() {
        if (imageAspectRatioSelector) {
            imageAspectRatioSelector.style.display = 'none';
        }
        // Reset selected button visual state if needed when hiding
        const currentSelected = imageAspectRatioSelector ? imageAspectRatioSelector.querySelector('.aspect-ratio-btn.selected') : null;
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        selectedAspectRatio = null; // Clear selected ratio
    }

    if (imageAspectRatioSelector) {
        const ratioButtons = imageAspectRatioSelector.querySelectorAll('.aspect-ratio-btn');
        ratioButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove .selected from previously selected button
                const currentSelected = imageAspectRatioSelector.querySelector('.aspect-ratio-btn.selected');
                if (currentSelected) {
                    currentSelected.classList.remove('selected');
                }
                // Add .selected to clicked button
                button.classList.add('selected');
                selectedAspectRatio = button.dataset.ratio;
                console.log('Selected Aspect Ratio:', selectedAspectRatio);
                // Optionally, hide selector after selection or require explicit send
                // hideAspectRatioSelector(); 
            });
        });
    }

    // Function to add a message to the chat area
    function addMessageToChat(text, sender, imageUrl = null) {
        if (!messageArea) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (imageUrl) {
            const imgContainer = document.createElement('div'); // Container for image and button
            imgContainer.classList.add('image-message-container');

            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            
            if (sender === 'bot') { // Style for AI generated images
                imgElement.alt = "Image générée par IA";
                imgElement.classList.add('generated-image-display'); // Class for larger display

                const downloadBtn = document.createElement('a');
                downloadBtn.href = imageUrl;
                downloadBtn.download = `generated_image_${Date.now()}.png`; // Suggest a filename
                downloadBtn.textContent = 'Télécharger les images'; // Download Text
                downloadBtn.classList.add('download-image-btn');
                imgContainer.appendChild(downloadBtn); // Add button first or last based on desired layout
            } else { // Style for user uploaded images in chat
                imgElement.alt = "Image téléversée par l'utilisateur";
                imgElement.classList.add('user-image-display'); // Class for user image display in chat
            }
            imgContainer.insertBefore(imgElement, imgContainer.firstChild); // Image before button
            messageDiv.appendChild(imgContainer);
        }
        
        if (text) { // Only process text if it exists
            if (sender === 'bot') {
                const paragraphs = text.split(/\r\n|\n|\r/); // Split by newlines (Windows, Unix, old Mac)
                paragraphs.forEach(paraText => {
                    if (paraText.trim() !== '') { // Avoid creating empty paragraphs
                        const pElement = document.createElement('p');
                        pElement.textContent = paraText;
                        messageDiv.appendChild(pElement);
                    }
                });
            } else {
                // For user messages, keep as a single paragraph or handle differently if needed
                const pElement = document.createElement('p');
                pElement.textContent = text;
                messageDiv.appendChild(pElement);
            }
        }
        
        // If messageDiv is empty (e.g. image-only message from user with no text), 
        // but we still want to append it (e.g. for the image itself)
        if (messageDiv.hasChildNodes()) {
            messageArea.appendChild(messageDiv);
            messageArea.scrollTop = messageArea.scrollHeight; // Scroll to bottom
        }
        return messageDiv; // Return the created message div for potential manipulation (e.g., removing processing message)
    }

    // Определяем системные подсказки для каждого сценария
    const systemPrompts = {
        general: "Vous êtes un assistant général utile.",
        education: "Vous êtes un assistant pédagogique. Aidez l'utilisateur à comprendre les concepts et à apprendre efficacement.",
        translation: "Vous êtes un assistant de traduction. Traduisez le texte de l'utilisateur avec précision et naturel.",
        data_analysis: "Vous êtes un assistant d'analyse de données. Fournissez des informations et aidez avec les requêtes liées aux données.",
        screenwriting: "Vous êtes un assistant scénariste. Aidez l'utilisateur avec des idées créatives et l'écriture de scénarios.",
        media_ops: "Vous êtes un assistant en opérations médiatiques. Offrez des conseils sur la planification de contenu et les stratégies marketing."
        // Для image_parsing, ai_drawing, image_to_image API-вызовы будут другими (пока не реализуем)
    };
    let currentSystemPrompt = systemPrompts.general;
    let currentUseCaseKey = 'general';
    let currentLoadedChatId = null; // Track the currently loaded chat ID

    // --- Chat History Management ---
    const MAX_HISTORY_ITEMS = 50; // Maximum number of history items to store
    const MAX_TITLE_LENGTH = 30; // Max length for chat titles

    function getChatHistory() {
        const history = localStorage.getItem('chatHistory');
        return history ? JSON.parse(history) : [];
    }

    function saveChatHistory(history) {
        localStorage.setItem('chatHistory', JSON.stringify(history.slice(-MAX_HISTORY_ITEMS)));
        loadChatHistory(); // Refresh the display
    }

    function addConversationToHistory(messages, titlePrefix = "Discussion") {
        if (!messages || messages.length === 0) return;

        let history = getChatHistory();
        const userMessages = messages.filter(m => m.sender === 'user' && m.text);
        let title = titlePrefix;

        if (userMessages.length > 0) {
            title = userMessages[0].text.substring(0, MAX_TITLE_LENGTH);
            if (userMessages[0].text.length > MAX_TITLE_LENGTH) {
                title += "...";
            }
        } else if (messages.length > 0 && messages[0].text) { // Fallback if no user text but other text exists
            title = messages[0].text.substring(0, MAX_TITLE_LENGTH);
             if (messages[0].text.length > MAX_TITLE_LENGTH) {
                title += "...";
            }
        } else if (messages.some(m => m.imageUrl)) {
            title = "Chat d'images " + new Date().toLocaleTimeString();
        }


        const conversation = {
            id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            messages: messages,
            timestamp: Date.now()
        };
        history.push(conversation);
        saveChatHistory(history);
    }

    function appendMessagesToCurrentChatOrStartNew(newMessages, titlePrefixIfNew = "Discussion") {
        if (!newMessages || newMessages.length === 0) return;
        let history = getChatHistory();
        if (currentLoadedChatId) {
            const existingChat = history.find(chat => chat.id === currentLoadedChatId);
            if (existingChat) {
                existingChat.messages.push(...newMessages);
                existingChat.timestamp = Date.now(); // Update timestamp to reflect recent activity
                // Optionally, update title if it was generic and new messages provide better context
                // For simplicity, we'll keep the original title unless explicitly renamed by user.
            } else {
                // Loaded chat ID was set, but chat not found (edge case, maybe deleted in another tab)
                // Proceed to create a new chat entry
                currentLoadedChatId = null; // Reset, as we couldn't find it
                addConversationToHistory(newMessages, titlePrefixIfNew);
                return; // Exit early as addConversationToHistory calls saveChatHistory
            }
        } else {
            addConversationToHistory(newMessages, titlePrefixIfNew);
            return; // Exit early as addConversationToHistory calls saveChatHistory
        }
        saveChatHistory(history); // Save if we appended to an existing chat
    }

    // --- End Chat History Management ---

    if (sendMessageBtn && chatInput) {
        sendMessageBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        
        if (messageText === '' && uploadedFileObjects.length === 0 && !['ai_drawing', 'image_to_image', 'image_parsing'].includes(currentUseCaseKey)) {
            return;
        } else if (messageText === '' && currentUseCaseKey === 'ai_drawing') {
            alert("Veuillez décrire ce que vous voulez dessiner.");
            return;
        } else if (uploadedFileObjects.length === 0 && (currentUseCaseKey === 'image_to_image' || currentUseCaseKey === 'image_parsing')) {
            alert("Veuillez téléverser une image pour cette fonction.");
            return;
        }

        let currentConversationMessages = [];

        // Display user's complete message (text + image) first for relevant use cases
        if (['image_to_image', 'image_parsing'].includes(currentUseCaseKey)) {
            if (messageText !== '') {
                addMessageToChat(messageText, 'user');
                currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
            }
            uploadedFileObjects.forEach(fileObj => {
                const imageURLForDisplay = URL.createObjectURL(fileObj);
                addMessageToChat("", 'user', imageURLForDisplay); 
                currentConversationMessages.push({ 
                    sender: 'user', 
                    imageUrl: imageURLForDisplay, 
                    originalFileName: fileObj.name, 
                    timestamp: Date.now() 
                });
                // Consider revoking imageURLForDisplay after API call in handleImageToImage/handleImageParsing to free memory
            });
        } else if (currentUseCaseKey !== 'ai_drawing') { // For other text/image cases (not pure drawing which has no initial image)
            if (messageText !== '') {
                addMessageToChat(messageText, 'user');
                currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
            }
            uploadedFileObjects.forEach(fileObj => {
                const imageURLForDisplay = URL.createObjectURL(fileObj);
                addMessageToChat("", 'user', imageURLForDisplay);
                currentConversationMessages.push({ sender: 'user', imageUrl: imageURLForDisplay, originalFileName: fileObj.name, timestamp: Date.now() });
            });
        } else if (messageText !== '' && currentUseCaseKey === 'ai_drawing') {
             // For AI drawing, only display the prompt as user message initially
            addMessageToChat(messageText, 'user');
            currentConversationMessages.push({ sender: 'user', text: messageText, timestamp: Date.now() });
        }

        const originalChatInputValue = chatInput.value; 
        chatInput.value = '';
        imagePreviewContainer.innerHTML = ''; 

        // Проверяем, относится ли текущий сценарий к тем, для которых мы вызываем API
        const textBasedUseCases = ['general', 'education', 'translation', 'data_analysis', 'screenwriting', 'media_ops'];
        
        // --- New API call logic based on use case ---
        if (currentUseCaseKey === 'ai_drawing') {
            await handleAIDrawing(originalChatInputValue, currentConversationMessages);
        } else if (currentUseCaseKey === 'image_to_image') {
            await handleImageToImage(originalChatInputValue, currentConversationMessages);
        } else if (currentUseCaseKey === 'image_parsing') {
            await handleImageParsing(originalChatInputValue, currentConversationMessages);
        } else if (textBasedUseCases.includes(currentUseCaseKey)) {
            // Existing logic for text-based chat APIs
            const processingMessageDiv = addMessageToChat("Je traite votre demande...", 'bot');
            try {
                const response = await fetch(`${API_BASE_URL}/api/chat`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userMessage: originalChatInputValue, 
                        systemMessage: currentSystemPrompt,
                        useCase: currentUseCaseKey
                    }),
                });
    
                if (processingMessageDiv && processingMessageDiv.parentNode) {
                    processingMessageDiv.remove(); 
                }
    
                if (!response.ok) {
                    let errorTextFromServer = `Erreur du serveur : ${response.status} ${response.statusText}`;
                    try {
                        const errorBodyText = await response.text();
                        if (errorBodyText) {
                            try {
                                const errorJson = JSON.parse(errorBodyText);
                                errorTextFromServer = errorJson.error || JSON.stringify(errorJson);
                            } catch (jsonParseError) {
                                errorTextFromServer = errorBodyText.substring(0, 200);
                            }
                        }
                    } catch (e) {
                        console.error("Could not read error response body", e);
                    }
                    console.error("Erreur du backend :", errorTextFromServer);
                    const errorMessageContent = `Erreur : ${errorTextFromServer}`;
                    addMessageToChat(errorMessageContent, 'bot');
                    currentConversationMessages.push({ sender: 'bot', text: errorMessageContent, timestamp: Date.now() });
                    appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur dans le chat");
                    return;
                }
    
                const data = await response.json();
                addMessageToChat(data.botResponse, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: data.botResponse, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages);
    
            } catch (error) {
                console.error('Error sending message to backend:', error);
                if (processingMessageDiv && processingMessageDiv.parentNode) {
                    processingMessageDiv.remove(); 
                }
                const networkErrorMessage = 'Erreur réseau : Impossible de se connecter au service AI. Veuillez vous assurer que le serveur backend est en cours d\'exécution et accessible.';
                addMessageToChat(networkErrorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: networkErrorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur réseau");
            }
        } else {
            // Fallback for use cases not yet fully implemented with specific API calls
            setTimeout(() => {
                addMessageToChat(`La réponse IA pour "${currentUseCaseKey}" (utilisant le modèle : qwen-plus) n\'est pas encore entièrement implémentée pour un appel API direct dans cette version. Simulation de réponse pour : ${originalChatInputValue}`, 'bot');
            }, 500);
        }
        // --- End of new API call logic ---

        uploadedFileObjects = []; // Clear stored file objects after processing

        // Check for keywords to show aspect ratio selector
        const imageKeywords = ['draw', 'generate', 'create', '画', '生成', '创作'];
        const messageTextLower = messageText.toLowerCase();
        if (imageKeywords.some(keyword => messageTextLower.includes(keyword.toLowerCase()))) {
            showAspectRatioSelector();
        } else {
            if (uploadedFileObjects.length === 0) {
                 hideAspectRatioSelector();
            }
        }
    }

    // --- Handler for AI Drawing (Text-to-Image via your backend) ---
    async function handleAIDrawing(prompt, currentConversationMessages) {
        addMessageToChat(`Génération de l\'image pour : "${prompt}"... Cela peut prendre un moment.`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `Génération de l\'image pour : "${prompt}"...`, timestamp: Date.now() });

        try {
            // IMPORTANT: You need to create this backend endpoint.
            // It will take the prompt, call the DashScope API (POST then GET for results),
            // and return the final image URL or an error.
            const response = await fetch(`${API_BASE_URL}/api/generate-image`, { // Placeholder backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    size: getPixelSize(selectedAspectRatio) // Pass selected aspect ratio or default
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Erreur du serveur : ${response.status}` }));
                const errorMessage = errorData.error || `Échec de la génération de l\'image. Statut : ${response.status}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur de dessin IA");
                return;
            }

            const data = await response.json();
            if (data.imageUrl) {
                addMessageToChat("Voici votre image générée :", 'bot', data.imageUrl);
                currentConversationMessages.push({ sender: 'bot', text: "Image générée :", imageUrl: data.imageUrl, timestamp: Date.now() });
            } else {
                addMessageToChat("Impossible de récupérer l\'URL de l\'image depuis la réponse.", 'bot');
                currentConversationMessages.push({ sender: 'bot', text: "Impossible de récupérer l\'URL de l\'image depuis la réponse.", timestamp: Date.now() });
            }
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('Error in handleAIDrawing:', error);
            const netError = 'Erreur réseau ou problème de connexion au service de génération d\'images.';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur réseau du dessin IA");
        }
        hideAspectRatioSelector(); // Hide after attempting generation
    }

    // --- Handler for Image-to-Image (via erweima3.com/api/ai/call) ---
    async function handleImageToImage(prompt, currentConversationMessages) {
        if (uploadedFileObjects.length === 0) {
            addMessageToChat("Veuillez d\'abord téléverser une image pour la fonction Image-vers-Image.", 'bot');
            return;
        }
        const selectedImage = uploadedFileObjects[0]; // We only allow one for this

        addMessageToChat(`Traitement de l\'image avec le style : "${prompt || 'défaut'}"...`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `Traitement de l\'image avec le style : "${prompt || 'défaut'}"...`, timestamp: Date.now() });

        const formData = new FormData();
        const google_id = localStorage.getItem('google_id');
        formData.append('google_id', google_id || '');
        formData.append('model_id', '5'); // Model ID for Qwen sketch-to-image
        formData.append('img', selectedImage);
        // The prompt here could be a style description or transformation instruction
        formData.append('content', prompt || 'Convertir en style croquis'); 
        formData.append('size', getPixelSize(selectedAspectRatio)); // Added size parameter

        try {
            const response = await fetch('https://aa.jstang.cn/api/ai/call', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `Erreur API Image-vers-Image : ${response.status} - ${errorText.substring(0,100)}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur Image-vers-Image");
                return;
            }

            const data = await response.json();
            console.log("Image-to-Image API Response Data:", data); // Log the full response
            if (data.data && typeof data.data === 'string') { // Assuming data.data is the image URL
                addMessageToChat("Image traitée :", 'bot', data.data);
                currentConversationMessages.push({ sender: 'bot', text: "Image traitée :", imageUrl: data.data, timestamp: Date.now() });
            } else {
                addMessageToChat("Impossible de récupérer l\'URL de l\'image traitée depuis la réponse API.", 'bot');
                currentConversationMessages.push({ sender: 'bot', text: "Impossible de récupérer l\'URL de l\'image traitée depuis la réponse API.", timestamp: Date.now() });
            }
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('Error in handleImageToImage:', error);
            const netError = 'Erreur réseau ou problème avec le service Image-vers-Image.';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur réseau Image-vers-Image");
        }
        hideAspectRatioSelector(); 
    }

    // --- Handler for Image Parsing (Image-to-Prompt via erweima3.com/api/ai/call) ---
    async function handleImageParsing(prompt, currentConversationMessages) {
        if (uploadedFileObjects.length === 0) {
            addMessageToChat("Veuillez d\'abord téléverser une image pour l\'analyse d\'image.", 'bot');
            return;
        }
        const selectedImage = uploadedFileObjects[0];

        addMessageToChat(`Analyse de l\'image... (Instructions supplémentaires : "${prompt || 'aucune'}")`, 'bot');
        currentConversationMessages.push({ sender: 'bot', text: `Analyse de l\'image...`, timestamp: Date.now() });

        const formData = new FormData();
        const google_id = localStorage.getItem('google_id');
        formData.append('google_id', google_id || '');
        formData.append('model_id', '4'); // Model ID for Qwen image analysis
        formData.append('img', selectedImage);
        formData.append('content', prompt || 'Décrivez cette image en détail.'); // User query or default instruction
        formData.append('size', getPixelSize(selectedAspectRatio)); // Added size parameter

        try {
            const response = await fetch('https://aa.jstang.cn/api/ai/call', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = `Erreur API d\'analyse d\'image : ${response.status} - ${errorText.substring(0,100)}`;
                addMessageToChat(errorMessage, 'bot');
                currentConversationMessages.push({ sender: 'bot', text: errorMessage, timestamp: Date.now() });
                appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur d\'analyse d\'image");
                return;
            }

            const data = await response.json();
            // Assuming the response for image parsing is in data.data or data.description or similar
            // You might need to adjust based on the actual API response structure for model_id 4
            console.log("Image Parsing API Response Data:", data); // Log the full response
            const analysisResult = data.data || data.text || data.description || "Impossible d\'extraire l\'analyse de la réponse API.";
            addMessageToChat(`Résultat de l\'analyse : ${analysisResult}`, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: `Analyse : ${analysisResult}`, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages);

        } catch (error) {
            console.error('Error in handleImageParsing:', error);
            const netError = 'Erreur réseau ou problème avec le service d\'analyse d\'image.';
            addMessageToChat(netError, 'bot');
            currentConversationMessages.push({ sender: 'bot', text: netError, timestamp: Date.now() });
            appendMessagesToCurrentChatOrStartNew(currentConversationMessages, "Erreur réseau d\'analyse d\'image");
        }
        hideAspectRatioSelector();
    }

    // Image Upload Functionality
    if (uploadImageBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true; // Allow multiple image uploads
        fileInput.style.display = 'none';

        uploadImageBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            let anImageWasUploaded = false;
            uploadedFileObjects = []; // Clear previous files before adding new ones
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    anImageWasUploaded = true;
                    uploadedFileObjects.push(file); // Store the File object
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        addImageToPreview(e.target.result, file.name);
                    };
                    reader.readAsDataURL(file);
                }
            }
            if (anImageWasUploaded) {
                showAspectRatioSelector(); // Show when an image is uploaded
            }
            fileInput.value = ''; 
        });
    }

    function addImageToPreview(src, fileName) {
        if (!imagePreviewContainer) return;

        // Limit number of previews if necessary, e.g., only allow one image for certain APIs
        if (currentUseCaseKey === 'image_to_image' || currentUseCaseKey === 'image_parsing') {
            if (imagePreviewContainer.children.length >= 1) {
                alert('Pour cette fonction, une seule image peut être traitée à la fois. La nouvelle image remplacera l\'ancienne.');
                imagePreviewContainer.innerHTML = ''; // Clear existing previews
                uploadedFileObjects = uploadedFileObjects.slice(-1); // Keep only the last added file object
            }
        }

        const previewDiv = document.createElement('div');
        previewDiv.classList.add('image-preview');
        previewDiv.title = fileName; // Show filename on hover

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Aperçu de l\'image';

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-img-btn');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = () => {
            previewDiv.remove();
        };

        previewDiv.appendChild(img);
        previewDiv.appendChild(deleteBtn);
        imagePreviewContainer.appendChild(previewDiv);
    }

    // Use Case Buttons Functionality
    if (useCaseButtons.length > 0 && chatInput) {
        useCaseButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentUseCaseKey = button.dataset.case; // Обновляем текущий сценарий
                currentSystemPrompt = systemPrompts[currentUseCaseKey] || systemPrompts.general; // Устанавливаем системную подсказку
                handleUseCaseSelection(currentUseCaseKey);
            });
        });
    }

    const promptSuggestionsArea = document.getElementById('prompt-suggestions-area');

    function handleUseCaseSelection(caseKey) {
        let aiWelcomeMessage = "";
        let suggestions = [];

        // Clear existing messages from messageArea before showing new use case
        if (messageArea) {
            messageArea.innerHTML = '';
            currentLoadedChatId = null; // Reset when a use case is selected (starts a new chat context)
        }

        switch (caseKey) {
            case 'general':
                aiWelcomeMessage = "Bonjour ! Je suis votre assistant général. Comment puis-je vous aider ?";
                suggestions = [
                    "Écrire un poème sur le printemps",
                    "Expliquer ce qu\'est un trou noir",
                    "Raconte-moi une blague"
                ];
                break;
            case 'education':
                aiWelcomeMessage = "Bonjour ! Je suis votre assistant pédagogique. Avez-vous des questions concernant vos études ?";
                suggestions = [
                    "Aidez-moi à comprendre la première loi de Newton",
                    "Comment puis-je améliorer mon anglais écrit ?",
                    "Expliquer le processus de photosynthèse"
                ];
                break;
            case 'translation':
                aiWelcomeMessage = "Salut ! Je suis votre assistant de traduction. Avec quelle langue puis-je vous aider aujourd\'hui ?";
                suggestions = [
                    "Traduire en français : Hello, how are you?",
                    "Traduire en anglais : 今天天气真好",
                    "¿Cómo se dice \"thank you\" en japonés?"
                ];
                break;
            case 'data_analysis':
                aiWelcomeMessage = "Bonjour ! Je suis votre assistant d\'analyse de données. Veuillez fournir des données ou décrire vos besoins d\'analyse.";
                suggestions = [
                    "Analyser les tendances de ces données de vente",
                    "Identifier les principales raisons du désabonnement des utilisateurs",
                    "Prédire les ventes de produits pour le prochain trimestre"
                ];
                break;
            case 'screenwriting':
                aiWelcomeMessage = "Bonjour ! Je suis votre partenaire d\'écriture de scénario. Avez-vous des idées d\'histoires passionnantes ?";
                suggestions = [
                    "Écrire le début d\'un film de science-fiction",
                    "Aidez-moi à trouver une intrigue pour un court métrage policier",
                    "Comment créer un personnage mémorable ?"
                ];
                break;
            case 'media_ops':
                aiWelcomeMessage = "Bonjour ! Je suis votre conseiller en opérations médiatiques. Besoin d\'idées de stratégie de contenu ou de promotion ?";
                suggestions = [
                    "Donnez-moi des titres accrocheurs pour les publications sur les réseaux sociaux",
                    "Comment élaborer un plan de promotion pour un nouveau produit ?",
                    "Écrire un article de blog sur un mode de vie sain"
                ];
                break;
            case 'image_parsing':
                aiWelcomeMessage = "Bonjour ! Je suis l\'IA d\'analyse d\'images. Veuillez téléverser une image, et j\'essaierai de comprendre son contenu.";
                suggestions = [
                    "Qu\'y a-t-il sur cette image ?",
                    "Identifier les principaux objets de l\'image",
                    "Décrire cette photo de paysage"
                ];
                break;
            case 'ai_drawing':
                aiWelcomeMessage = "Bonjour ! Je suis l\'assistant de dessin IA. Que souhaitez-vous dessiner ? Décrivez votre idée !";
                suggestions = [
                    "Dessiner un chat buvant du café sur la lune",
                    "Générer une scène nocturne de ville de style cyberpunk",
                    "Créer une peinture de paysage de style impressionniste"
                ];
                break;
            case 'image_to_image':
                aiWelcomeMessage = "Bonjour ! Je suis l\'IA image-vers-image. Veuillez téléverser une image et me dire comment vous souhaitez la transformer.";
                suggestions = [
                    "Transformer cette photo en style anime",
                    "Coloriser ce croquis",
                    "Convertir la scène de jour de l\'image en crépuscule"
                ];
                break;
            default:
                aiWelcomeMessage = "Bonjour ! Veuillez sélectionner un scénario ou me poser une question directement.";
                suggestions = ["Que puis-je faire pour vous ?", "Dites-moi vos besoins", "Commençons à discuter"];
        }

        addMessageToChat(aiWelcomeMessage, 'bot');
        chatInput.value = ''; // Clear chat input
        chatInput.placeholder = `Demandez à propos de "${document.querySelector(`.use-case-btn[data-case="${caseKey}"] .use-case-title`).textContent}"...`;

        // Display suggestions
        if (promptSuggestionsArea) {
            promptSuggestionsArea.innerHTML = ''; // Clear previous suggestions
            suggestions.forEach(text => {
                const suggBtn = document.createElement('button');
                suggBtn.classList.add('suggestion-btn');
                suggBtn.textContent = text;
                suggBtn.onclick = () => {
                    chatInput.value = text;
                    chatInput.focus();
                    // Optionally, send message directly or clear suggestions
                    // promptSuggestionsArea.innerHTML = ''; 
                };
                promptSuggestionsArea.appendChild(suggBtn);
            });
        }

        // Modify handleUseCaseSelection to show aspect ratio selector based on case
        const imageRelatedUseCases = ['image_parsing', 'ai_drawing', 'image_to_image'];
        if (imageRelatedUseCases.includes(caseKey)) {
            showAspectRatioSelector();
        } else {
            hideAspectRatioSelector();
        }
    }

    // --- Login Page Specifics (login.html) --- 
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            if (email && password) {
                // Simulate login
                alert('Tentative de connexion avec l\'e-mail : ' + email);
                // Redirect to chat page on successful login (for demo)
                // window.location.href = 'index.html'; 
            } else {
                alert('Veuillez remplir tous les champs.');
            }
        });
    }

    // --- Register Page Specifics (register.html) --- 
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                alert('Les mots de passe ne correspondent pas !');
                return;
            }
            if (username && email && password) {
                // Simulate registration
                alert('Tentative d\'inscription pour : ' + username + ' avec l\'e-mail : ' + email);
                // Redirect to login page on successful registration (for demo)
                // window.location.href = 'login.html'; 
            } else {
                alert('Veuillez remplir tous les champs.');
            }
        });
    }
    
    // --- Feedback Page Specifics (feedback.html) ---
    const reviewForm = document.getElementById('reviewForm');
    const reviewsSection = document.querySelector('.reviews-section');
    const avatarUploadInput = document.getElementById('reviewerAvatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    const customFileNameSpan = document.querySelector('.custom-file-name'); // Get the span for file name
    const deleteAvatarPreviewBtn = document.getElementById('deleteAvatarPreviewBtn'); // Get the delete button

    // Avatar Preview Logic
    if (avatarUploadInput && avatarPreview && deleteAvatarPreviewBtn) { // Ensure delete button exists
        avatarUploadInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.style.display = 'block';
                    if (deleteAvatarPreviewBtn) deleteAvatarPreviewBtn.style.display = 'inline-block'; // Show delete button
                }
                reader.readAsDataURL(file);
                if (customFileNameSpan) {
                    customFileNameSpan.textContent = file.name;
                }
            } else {
                avatarPreview.src = '#';
                avatarPreview.style.display = 'none';
                if (deleteAvatarPreviewBtn) deleteAvatarPreviewBtn.style.display = 'none'; // Hide delete button
                if (customFileNameSpan) {
                    customFileNameSpan.textContent = 'Aucun fichier choisi.';
                }
            }
        });

        // Event listener for the delete avatar preview button
        deleteAvatarPreviewBtn.addEventListener('click', function() {
            avatarPreview.src = '#';
            avatarPreview.style.display = 'none';
            deleteAvatarPreviewBtn.style.display = 'none';
            avatarUploadInput.value = ''; // Clear the file input
            if (customFileNameSpan) {
                customFileNameSpan.textContent = 'Aucun fichier choisi.';
            }
        });
    }

    // Function to create star string from rating value
    function getStars(rating) {
        const numStars = parseInt(rating);
        if (isNaN(numStars) || numStars <= 0) return 'N/D';
        return '⭐'.repeat(numStars);
    }

    if (reviewForm && reviewsSection) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const reviewerName = reviewForm.reviewerName.value;
            const avatarFile = avatarUploadInput ? avatarUploadInput.files[0] : null;
            const ratingProgramming = reviewForm.ratingProgramming.value;
            const ratingComprehension = reviewForm.ratingComprehension.value;
            const ratingImageProcessing = reviewForm.ratingImageProcessing.value;
            const reviewText = reviewForm.reviewText.value;
            const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD

            if (reviewerName && reviewText) {
                const newReviewCard = document.createElement('article');
                newReviewCard.classList.add('review-card');
                newReviewCard.style.transform = 'translateY(20px) scale(0.95)'; // Initial state for animation

                let ratingHTML = '';
                if (ratingProgramming > 0) ratingHTML += `<span>Programmation : ${getStars(ratingProgramming)}</span>`;
                if (ratingComprehension > 0) ratingHTML += `<span>Compréhension : ${getStars(ratingComprehension)}</span>`;
                if (ratingImageProcessing > 0) ratingHTML += `<span>Traitement d\'images : ${getStars(ratingImageProcessing)}</span>`;
                else if (ratingImageProcessing === "0") ratingHTML += `<span>Traitement d\'images : N/D</span>`;

                // Avatar logic
                if (avatarFile) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const avatarContent = `<img src="${event.target.result}" alt="avatar de ${reviewerName}">`;
                        newReviewCard.innerHTML = constructReviewCardHTML(reviewerName, currentDate, avatarContent, ratingHTML, reviewText);
                        reviewsSection.insertBefore(newReviewCard, reviewsSection.firstChild);
                    }
                    reader.readAsDataURL(avatarFile);
                } else {
                    const avatarLetter = reviewerName.charAt(0).toUpperCase() || 'U';
                    const avatarContent = `<span>${avatarLetter}</span>`;
                    newReviewCard.innerHTML = constructReviewCardHTML(reviewerName, currentDate, avatarContent, ratingHTML, reviewText);
                    reviewsSection.insertBefore(newReviewCard, reviewsSection.firstChild);
                }

                reviewForm.reset();
                if (avatarPreview) {
                    avatarPreview.src = '#';
                    avatarPreview.style.display = 'none';
                }
                if (deleteAvatarPreviewBtn) { // Hide delete button on form reset
                    deleteAvatarPreviewBtn.style.display = 'none';
                }
                if (customFileNameSpan) { // Reset custom file name display
                    customFileNameSpan.textContent = 'Aucun fichier choisi.';
                }
                alert('Merci pour votre commentaire ! Il a été ajouté en haut de la liste.');
            } else {
                alert('Veuillez indiquer votre nom et le contenu de votre commentaire.');
            }
        });
    }

    // Animated Review Cards Loop
    let currentReviewIndex = 0;
    const MAX_ANIMATED_REVIEWS = 5; // Limit the number of reviews in the animation cycle

    function animateReviewCardsLoop() {
        const allReviewCardsNodeList = reviewsSection ? reviewsSection.querySelectorAll('.review-card') : null;
        if (!allReviewCardsNodeList || allReviewCardsNodeList.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000); // Retry if cards appear later
            return;
        }
        
        const allReviewCards = Array.from(allReviewCardsNodeList);

        // 1. Reset ALL cards to their initial hidden state first.
        allReviewCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) scale(0.95)';
            // card.style.transition = 'none'; // Temporarily disable transition for immediate reset
        });

        const cardsToAnimateThisCycle = allReviewCards.slice(0, MAX_ANIMATED_REVIEWS);

        if (cardsToAnimateThisCycle.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000);
            return;
        }

        currentReviewIndex = 0; 
        
        // Use a microtask (like requestAnimationFrame or a 0ms timeout) to ensure the reset styles are applied
        // before we start adding the 'show' styles that trigger the transition.
        setTimeout(() => {
            // allReviewCards.forEach(card => {
            //     // card.style.transition = 'opacity 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)'; // Re-enable transition
            // });
            if (!reviewsSection) return; 
            // Re-fetch and re-slice in case the DOM changed during the brief timeout
            const currentCardsNodeList = reviewsSection.querySelectorAll('.review-card');
            if (!currentCardsNodeList || currentCardsNodeList.length === 0) {
                setTimeout(animateReviewCardsLoop, 4000);
                return;
            }
            const currentBatch = Array.from(currentCardsNodeList).slice(0, MAX_ANIMATED_REVIEWS);
             if (currentBatch.length === 0) {
                setTimeout(animateReviewCardsLoop, 4000);
                return;
            }
            showNextCardInBatch(currentBatch);
        }, 50); // A small delay like 50ms is often more reliable than 0ms for this purpose.
    }

    function showNextCardInBatch(batchToDisplay) { 
        if (!reviewsSection) return;

        if (!batchToDisplay || batchToDisplay.length === 0) {
            setTimeout(animateReviewCardsLoop, 4000); 
            return;
        }

        if (currentReviewIndex < batchToDisplay.length) { 
            const card = batchToDisplay[currentReviewIndex];
            if (card) { 
                card.style.opacity = '1';
                card.style.transform = 'translateY(0px) scale(1)';
            }
            currentReviewIndex++;
            setTimeout(() => showNextCardInBatch(batchToDisplay), 800); 
        } else {
            // Finished displaying this batch, wait then restart the main loop
            // The main loop will handle resetting all cards again.
            setTimeout(animateReviewCardsLoop, 4000);
        }
    }

    if (reviewsSection) {
        // Initial call to start the animation loop for reviews.
        // Cards are initially hidden by CSS, so the loop will animate them in.
        animateReviewCardsLoop(); 
    }

    // Placeholder for loading chat history (example)
    function loadChatHistory() {
        const historyListIndex = document.getElementById('history-list');
        const historyListFeedback = document.getElementById('history-list-feedback');
        const history = getChatHistory();

        // Add "Clear All History" button if it doesn't exist
        if (historyListIndex && !document.getElementById('clearAllHistoryBtn')) {
            const clearAllBtn = document.createElement('button');
            clearAllBtn.textContent = 'Effacer tout l\'historique';
            clearAllBtn.id = 'clearAllHistoryBtn';
            clearAllBtn.classList.add('clear-history-btn');
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ? Cette action est irréversible.')) {
                    saveChatHistory([]); // Save an empty array
                    if (messageArea) messageArea.innerHTML = ''; // Clear current chat display
                    addMessageToChat("L\'historique a été effacé.", "bot");
                }
            });
            // Insert before the history list (ul) or at the top of the sidebar-history-section
            const historySection = historyListIndex.closest('.sidebar-history-section');
            if (historySection) {
                historySection.insertBefore(clearAllBtn, historySection.firstChild);
            } else {
                 historyListIndex.parentNode.insertBefore(clearAllBtn, historyListIndex);
            }
        }
         // Do the same for feedback page if its history list exists
        if (historyListFeedback && !document.getElementById('clearAllHistoryBtnFeedback')) {
            const clearAllBtnFeedback = document.createElement('button');
            clearAllBtnFeedback.textContent = 'Effacer tout l\'historique';
            clearAllBtnFeedback.id = 'clearAllHistoryBtnFeedback';
            clearAllBtnFeedback.classList.add('clear-history-btn'); // Use same class for styling
            clearAllBtnFeedback.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ? Cette action est irréversible.')) {
                    saveChatHistory([]);
                     // No messageArea on feedback page, so just clear history
                }
            });
            const historySectionFeedback = historyListFeedback.closest('.sidebar-history-section');
             if (historySectionFeedback) {
                historySectionFeedback.insertBefore(clearAllBtnFeedback, historySectionFeedback.firstChild);
            } else {
                historyListFeedback.parentNode.insertBefore(clearAllBtnFeedback, historyListFeedback);
            }
        }


        function populateHistory(listElement) {
            if (!listElement) return;
            listElement.innerHTML = ''; // Clear existing items
            
            if (history.length === 0) {
                const noHistoryItem = document.createElement('li');
                noHistoryItem.textContent = 'Aucun historique pour le moment.';
                noHistoryItem.classList.add('no-history');
                listElement.appendChild(noHistoryItem);
                return;
            }

            history.slice().reverse().forEach(chat => { // Display newest first
                const listItem = document.createElement('li');
                listItem.classList.add('history-item');
                listItem.dataset.chatId = chat.id;

                const titleSpan = document.createElement('span');
                titleSpan.classList.add('history-title');
                titleSpan.textContent = chat.title || 'Discussion sans titre';
                titleSpan.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadConversation(chat.id);
                });

                const actionsDiv = document.createElement('div');
                actionsDiv.classList.add('history-item-actions');

                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '✏️'; // Pencil icon for rename
                renameBtn.title = 'Renommer';
                renameBtn.classList.add('history-action-btn', 'rename-btn');
                renameBtn.addEventListener('click', () => {
                    const newTitle = prompt('Saisir le nouveau titre de la discussion :', chat.title);
                    if (newTitle && newTitle.trim() !== '') {
                        renameConversation(chat.id, newTitle.trim());
                    }
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '🗑️'; // Trash icon for delete
                deleteBtn.title = 'Supprimer';
                deleteBtn.classList.add('history-action-btn', 'delete-btn');
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer "${chat.title}" ?`)) {
                        deleteConversation(chat.id);
                    }
                });

                actionsDiv.appendChild(renameBtn);
                actionsDiv.appendChild(deleteBtn);

                listItem.appendChild(titleSpan);
                listItem.appendChild(actionsDiv);
                listElement.appendChild(listItem);
            });
        }
        populateHistory(historyListIndex);
        populateHistory(historyListFeedback);
    }

    function loadConversation(chatId) {
        const history = getChatHistory();
        const conversation = history.find(c => c.id === chatId);

        if (!conversation) {
            addMessageToChat("Impossible de charger la discussion.", "bot");
            return;
        }

        currentLoadedChatId = conversation.id; // Set the current loaded chat ID

        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            // If not on the main chat page, redirect and pass a parameter to load it
            window.location.href = `index.html?loadChat=${chatId}`;
            return;
        }
        
        if (messageArea) {
            messageArea.innerHTML = ''; // Clear current chat
            conversation.messages.forEach(msg => {
                addMessageToChat(msg.text || "", msg.sender, msg.imageUrl || null);
            });
        }
    }

    function deleteConversation(chatId) {
        let history = getChatHistory();
        history = history.filter(c => c.id !== chatId);
        saveChatHistory(history);
    }

    function renameConversation(chatId, newTitle) {
        let history = getChatHistory();
        const conversation = history.find(c => c.id === chatId);
        if (conversation) {
            conversation.title = newTitle;
        }
        saveChatHistory(history);
    }

    loadChatHistory(); // Load history on page load

    // Custom Pointer Logic
    const customPointer = document.createElement('div');
    customPointer.setAttribute('id', 'custom-pointer');
    customPointer.innerHTML = '👆'; // Emoji pointer
    document.body.appendChild(customPointer);

    document.addEventListener('mousemove', (e) => {
        customPointer.style.left = e.pageX + 'px';
        customPointer.style.top = e.pageY + 'px';
    });

    // Hide default cursor on interactive elements if desired, or globally on body (see CSS)
    // document.querySelectorAll('button, a, input, textarea, .use-case-btn').forEach(el => {
    //     el.style.cursor = 'none'; 
    // });

    // --- Login Interception for Chat Functionality on index.html ---
    if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        const chatInputForLogin = document.getElementById('chatInput');
        const sendMessageBtnForLogin = document.getElementById('sendMessageBtn');
        const uploadImageBtnForLogin = document.getElementById('uploadImageBtn');

        const requireLoginAndRedirect = (event, elementToDisableTemporarily = null) => {
            if (!isLoggedIn()) {
                if (event) { 
                    event.preventDefault(); 
                    event.stopPropagation();
                }
                alert('Veuillez vous connecter pour utiliser les fonctionnalités du chat.');
                if (elementToDisableTemporarily && typeof elementToDisableTemporarily.setAttribute === 'function') {
                    elementToDisableTemporarily.setAttribute('disabled', 'true');
                }
                window.location.href = 'login.html';
                return false; 
            }
            // If logged in and element was disabled, re-enable it (though page redirect makes this less critical)
            if (elementToDisableTemporarily && typeof elementToDisableTemporarily.removeAttribute === 'function') {
                 elementToDisableTemporarily.removeAttribute('disabled');
            }
            return true; 
        };

        if (chatInputForLogin) {
            chatInputForLogin.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Pass chatInputForLogin to be potentially disabled if redirect occurs
                    if (!requireLoginAndRedirect(e, chatInputForLogin)) {
                        // Login required, redirect initiated
                    }
                }
            }, true); 

            chatInputForLogin.addEventListener('focus', (e) => {
                requireLoginAndRedirect(e, chatInputForLogin);
            });
        }

        if (sendMessageBtnForLogin) {
            sendMessageBtnForLogin.addEventListener('click', (e) => { 
                 requireLoginAndRedirect(e, sendMessageBtnForLogin);
            }, true); 
        }
        if (uploadImageBtnForLogin) {
            uploadImageBtnForLogin.addEventListener('click', (e) => { 
                 requireLoginAndRedirect(e, uploadImageBtnForLogin);
            }, true); 
        }
    }

    // Call initializers that depend on DOM being ready AND localStorage potentially being set by callbacks
    checkGoogleLoginCallback(); 
    updateLoginUI(); 

    // Check if we need to load a specific chat on page load (e.g., after redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const chatToLoad = urlParams.get('loadChat');
    if (chatToLoad && (window.location.pathname === '/index.html' || window.location.pathname === '/')) {
        // Ensure DOM is fully ready, especially messageArea
        // setTimeout(() => loadConversation(chatToLoad), 0); // Use timeout to ensure messageArea is available
        // A more robust way is to ensure loadConversation is called after DOMContentLoaded
        // Since this whole script is wrapped in DOMContentLoaded, it should be fine.
        // However, if loadChatHistory was populating things needed by loadConversation,
        // make sure order of operations is correct. `loadChatHistory` is called earlier.
        loadConversation(chatToLoad);
        // Clean the URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    // Attach Google login handlers to buttons on Login and Register pages
    const googleLoginButtons = document.querySelectorAll('.google-login-btn');
    googleLoginButtons.forEach(button => {
        button.addEventListener('click', handleGoogleLogin);
    });

    // Call specific page initializers if they exist
    if (window.location.pathname.endsWith('view-profile.html')) {
        populateUserProfilePage();
    }
});

function getPixelSize(ratio) {
    if (!ratio) return "1024*1024"; // Default if no ratio selected

    switch (ratio) {
        case "1:1": return "1024*1024";
        case "16:9": return "1344*768"; 
        case "9:16": return "768*1344"; 
        case "4:3": return "1024*768";
        case "3:4": return "768*1024";
        default: return "1024*1024"; // Fallback
    }
} 