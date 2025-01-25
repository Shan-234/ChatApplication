# Web Development Project: Chat Application

This repository houses the source code to a Flask Web-Based Chat Application that strives to give the user a good texting experience while facilitating the sign up process to create an account. The tech stack of this application is as follows:

**Front-End:**
* HTML
* CSS
* JavaScript

**Back-End:**
* Flask (Python)
* MySQL
* WebSocket

**Deployment:**
* Docker
* Google Cloud

<br>

**Final Product** - Click <a href="https://chat-app-524031479607.us-central1.run.app">here</a> to view the latest version application.

## Debugging With Docker

<br>

**1.** Clone this repository into your local machine using the following command in your bash terminal:

```bash
git clone https://github.com/Shan-234/ChatApplication.git
```

<br>

**2.** Navigate to the repository in your local machine and run the following command:

```bash
docker-compose -f docker-compose.yml -p chat-app-container up
```

<br>

**3.** Start **Docker Desktop** on your machine and run the container named `chat-app-container`.

**4.** Select the hyperlink to navigate to the hosting port of the application. For example, if the hosting port is `PORT:8080`, navigate to the following URL in your browser: `http://localhost:8080/home`.

## Using the Application

1. **Sign Up** -  In the homepage of the web app, click on the hyperlink if prompted to sign up, or you can just sign up <a href="https://chat-app-524031479607.us-central1.run.app/sign_up">here</a>.

2. **Sign In** - Once you have signed up, click on `Sign In` on the top-right of the webpage to use your registered username and password to sign into your account.

3. **Chat** - Once signed in, you will be redirected to the homepage. Then, you can click on `Chat` on the top-right corner of the page to view all your chat groups.

4. Select a group and you can now start messaging.

## Adding a Group

1. **Chat Page** - Sign in and navigate to the `/chat` page, if not yet done.

2. **Add Group** - Click on the `Add Group` button on the top-left corner of the page.

3. **Group Information** - Provide the appropriate information of the group in the dialog box and click on `Save`.

4. Scroll all the way down on the left bar and click on the group to start chatting there.

## Changing Group Name

1. Select your desired group from the left bar of the `/chat` page.

2. Click on the `Group Info` button on the top-right of the chat area on the right of the page.

3. In the dialog box, click on `Edit` under the group's name and write the new name of the group.

4. Click on `Save` to save the group name and close the dialog box when done.

## Adding a Group Member

1. Select your desired group from the left bar of the `/chat` page.

2. Click on the `Add Members` button on the top-right of the chat area on the right of the page.

3. In the dialog box, click on the `Add Member` button and write the username of the person you wish to add.

4. Click on `Save` to add the person, and close the dialog box when done.

## Leaving a Group

1. Select your desired group from the left bar of the `/chat` page.

2. Click on `Leave Chat` on the top-right corner of the chat area.

3. In the dialog box, click on `Leave` again to confirm leaving the group.

## Acknowledgements

* **Dr. Mohammad M. Ghassemi**: Assistant Professor at Michigan State University, Department of Computer Science and Engineering.