document.getElementById("authForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    const adminAuthKey = document.getElementById("adminAuthKey").value;
    
    if (adminAuthKey.trim() === "") {
        document.getElementById("error-message").innerText = "Admin Authentication Key cannot be empty!";
        return;
    }

    // Create the data to be sent in JSON format
    const data = {
        adminAuthCode: adminAuthKey
    };

    // Send a POST request to the /admin/auth endpoint
    fetch("/admin/auth", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(responseData => {
        // Show the message in an alert box
        alert(responseData.message);

        // Check if we need to redirect
        if (responseData.redirect) {
            window.location.href = "/admin/panel";
        }
    })
    .catch(error => {
        console.error("Error during authentication:", error);
        alert("An error occurred during the authentication process.");
    });
});
