import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDpjPHBPiLJLIlOfoENG9O1pMqt4X1hjDs",
    authDomain: "messagingportal-4da7a.firebaseapp.com",
    projectId: "messagingportal-4da7a",
    storageBucket: "messagingportal-4da7a.firebasestorage.app",
    messagingSenderId: "727884305223",
    appId: "1:727884305223:web:deb7b5fd14c2c5156fb262",
    measurementId: "G-4MWYXL2F3Z"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentUserId = null;
let currentRecipientId = null;

function generateUserId(username) {
    return `${username}-${Math.floor(Math.random() * 10000)}`;
}

window.registerUser = function () {
    const username = document.getElementById("username").value.trim();
    if (username) {
        currentUserId = generateUserId(username);
        set(ref(database, 'users/' + currentUserId), {
            username: username
        }).then(() => {
            document.getElementById("uniqueIdDisplay").innerHTML = `Your Unique ID: <strong>${currentUserId}</strong>`;
            document.getElementById("copyButton").style.display = "inline-block";
            document.getElementById("register").style.display = "none";
            document.getElementById("chat").style.display = "block";
        });
    } else {
        alert("Please enter a username.");
    }
}

window.loginUser = function () {
    const userId = document.getElementById("loginId").value.trim();
    if (userId) {
        currentUserId = userId;
        get(ref(database, 'users/' + currentUserId)).then((snapshot) => {
            if (snapshot.exists()) {
                document.getElementById("uniqueIdDisplay").innerHTML = `Your Unique ID: <strong>${currentUserId}</strong>`;
                document.getElementById("copyButton").style.display = "inline-block";
                document.getElementById("login").style.display = "none";
                document.getElementById("chat").style.display = "block";
                loadConversations();
            } else {
                alert("User not found. Please check your ID.");
            }
        });
    } else {
        alert("Please enter your unique ID.");
    }
}

window.copyUserId = function () {
    const uniqueId = document.getElementById("uniqueIdDisplay").innerText;
    navigator.clipboard.writeText(uniqueId.replace('Your Unique ID: ', '').trim()).then(() => {
        alert("Unique ID copied to clipboard!");
    });
}

window.sendMessage = function () {
    const recipientId = document.getElementById("recipientId").value.trim();
    const messageText = document.getElementById("message").value.trim();
    if (recipientId && messageText) {
        currentRecipientId = recipientId;
        const message = {
            sender: currentUserId,
            text: messageText,
            timestamp: Date.now()
        };

        push(ref(database, 'messages/' + currentUserId + '/' + currentRecipientId), message)
            .then(() => {
                push(ref(database, 'messages/' + currentRecipientId + '/' + currentUserId), message);
                document.getElementById("message").value = "";
            })
            .catch(err => console.error("Error sending message: ", err));
    } else {
        alert("Please enter both recipient ID and a message.");
    }
}

function listenForMessages(userId, recipientId) {
    onChildAdded(ref(database, 'messages/' + userId + '/' + recipientId), (snapshot) => {
        const message = snapshot.val();
        const messagesDiv = document.getElementById("messages");
        const messageElement = document.createElement("div");

        if (message) {
            messageElement.classList.add(message.sender === currentUserId ? "message-sender" : "message-receiver");
            messageElement.innerText = `${message.sender === currentUserId ? "You" : message.sender}: ${message.text}`;
            messagesDiv.appendChild(messageElement);
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function loadConversations() {
    get(ref(database, 'messages/' + currentUserId)).then((snapshot) => {
        if (snapshot.exists()) {
            const recipients = Object.keys(snapshot.val());
            const conversationList = document.getElementById("conversationList");
            conversationList.innerHTML = '';
            recipients.forEach((recipientId) => {
                const conversationItem = document.createElement("div");
                conversationItem.innerText = `Conversation with ${recipientId}`;
                conversationItem.classList.add("conversation-item");
                conversationItem.onclick = () => {
                    currentRecipientId = recipientId;
                    document.getElementById("recipientId").value = recipientId;
                    loadMessages(recipientId);
                };
                conversationList.appendChild(conversationItem);
            });
        }
    });
}

function loadMessages(recipientId) {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = '';

    get(ref(database, 'messages/' + currentUserId + '/' + recipientId)).then((snapshot) => {
        if (snapshot.exists()) {
            const messages = snapshot.val();
            Object.values(messages).forEach((message) => {
                const messageElement = document.createElement("div");
                messageElement.classList.add(message.sender === currentUserId ? "message-sender" : "message-receiver");
                messageElement.innerText = `${message.sender === currentUserId ? "You" : message.sender}: ${message.text}`;
                messagesDiv.appendChild(messageElement);
            });
        }
    });
}

window.startListening = function () {
    listenForMessages(currentUserId, currentRecipientId);
    listenForMessages(currentRecipientId, currentUserId);
}
