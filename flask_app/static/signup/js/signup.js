document.getElementById("sign_up_button").addEventListener('click', (event) => {
    const inputData = {
        'first_name': document.getElementById("first_name").value,
        'last_name': document.getElementById("last_name").value,
        'username': document.getElementById("username").value,
        'password': document.getElementById("password").value
    };

    if (!inputData['first_name'] || !inputData['last_name'] || !inputData['username'] || !inputData['password']) {
        document.getElementById("incorrect_credentials").textContent = "All fields must be filled out!";
        return;
    }

    if (inputData['password'] !== document.getElementById("confirm_password").value) {
        document.getElementById("incorrect_credentials").textContent = "Both passwords must be identical!";
        return;
    }

    jQuery.ajax({
        url: "/process_sign_up",
        data: JSON.stringify(inputData),
        contentType: "application/json",
        type: "POST",
        success: function(result) {
            if (result === "Username Already Exists. Pick Another Username.") {
                document.getElementById("incorrect_credentials").textContent = result;
            } else {
                window.location.href = "/sign_in";
            }
        }
    });
});