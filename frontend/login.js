const loginForm =
    document.getElementById("loginForm");


loginForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const email =
            document.getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();


        const password =
            document.getElementById("loginPassword")
            .value;


        const message =
            document.getElementById("loginMessage");


        const users = getUsers();


        const user =
            users.find(
                item =>
                    item.email === email &&
                    item.password === password
            );


        if (!user) {

            message.textContent =
                "Invalid email or password.";

            message.className =
                "form-message error";

            return;

        }


        localStorage.setItem(
            "timevault_current_user",
            email
        );


        window.location.href =
            "dashboard.html";

    }
);