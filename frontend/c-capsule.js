const capsuleForm = document.getElementById("capsuleForm");

capsuleForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const message =
        document.getElementById("message").value.trim();

    const unlockDate =
        document.getElementById("unlockDate").value;

    const unlockTime =
        document.getElementById("unlockTime").value;

    const condition =
        document.getElementById("condition").value;


    if (!title || !message || !unlockDate || !unlockTime) {

        alert("Please fill in all required fields.");

        return;
    }


    const capsuleData = {

        title: title,

        description: description,

        message: message,

        unlock_date: unlockDate,

        unlock_time: unlockTime,

        condition: condition

    };


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/api/capsules",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(capsuleData)
            }
        );


        const data = await response.json();


        if (response.ok) {

            alert("Capsule locked successfully!");

            window.location.href =
                "dashboard.html";

        } else {

            alert(
                data.message ||
                "Unable to create capsule."
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to the Python backend. " +
            "Make sure app.py is running."
        );

    }

});