document.getElementById("sign_in_button").addEventListener('click', (event) => {
    event.preventDefault();

    const inputData = {
        'username': document.getElementById("username").value,
        'password': document.getElementById("password").value
    };

    jQuery.ajax({
        url: "/process_sign_in",
        data: JSON.stringify(inputData),
        contentType: "application/json",
        type: "POST",
        success: function(result) {
            if ('success' in result) {
                window.location.href = "/home";
            } else {
                document.getElementById("incorrect_credentials").textContent = "Incorrect Credentials. Try Again.";
            }
        }
    });
});