document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Create the data object
    const data = {
        username: username,
        password: password
    };

    try {
        // Sending the data to the /auth/login endpoint using POST
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)  // Send data as JSON in the body
        });

        const responseData = await response.json();

        if (responseData.message) {
            alert(responseData.message);  // Display the message if received
        }

        if (responseData.redirect === true) {
            // Redirect to '/home' if 'redirect' is true
            window.location.href = '/home';
        }

    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    }
});