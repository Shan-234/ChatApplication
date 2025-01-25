# Author: Shantanu Ingalagi <ingalag1@msu.edu>
from flask import current_app as app
from flask import render_template, redirect, request, session, url_for, copy_current_request_context
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
from .utils.database.database  import database
from werkzeug.datastructures   import ImmutableMultiDict
from pprint import pprint
import json
import random
import functools
from flask_app import socketio
from datetime import datetime, timezone

db = database()

def getFirstName():
    if 'first_name' in session:
        return db.reversibleEncrypt('decrypt', session['first_name'])
    return "Unknown"

@app.route('/')
def root():
    return redirect('/home')

@app.route('/home')
def home():
    return render_template('home.html', first_name=getFirstName())

@app.route('/sign_in')
def sign_in():
    return render_template('signin.html', first_name=getFirstName())

@app.route('/process_sign_in', methods = ['POST'])
def process_sign_in():
    inputData = request.json
    userData = db.authenticate(inputData['username'], inputData['password'])

    if userData:
        session['user_id'] = userData['user_id']
        session['first_name'] = db.reversibleEncrypt('encrypt', userData['first_name'])
        session['last_name'] = db.reversibleEncrypt('encrypt', userData['last_name'])
        session['username'] = db.reversibleEncrypt('encrypt', userData['username'])
        return {'success': 1}
    return {'reject': 0}

@app.route('/sign_up')
def sign_up():
    return render_template('signup.html', first_name=getFirstName())

@app.route('/process_sign_up', methods = ['POST'])
def process_sign_up():
    inputData = request.json
    return db.createUser(inputData['first_name'], inputData['last_name'], inputData['username'], inputData['password'])

@app.route('/sign_out')
def sign_out():
    session.clear()
    return redirect('/home')

@app.route('/chat')
def chat():
    if 'username' not in session:
        return redirect('/sign_in')
    
    pprint("User Id: " + str(session['user_id']))

    return render_template('chat.html', first_name=getFirstName(), chats_data=db.GetUserChats(session['user_id']))

@app.route('/add_chat', methods = ['POST'])
def add_chat():
    # Organize chat's data
    chatData = request.json
    chatName = chatData['name']
    chatMembers = chatData['members']
    memberIds = []

    # Validate list of given members and get their User ID
    for user in chatMembers:
        result = db.ValidateUser(username=user)
        if result:
            memberIds.append(result[0]['user_id'])
        else:
            return {'reject' : "User " + user + " does not exist!"}


    # Add the current user to the list of members as well
    memberIds.append(session['user_id'])

    # Store the group in the database and extract the group's ID
    chatId = db.createChatRoom(name=chatName)

    # Associate all given members with the group in the database
    for userId in memberIds:
        db.createMember(userId=userId, groupId=chatId)
    
    return {'success': chatId}

@app.route('/get_messages', methods = ['POST'])
def get_messages():
    chatId = request.json['chat_id']
    chatId = int(chatId)

    db.UpdateMessageCount(userId=session['user_id'], roomId=chatId)

    return {
        'messages': db.GetMessages(chatId=chatId),
        'user_id': session['user_id']
    }

@app.route('/get_members', methods = ['POST'])
def get_members():
    roomId = request.json['room_id']
    roomId = int(roomId)

    return db.GetMembers(roomId=roomId)

@socketio.on('joined')
def joined(data):
    join_room(data['room_name'])

    if data['room_name'] != "main":
        roomId = int(data['room_name'][data['room_name'].find("_") + 1:len(data['room_name'])])
        db.SetOnline(userId=session['user_id'], roomId=roomId)
    else:
        db.SetSocketId(userId=session['user_id'], socketId=request.sid)

@socketio.on('leave')
def leave(data):
    leave_room(data['room_name'])

    pprint("Leaving: " + data['room_name'])
    db.SetDisconnect(userId=session['user_id'], roomId=int(data['room_name'][data['room_name'].find("_") + 1:len(data['room_name'])]))
    

@socketio.on('disconnect')
def disconnect():
    db.SetDisconnect(userId=session['user_id'])

@socketio.on('send_message')
def send_message(data):
    room_name = data['room_name']
    messageData = {
        'message': data['message'],
        'sender_id': session['user_id'],
        'sender_username': db.reversibleEncrypt('decrypt', session['username'])
    }

    ################## Store the message in the database here ####################
    roomId = int(room_name[room_name.find("_") + 1:len(room_name)])
    db.createMessage(userId=session['user_id'], roomId=roomId, content=data['message'], time=datetime.now(timezone.utc))

    ################## Increase the no. of new messages for non-active group members in the database here ####################
    db.IncreaseMessageCount(roomId=roomId)

    ################## Emit 'receive_message' event to the chatroom and 'show_new_message' event to non-active users ##################
    nonActiveUsers = db.GetNonActiveUsers(roomId=roomId)

    pprint("Non-Active Users: " + str(nonActiveUsers))

    emit('receive_message', messageData, to=room_name, include_self=False)

    for user in nonActiveUsers:
        if user['socket_id'] and (user['socket_id'] != 'NULL'):
            print(str(session['username']) + " Message Count: " + str(db.GetMessageCount(userId=session['user_id'], roomId=roomId)))
            emit('increase_message_count', {
                'room_id': roomId
            }, to=user['socket_id'])

@socketio.on('save_message_count')
def save_message_count(data):
    roomId = data['room_id']
    newMsg = data['new_count']

    db.UpdateMessageCount(session['user_id'], roomId=roomId, newMsg=newMsg)

@socketio.on('change_chat_name')
def change_chat_name(data):
    roomId = int(data['room_id'])
    newName = data['room_new_name']

    db.UpdateRoomName(roomId=roomId, roomName=newName)
    emit('display_name_change', {
        'room_id': roomId,
        'new_name': newName
    }, room="main")

@socketio.on('add_member')
def add_member(data):
    roomId = int(data['room_id'])
    username = data['username']

    user = db.GetUser(username=username)
    
    if type(user) == str:
        return {'reject': user}
    
    roomMembers = db.GetMembers(roomId=roomId)

    if username in roomMembers:
        return {'reject': "User " + username + " is already in the group!"}
    
    db.createMember(userId=user['user_id'], groupId=roomId)
    
    emit('add_group', {
        'room_id': roomId,
        'room_name': data['room_name']
    }, to=user['socket_id'], include_self=False)

@socketio.on('leave_group')
def leave_group(data):
    leave_room("chat_" + data['room_id'])
    roomId = int(data['room_id'])

    db.RemoveMember(userId=session['user_id'], roomId=roomId)

    emit('show_notice', {
        'notice_msg': db.reversibleEncrypt('decrypt', session['username']) + " has left the group."
    }, to=("chat_" + data['room_id']))


    