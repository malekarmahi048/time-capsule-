if (!requireLogin()) {

    throw new Error("Login required");

}


const email = currentUser();


const user =
    getUsers().find(
        item => item.email === email
    );


if (user) {

    document.getElementById(
        "userName"
    ).textContent =
        user.name.split(" ")[0];

}


function renderDashboard() {

    const capsules =
        getCapsules().filter(
            capsule =>
                capsule.owner === email
        );


    const now = new Date();


    const locked =
        capsules.filter(
            capsule =>
                new Date(capsule.unlock) > now
        );


    const unlocked =
        capsules.filter(
            capsule =>
                new Date(capsule.unlock) <= now
        );


    document.getElementById(
        "total"
    ).textContent =
        capsules.length;


    document.getElementById(
        "locked"
    ).textContent =
        locked.length;


    document.getElementById(
        "unlocked"
    ).textContent =
        unlocked.length;


    document.getElementById(
        "upcoming"
    ).textContent =
        locked.length;


    const list =
        document.getElementById(
            "capsuleList"
        );


    if (capsules.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                No capsules yet.

                <br><br>

                <a href="create-capsule.html">
                    Create your first capsule
                </a>

            </div>

        `;

        return;

    }


    capsules.sort(
        (a, b) =>
            new Date(a.unlock) -
            new Date(b.unlock)
    );


    list.innerHTML =
        capsules.map(
            capsule => {

                const isLocked =
                    new Date(capsule.unlock) >
                    new Date();


                const date =
                    new Date(capsule.unlock);


                return `

                <div
                    class="capsule-row"
                    onclick="openCapsule('${capsule.id}')"
                >

                    <div class="capsule-icon">
                        🔒
                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(capsule.title)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                capsule.description ||
                                "No description"
                            )}
                        </p>

                    </div>


                    <div class="row-date">

                        <small>
                            UNLOCKS ON
                        </small>

                        ${date.toLocaleDateString()}

                        <br>

                        ${date.toLocaleTimeString(
                            [],
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )}

                    </div>


                    <div
                        class="status
                        ${isLocked ? "" : "unlocked"}"
                    >

                        ${
                            isLocked
                            ? "◉ LOCKED"
                            : "UNLOCKED"
                        }

                    </div>


                    <span>
                        ›
                    </span>

                </div>

                `;

            }
        ).join("");

}


function openCapsule(id) {

    window.location.href =
        "capsule.html?id=" + id;

}


renderDashboard();


setInterval(
    renderDashboard,
    1000
);