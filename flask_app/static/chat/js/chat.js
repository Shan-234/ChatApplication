let memberCnt = 2;
let currentRoomId = null;
let activeMemberInput = null;
let latestDates = {};

const DayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const socketUrl = window.location.origin;
var socket = io.connect(socketUrl);

console.log(socketUrl);

/**
 * OnClick Functions
*/

const ShowAddDialog = (event) => {
    document.getElementById("add_chat_dialog").showModal();
};

const ResetAddDialog = () => {
    document.getElementById("add_chat_dialog").innerHTML = `
    <label for="chat_name">Select a name for your chat:</label>
    <br>
    <input id="chat_name" class="info-input" type="text" placeholder="Write the name here..."/>

    <br>
    <br>

    <h3>Your chat must have at least one more member!</h3>
    <br>
    <div id="members">
        <input type="text" class="info-input" placeholder="Member 1 Username here..."/>
        <br>
        <br>
    </div>
    <button class="add-button" onclick="AddMember()">+ Add Member</button>

    <br>
    <br>

    <button class="add-button" onclick="OnAddChat(event)">Save</button>
    <button class="add-button" onclick="OnCancel(event)">Cancel</button>
    <p id="error_message"></p>
    `;
};

const ResetEditDialog = () => {
    document.getElementById("edit_chat_dialog").innerHTML = `
    <label for="edit_chat_name"><h3>Chat Name:</h3></label>
    <br>
    <input id="edit_chat_name" class="info-input" type="text" placeholder="Write the name here..." disabled/>

    <br>
    <br>
    
    <button id="edit_save" class="add-button" onclick="OnEditSave(event)">Edit</button>

    <br>
    <br>

    <h3>Chat Members:</h3>
    <ol id="edit_members">
    </ol>

    <br>
    <br>

    <button id="edit_close" class="add-button" onclick="OnCancel(event)">Close</button>
    `;
};

const ResetMemberDialog = () => {
    document.getElementById("add_member_dialog").innerHTML = `
    <h3>Chat Members:</h3>
    <ol id="add_members">
    </ol>
    <button id="add_member" class="add-button" onclick="OnAdd(event)">+ Add Member</button>
    
    <br>
    <br>

    <button id="close_button" class="add-button" onclick="OnCancel(event)">Close</button>
    `;
};

const AddMember = () => {
    let memberInput = document.createElement("input");
    memberInput.type = "text";
    memberInput.placeholder = "Member " + memberCnt + " Username Here...";
    memberInput.className = "info-input";
    document.getElementById("members").appendChild(memberInput);
    document.getElementById("members").appendChild(document.createElement("br"));
    document.getElementById("members").appendChild(document.createElement("br"));
    memberCnt++;
};

const OnCancel = (event) => {
    const dialogId = event.target.parentElement.id;

    if (dialogId === "add_chat_dialog") {
        ResetAddDialog();
        document.getElementById("add_chat_dialog").close();
    } else if (dialogId === "edit_chat_dialog") {
        ResetEditDialog();
        document.getElementById("edit_chat_dialog").close();
    } else if (dialogId === "add_member_dialog") {
        ResetMemberDialog();
        activeMemberInput = null;
        document.getElementById("add_member_dialog").close();
    } else {
        document.getElementById("leave_chat_dialog").close();
    }
};

const OnChat = (event) => {
    event.preventDefault();

    let chatId = event.target.id;

    if ((chatId.indexOf("_name") >= 0) || (chatId.indexOf("_new_msg") >= 0)) {
        chatId = event.target.parentElement.id;
    }

    const chatName = document.getElementById(chatId + "_name").textContent;

    document.getElementById("chat_area").innerHTML = `
    <div id="chat_info" class="chat-name">
        <h3 id="chat_info_name">${ chatName }</h3>
        <div class="chat-buttons">
            <button class="add-button" onclick="OnGroupInfo(event)">Group Info</button>
            <button class="add-button" onclick="OnAddMember(event)">Add Members</button>
            <button class="add-button" onclick="OnLeaveChat(event)">Leave Chat</button>
        </div>
    </div>
    <hr class="separation-line">
    <div id="messages">
    </div>
    <hr class="separation-line">
    <div class="input-area">
        <input id="demo_input" type="text" placeholder="Type Your Message..."/>
        <button id="send_button" onclick="OnSend(event)">
            <img id="send_img" src="../static/home/images/send_icon.png"/>
        </button>
    </div>
    `;

    jQuery.ajax({
        url: "/get_messages",
        data: JSON.stringify({
            'chat_id': chatId.substring((chatId.indexOf("_") + 1), chatId.length)
        }),
        contentType: "application/json",
        type: "POST",
        success: function(messagesData) {
            if (messagesData) {
                console.log(messagesData);
                const messages = messagesData['messages'];
                const userId = messagesData['user_id'];
                let currentDate = null;

                for (let i = 0; i < messages.length; i++) {
                    const message = messages[i];
                    let messageDiv = document.createElement("div");

                    const timestamp = new Date(message['send_time']);
                    const messageDate = timestamp.toLocaleDateString("en-US", { day: "numeric" }) + " " + 
                                        timestamp.toLocaleDateString("en-US", { month: "short" }) + " " + 
                                        timestamp.toLocaleDateString("en-US", { year: "numeric" });
                    const messageTime = timestamp.toLocaleTimeString();
                    const messageDay = DayNames[timestamp.getUTCDay()];

                    if (messageDate !== currentDate) {
                        let dateDiv = document.createElement("div");
                        dateDiv.className = "notice-message";
                        dateDiv.innerHTML = `
                        <p>${messageDay}, ${messageDate}</p>
                        `;
                        document.getElementById("messages").appendChild(dateDiv);
                        currentDate = messageDate;
                        latestDates[chatId] = currentDate;
                    }
                    
                    if (message['sender_id'] === userId) {
                        messageDiv.className = "own-message";
                        messageDiv.innerHTML = `
                        <strong><i>${messageTime}</i><strong>
                        <p>${message['content']}</p>
                        `;
                    } else {
                        messageDiv.className = "reply-message";
                        messageDiv.innerHTML = `
                        <strong><i>${message['sender_username']} at ${messageTime}</i><strong>
                        <p>${message['content']}</p>
                        `;
                    }

                    document.getElementById("messages").appendChild(messageDiv);
                }

                document.getElementById("messages").scrollTo({
                    top: document.getElementById("messages").scrollHeight,
                    behavior: 'smooth'
                });
            }

            if (currentRoomId) {
                socket.emit('leave', {
                    'room_name': currentRoomId
                });
            }

            currentRoomId = chatId;

            socket.emit('joined', {
                'room_name': currentRoomId
            });

            document.getElementById(chatId + "_new_msg").textContent = "No new messages";
            document.getElementById(chatId + "_new_msg").className = null;
        }
    });
};

const OnAddChat = (event) => {
    let members = [];
    let missingMembers = false;
    const inputs = document.getElementById("members").querySelectorAll("input");
    inputs.forEach(input => {
        if (input.value) {
            members.push(input.value);
        } else {
            missingMembers = true;
        }
    });

    const inputData = {
        'name': document.getElementById("chat_name").value,
        'members': members
    };

    if (!inputData['name']) {
        document.getElementById("error_message").textContent = "A group name must be provided!";
        return;
    }

    if (!members.length) {
        document.getElementById("error_message").textContent = "At least one other group member must be provided!";
        return;
    }

    if (missingMembers) {
        document.getElementById("error_message").textContent = "All members' usernames must be provided!";
        return;
    }

    jQuery.ajax({
        url: "/add_chat",
        data: JSON.stringify(inputData),
        contentType: "application/json",
        type: "POST",
        success: function(result) {
            if ('success' in result) {
                let chat = document.createElement("div");
                chat.id = "chat_" + result['success'];
                chat.className = "chat-element";
                chat.onclick = OnChat;
                chat.innerHTML = `
                <h3 id=${chat.id + "_name"}>${inputData['name']}</h3>
                <p id=${chat.id + "_new_msg"}>No new messages</p>
                `;
                document.getElementById("chat_list").appendChild(chat);
                latestDates[chat.id] = null;
                ResetAddDialog();
                document.getElementById("add_chat_dialog").close();
            } else {
                document.getElementById("error_message").textContent = result['reject'];
            }
        }
    });
};

const OnSend = (event) => {
    const message = document.getElementById("demo_input").value;
    const timestamp = new Date();
    const messageDate = timestamp.toLocaleDateString("en-US", { day: "numeric" }) + " " + 
                        timestamp.toLocaleDateString("en-US", { month: "short" }) + " " + 
                        timestamp.toLocaleDateString("en-US", { year: "numeric" });
    const messageTime = timestamp.toLocaleTimeString();
    const messageDay = DayNames[timestamp.getUTCDay()];

    if (messageDate !== latestDates[currentRoomId]) {
        let dateDiv = document.createElement("div");
        dateDiv.className = "notice-message";
        dateDiv.innerHTML = `
        <p>${messageDay}, ${messageDate}</p>
        `;
        document.getElementById("messages").appendChild(dateDiv);
        latestDates[currentRoomId] = messageDate;
    }

    let messageDiv = document.createElement("div");
    messageDiv.className = "own-message";
    messageDiv.innerHTML = `
    <strong><i>${messageTime}</i><strong>
    <br>
    <p>${message}</p>
    `;
    document.getElementById("messages").appendChild(messageDiv);
    document.getElementById("demo_input").value = "";

    const messageArea = document.getElementById("messages");
    messageArea.scrollTo({
        top: messageArea.scrollHeight,
        behavior: 'smooth'
    });

    socket.emit('send_message', {
        'room_name': currentRoomId,
        'message': message
    });
};

const OnGroupInfo = (event) => {
    document.getElementById("edit_chat_dialog").showModal();
    document.getElementById("edit_chat_name").value = document.getElementById(currentRoomId + "_name").textContent;

    jQuery.ajax({
        url: "/get_members",
        data: JSON.stringify({
            'room_id': currentRoomId.substring(currentRoomId.indexOf("_") + 1, currentRoomId.length)
        }),
        contentType: "application/json",
        type: "POST",
        success: function(members) {
            for (let i = 0; i < members.length; i++) {
                let member = document.createElement("li");
                member.textContent = members[i];
                document.getElementById("edit_members").appendChild(member);
            }
        }
    });
};

const OnAddMember = (event) => {
    document.getElementById("add_member_dialog").showModal();

    jQuery.ajax({
        url: "/get_members",
        data: JSON.stringify({
            'room_id': currentRoomId.substring(currentRoomId.indexOf("_") + 1, currentRoomId.length)
        }),
        contentType: "application/json",
        type: "POST",
        success: function(members) {
            for (let i = 0; i < members.length; i++) {
                let member = document.createElement("li");
                member.textContent = members[i];
                document.getElementById("add_members").appendChild(member);
            }
        }
    });
};

const OnLeaveChat = (event) => {
    document.getElementById("leave_chat_dialog").showModal();
};

const OnConfirmLeave = (event) => {
    document.getElementById('chat_area').innerHTML = null;
    document.getElementById("chat_list").removeChild(document.getElementById(currentRoomId));
    socket.emit('leave_group', {
        'room_id': currentRoomId.substring(5, currentRoomId.length)
    });
    delete latestDates[currentRoomId];
    currentRoomId = null;
    document.getElementById("leave_chat_dialog").close();
};

const OnEditSave = (event) => {
    console.log(document.getElementById("edit_save"));
    const buttonText = document.getElementById("edit_save").textContent;

    if (buttonText === "Edit") {
        document.getElementById("edit_chat_name").removeAttribute('disabled');
        document.getElementById("edit_save").textContent = "Save";
    } else {
        if (!document.getElementById("edit_chat_name").value) {
            document.getElementById("edit_error_message").textContent = "A group name must be provided!";
            return;
        }
        socket.emit('change_chat_name', {
            'room_id': currentRoomId.substring(5, currentRoomId.length),
            'room_new_name': document.getElementById("edit_chat_name").value
        });

        document.getElementById("edit_chat_name").disabled = true;
        document.getElementById("edit_save").textContent = "Edit";
    }
};

const OnAdd = (event) => {
    const buttonText = document.getElementById("add_member").textContent;

    if (buttonText === "+ Add Member") {
        let members = document.getElementById("add_members");
        let newMember = document.createElement("li");
        newMember.innerHTML = `
        <input type="text" class="info-input" placeholder="Member Username here..." />
        `;
        members.appendChild(newMember);
        document.getElementById("add_member").textContent = "Save";
        activeMemberInput = newMember;
    } else {
        console.log(activeMemberInput);
        const memberUsername = activeMemberInput.querySelectorAll("input")[0].value;

        if (!memberUsername) {
            document.getElementById("member_error_message").textContent = "Please provide the username of each member."
            return;
        }

        socket.emit('add_member', {
            'room_id': currentRoomId.substring(5, currentRoomId.length),
            'room_name': document.getElementById(currentRoomId + "_name").textContent,
            'username': memberUsername
        });

        document.getElementById("add_members").removeChild(activeMemberInput);
        
        const newMember = document.createElement("li");
        newMember.textContent = memberUsername;
        document.getElementById("add_members").appendChild(newMember);
        document.getElementById("add_member").textContent = "+ Add Member";
    }
};

/**
 * WebSocket Signal Handlers
*/

socket.on('connect', () => {
    socket.emit('joined', {
        'room_name': "main"
    });
});

socket.on('receive_message', (messageData) => {
    console.log("Received A Message!");
    const timestamp = new Date();
    const messageDate = timestamp.toLocaleDateString("en-US", { day: "numeric" }) + " " + 
                        timestamp.toLocaleDateString("en-US", { month: "short" }) + " " + 
                        timestamp.toLocaleDateString("en-US", { year: "numeric" });
    const messageTime = timestamp.toLocaleTimeString();
    const messageDay = DayNames[timestamp.getUTCDay()];

    if (messageDate !== latestDates[currentRoomId]) {
        let dateDiv = document.createElement("div");
        dateDiv.className = "notice-message";
        dateDiv.innerHTML = `
        <p>${messageDay}, ${messageDate}</p>
        `;
        document.getElementById("messages").appendChild(dateDiv);
        latestDates[currentRoomId] = messageDate;
    }

    let messageDiv = document.createElement("div");
    messageDiv.className = "reply-message";
    messageDiv.innerHTML = `
    <strong><i>${messageData['sender_username']} at ${messageTime}</i><strong>
    <br>
    <p>${messageData['message']}</p>
    `;
    document.getElementById("messages").appendChild(messageDiv);
});

socket.on('increase_message_count', (data) => {
    const chatId = "chat_" + data['room_id'] + "_new_msg";
        
    if (document.getElementById(chatId).textContent === "No new messages") {
        document.getElementById(chatId).textContent = "1 new message";
    } else {
        let count = document.getElementById(chatId).textContent.substring(0, document.getElementById(chatId).textContent.indexOf(" "));
        count = parseInt(count, 10);
        count++;
        document.getElementById(chatId).textContent = count + " new messages";
        socket.emit('save_message_count', {
            'room_id': data['room_id'],
            'new_count': count
        });
    }

    document.getElementById(chatId).className = "new-msg";
});

socket.on('display_name_change', (data) => {
    if (document.getElementById("chat_" + data['room_id'])) {
        document.getElementById("chat_" + data['room_id'] + "_name").textContent = data['new_name'];
        
        if (currentRoomId.substring(5, currentRoomId.length) === data['room_id'].toString()) {
            document.getElementById("chat_info_name").textContent = data['new_name'];
        }
    }
});

socket.on('add_group', (data) => {
    let newRoom = document.createElement("div");
    newRoom.id = "chat_" + data['room_id'];
    newRoom.className = "chat-element";
    newRoom.onclick = OnChat;
    newRoom.innerHTML = `
    <h3 id="chat_${data['room_id']}_name">${data['room_name']}</h3>
    <p id="chat_${data['room_id']}_new_msg">No new messages</p>
    `;
    document.getElementById("chat_list").appendChild(newRoom);
});

socket.on('show_notice', (data) => {
    console.log("Notice has been received!");

    const message = data['notice_msg'];

    let noticeDiv = document.createElement("div");
    noticeDiv.className = "notice-message";
    noticeDiv.innerHTML = `
    <p>${message}</p>
    `;

    document.getElementById("messages").appendChild(noticeDiv);
});