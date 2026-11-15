const registerForm =
    document.getElementById("registerForm");


registerForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value
            .trim()
            .toLowerCase();

        const password =
            document.getElementById("password").value;

        const confirm =
            document.getElementById("confirm").value;

        const message =
            document.getElementById("registerMessage");


        const users = getUsers();


        if (password !== confirm) {

            message.textContent =
                "Passwords do not match.";

            message.className =
                "form-message error";

            return;

        }


        const existingUser =
            users.find(
                user => user.email === email
            );


        if (existingUser) {

            message.textContent =
                "An account with this email already exists.";

            message.className =
                "form-message error";

            return;

        }


        users.push({

            name: name,

            email: email,

            password: password

        });


        saveUsers(users);


        localStorage.setItem(
            "timevault_current_user",
            email
        );


        message.textContent =
            "Account created successfully!";


        message.className =
            "form-message success";


        setTimeout(
            function() {

                window.location.href =
                    "dashboard.html";

            },
            500
        );

    }
);