document.addEventListener("DOMContentLoaded", () => {
    const chatFab = document.getElementById("chatFabActivationTrigger");
    const chatWindow = document.getElementById("chatEngineWindow");
    const closeBtn = document.getElementById("closeChatTrigger");
    const inputField = document.getElementById("chatInputControl");
    const sendBtn = document.getElementById("sendChatPayloadTrigger");
    const displayFeed = document.getElementById("chatMessageDisplay");

    //const API_ENDPOINT = "http://127.0.0.1:5000/api/chat";
// Change this line inside your app.js:
const API_ENDPOINT = "http://localhost:5000/api/chat";
    if (chatFab && chatWindow && closeBtn) {
        
        const toggleChatWindow = () => {
            const isHidden = chatWindow.style.display === "none" || chatWindow.style.display === "";
            if (isHidden) {
                chatWindow.style.display = "flex";
                setTimeout(() => chatWindow.classList.add("window-active"), 10);
            } else {
                chatWindow.classList.remove("window-active");
                setTimeout(() => chatWindow.style.display = "none", 250);
            }
        };

        chatFab.addEventListener("click", toggleChatWindow);
        closeBtn.addEventListener("click", toggleChatWindow);

        const createBubble = (text, type) => {
            const bubble = document.createElement("div");
            bubble.className = `chat-bubble ${type}-bubble`;
            bubble.textContent = text;
            displayFeed.appendChild(bubble);
            displayFeed.scrollTop = displayFeed.scrollHeight;
        };

        const dispatchMessage = async () => {
            const query = inputField.value.trim();
            if (!query) return;

            createBubble(query, "client");
            inputField.value = "";

            // Create temporary loading asset indicator
            const loadingBubble = document.createElement("div");
            loadingBubble.className = "chat-bubble ai-bubble";
            loadingBubble.textContent = "Analyzing requirements...";
            displayFeed.appendChild(loadingBubble);
            displayFeed.scrollTop = displayFeed.scrollHeight;

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: query })
                });

                // JavaScript correct native data decryption method
                const data = await response.json();
                loadingBubble.remove();

                if (data.reply) {
                    createBubble(data.reply, "ai");
                } else if (data.error) {
                    createBubble(`Server Configuration Alert: ${data.error}`, "system");
                }
            } catch (error) {
                loadingBubble.remove();
                createBubble("Unable to establish communication with the backend service.", "system");
                console.error("Connection Error: ", error);
            }
        };

        sendBtn.addEventListener("click", dispatchMessage);
        inputField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") dispatchMessage();
        });
    }
});