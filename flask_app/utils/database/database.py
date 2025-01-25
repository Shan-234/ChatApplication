import mysql.connector
import glob
import json
import csv
from io import StringIO
import itertools
import hashlib
import os
import cryptography
from cryptography.fernet import Fernet
from math import pow

class database:

    def __init__(self, purge = False):

        # Grab information from the configuration file
        self.database       = 'db'
        self.host           = '127.0.0.1'
        self.user           = 'master'
        self.port           = 3306
        self.password       = 'master'
        self.tables         = ['messages', 'members', 'chatrooms', 'users']
        
        # NEW IN HW 3-----------------------------------------------------------------
        self.encryption     =  {   'oneway': {'salt' : b'averysaltysailortookalongwalkoffashortbridge',
                                                 'n' : int(pow(2,5)),
                                                 'r' : 9,
                                                 'p' : 1
                                             },
                                'reversible': { 'key' : '7pK_fnSKIjZKuv_Gwc--sZEMKn2zc8VvD6zS96XcNHE='}
                                }
        #-----------------------------------------------------------------------------

    def query(self, query = "SELECT * FROM users", parameters = None):

        cnx = mysql.connector.connect(host     = self.host,
                                      user     = self.user,
                                      password = self.password,
                                      port     = self.port,
                                      database = self.database,
                                      charset  = 'latin1'
                                     )


        if parameters is not None:
            cur = cnx.cursor(dictionary=True)
            cur.execute(query, parameters)
        else:
            cur = cnx.cursor(dictionary=True)
            cur.execute(query)

        # Fetch one result
        row = cur.fetchall()
        cnx.commit()

        if "INSERT" in query:
            cur.execute("SELECT LAST_INSERT_ID()")
            row = cur.fetchall()
            cnx.commit()
        cur.close()
        cnx.close()
        return row
    
    def createTables(self, purge=False, command_path="flask_app/database/"):
        with open(command_path + "users.sql", 'r') as file:
            usersCommand = file.read()
        with open(command_path + "chatrooms.sql", 'r') as file:
            roomsCommand = file.read()
        with open(command_path + "members.sql", 'r') as file:
            membersCommand = file.read()
        with open(command_path + "messages.sql", 'r') as file:
            messagesCommand = file.read()
        
        self.query(usersCommand)
        self.query(roomsCommand)
        self.query(membersCommand)
        self.query(messagesCommand)
    
    def createUser(self, firstName="owner", lastName="owner", username="owner", password="password"):
        selectCommand = """
        SELECT * FROM users
        WHERE username = %s
        """

        result = self.query(selectCommand, parameters=[username])

        if result:
            return "Username Already Exists. Pick Another Username."
        
        insertCommand = """
        INSERT INTO users (first_name, last_name, username, password)
        VALUES (%s, %s, %s, %s);
        """
        selectCommand = """
        SELECT * FROM users
        WHERE user_id = %s
        """

        userId = self.query(insertCommand, parameters=[firstName, lastName, username, self.onewayEncrypt(password)])[0]['LAST_INSERT_ID()']
        return self.query(selectCommand, parameters=[userId])
    

    def createChatRoom(self, name="Untitled"):
        insertCommand = """
        INSERT INTO chatrooms (name)
        VALUES (%s)
        """

        return self.query(insertCommand, parameters=[name])[0]['LAST_INSERT_ID()']
    
    def createMember(self, userId=None, groupId=None):
        insertCommand = """
        INSERT INTO members (user_id, room_id, new_msg, is_online)
        VALUES (%s, %s, %s, %s)
        """

        self.query(insertCommand, parameters=[userId, groupId, 0, False])

        selectCommand = """
        SELECT * FROM members
        """

        print(self.query(selectCommand))
    
    def createMessage(self, userId=None, roomId=None, content="Hello", time=None):
        insertCommand = """
        INSERT INTO messages (sender_id, room_id, content, timestamp)
        VALUES (%s, %s, %s, %s)
        """

        self.query(insertCommand, parameters=[userId, roomId, content, time])
    
    def IncreaseMessageCount(self, roomId=None):
        updateCommand = """
        UPDATE members
        SET new_msg = new_msg + 1
        WHERE room_id = %s AND is_online = FALSE
        """

        print(self.query(updateCommand, parameters=[roomId]))
    
    def UpdateMessageCount(self, userId=None, roomId=None, newMsg=0):
        updateCommand = """
        UPDATE members
        SET new_msg = %s
        WHERE user_id=%s AND room_id = %s
        """

        self.query(updateCommand, parameters=[newMsg, userId, roomId])
    
    def GetNonActiveUsers(self, roomId=None):
        result = []

        selectCommand = """
        SELECT * FROM members
        WHERE room_id = %s AND is_online = FALSE
        """

        users = self.query(selectCommand, parameters=[roomId])

        for user in users:
            selectCommand = """
            SELECT * FROM users
            WHERE user_id = %s
            """

            result.append(self.query(selectCommand, parameters=[user['user_id']])[0])
        
        return result
    
    def GetUser(self, username=None):
        selectCommand = """
        SELECT * FROM users
        WHERE username = %s
        """

        results = self.query(selectCommand, parameters=[username])

        if results:
            return results[0]
        return "User " + username + " doesn't exist!"


    def GetMessageCount(self, userId=None, roomId=None):
        selectCommand = """
        SELECT * FROM members
        WHERE user_id = %s AND room_id = %s
        """

        return self.query(selectCommand, parameters=[userId, roomId])[0]
    
    def GetUserChats(self, userId=None):
        result = []

        selectCommand = """
        SELECT * FROM members
        WHERE user_id = %s
        """

        memberData = self.query(selectCommand, parameters=[userId])

        print("Member Data: " + str(memberData))

        for i in range(len(memberData)):
            roomId = memberData[i]['room_id']

            selectCommand = """
            SELECT * FROM chatrooms
            WHERE room_id = %s
            """

            roomData = self.query(selectCommand, parameters=[roomId])[0]

            result.append({
                'room_id': roomId,
                'room_name': roomData['name'],
                'new_msg': memberData[i]['new_msg']
            })
        
        return result
    
    def GetMessages(self, chatId=None):
        selectCommand = """
        SELECT * FROM messages
        WHERE room_id = %s
        """

        messagesData = self.query(selectCommand, parameters=[chatId])
        result = []
        selectCommand = """
        SELECT * FROM users
        WHERE user_id = %s
        """

        for i in range(len(messagesData)):
            result.append({
                'sender_id': messagesData[i]['sender_id'],
                'sender_username': self.query(selectCommand, parameters=[messagesData[i]['sender_id']])[0]['username'],
                'content': messagesData[i]['content'],
                'send_time': messagesData[i]['timestamp']
            })
        
        return result
    
    def GetMembers(self, roomId=None):
        result = []

        selectCommand = """
        SELECT * FROM members
        WHERE room_id = %s
        """

        members = self.query(selectCommand, parameters=[roomId])

        for member in members:
            selectCommand = """
            SELECT * FROM users
            WHERE user_id = %s
            """

            result.append(self.query(selectCommand, parameters=[member['user_id']])[0]['username'])
        
        return result

    
    def SetOnline(self, userId=None, roomId=None):
        updateCommand = """
        UPDATE members
        SET is_online = TRUE
        WHERE user_id = %s AND room_id = %s
        """

        self.query(updateCommand, parameters=[userId, roomId])
    
    def SetDisconnect(self, userId=None, roomId=None):
        if roomId:
            updateCommand = """
            UPDATE members
            SET is_online = FALSE
            WHERE user_id = %s AND room_id = %s
            """

            self.query(updateCommand, parameters=[userId, roomId])
        else:
            updateCommand = """
            UPDATE members
            SET is_online = FALSE
            WHERE user_id = %s
            """

            self.query(updateCommand, parameters=[userId])
    
    def SetSocketId(self, userId=None, socketId=None):
        updateCommand = """
        UPDATE users
        SET socket_id = %s
        WHERE user_id = %s
        """

        self.query(updateCommand, parameters=[socketId, userId])
    
    def UpdateRoomName(self, roomId=None, roomName=None):
        updateCommand = """
        UPDATE chatrooms
        SET name = %s
        WHERE room_id = %s
        """

        self.query(updateCommand, parameters=[roomName, roomId])
    
    def RemoveMember(self, userId=None, roomId=None):
        deleteCommand = """
        DELETE FROM members
        WHERE user_id = %s AND room_id = %s
        """

        self.query(deleteCommand, parameters=[userId, roomId])
    
    def TruncateTable(self, tableName='users'):
        truncateCommand = """
        TRUNCATE TABLE %s
        """%(tableName)

        self.query(truncateCommand)

    def authenticate(self, username="owner", password="password"):
        selectCommand = """
        SELECT * FROM users
        WHERE username = %s AND password = %s
        """

        users = self.query(selectCommand, parameters=[username, self.onewayEncrypt(password)])

        if users:
            return users[0]
        return None
    
    def ValidateUser(self, username="owner"):
        selectCommand = """
        SELECT * FROM users
        WHERE username = %s
        """

        return self.query(selectCommand, parameters=[username])
    
    def DeleteTables(self):
        for table in self.tables:
            dropCommand = """
            DROP TABLE %s
            """%(table)
            self.query(dropCommand)
    
    def onewayEncrypt(self, string):
        encrypted_string = hashlib.scrypt(string.encode('utf-8'),
                                          salt = self.encryption['oneway']['salt'],
                                          n    = self.encryption['oneway']['n'],
                                          r    = self.encryption['oneway']['r'],
                                          p    = self.encryption['oneway']['p']
                                          ).hex()
        return encrypted_string

    def reversibleEncrypt(self, type, message):
        fernet = Fernet(self.encryption['reversible']['key'])
        
        if type == 'encrypt':
            message = fernet.encrypt(message.encode())
        elif type == 'decrypt':
            message = fernet.decrypt(message).decode()

        return message