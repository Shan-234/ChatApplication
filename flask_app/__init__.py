# Author: Shantanu Ingalagi <ingalag1@msu.edu>

#--------------------------------------------------
# Import Requirements
#--------------------------------------------------
import os
from flask import Flask
from flask_socketio import SocketIO
from flask_failsafe import failsafe

socketio = SocketIO()

#--------------------------------------------------
# Create a Failsafe Web Application
#--------------------------------------------------
@failsafe
def create_app(debug=False):
	app = Flask(__name__)
	
	# This will prevent issues with cached static files
	app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
	app.debug = debug
	
	# The secret key is used to cryptographically-sign the cookies used for storing the session data.
	app.secret_key = 'AKWNF1231082fksejfOSEHFOISEHF24142124124124124iesfhsoijsopdjf'

	from .utils.database.database import database
	db = database()

	db.createTables(purge=True)

	# This will create a user
	db.createUser(firstName="owner", lastName="owner", username="owner", password="password")
	db.createUser(firstName="guest", lastName="1", username="guest1", password="password")
	db.createUser(firstName="guest", lastName="2", username="guest2", password="password")
	db.createUser(firstName="guest", lastName="3", username="guest3", password="password")
	db.createUser(firstName="guest", lastName="4", username="guest4", password="password")

	socketio.init_app(app)

	with app.app_context():
		from . import routes
		return app