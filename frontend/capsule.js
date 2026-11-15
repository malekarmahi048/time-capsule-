if (!requireLogin()) {

    throw new Error("Login required");

}


const params =
    new URLSearchParams(
        window.location.search
    );


const id =
    params.get("id");


const capsule =
    getCapsules().find(
        item =>
            item.id === id &&
            item.owner === currentUser()
    );


const detail =
    document.getElementById(
        "capsuleDetail"
    );


if (!capsule) {

    detail.innerHTML = `

        <h1>
            Capsule Not Found
        </h1>

        <p>
            This capsule does not exist.
        </p>

        <br>

        <a
            href="dashboard.html"
            class="btn btn-primary"
        >
            Back to Dashboard
        </a>

    `;

} else {


    function renderCapsule() {


        const unlockDate =
            new Date(capsule.unlock);


        const now =
            new Date();


        const difference =
            unlockDate - now;


        const unlocked =
            difference <= 0;


        const secondsTotal =
            Math.max(
                0,
                Math.floor(
                    difference / 1000
                )
            );


        const days =
            Math.floor(
                secondsTotal / 86400
            );


        const hours =
            Math.floor(
                (secondsTotal % 86400) / 3600
            );


        const minutes =
            Math.floor(
                (secondsTotal % 3600) / 60
            );


        const seconds =
            secondsTotal % 60;


        if (unlocked) {


            detail.innerHTML = `

                <div class="big-lock">
                    🔓
                </div>


                <h1>

                    ${escapeHTML(
                        capsule.title
                    )}

                    <span class="locked-tag">
                        UNLOCKED
                    </span>

                </h1>


                <p>
                    This capsule is now available.
                </p>


                <div class="message-box">

                    <strong>
                        Message
                    </strong>

                    <p>
                        ${escapeHTML(
                            capsule.content
                        )}
                    </p>

                </div>


                <div class="detail-meta">

                    <b>
                        Unlock Date & Time
                    </b>

                    <br>

                    ${unlockDate.toLocaleString()}

                    <br><br>

                    <b>
                        Description
                    </b>

                    <br>

                    ${escapeHTML(
                        capsule.description ||
                        "No description"
                    )}

                    <br><br>

                    <b>
                        Condition
                    </b>

                    <br>

                    ${escapeHTML(
                        capsule.condition
                    )}

                </div>

            `;


        } else {


            detail.innerHTML = `

                <div class="big-lock">
                    🔒
                </div>


                <h1>

                    ${escapeHTML(
                        capsule.title
                    )}

                    <span class="locked-tag">
                        ◉ LOCKED
                    </span>

                </h1>


                <p>

                    This capsule is locked and
                    will be available once the
                    unlock conditions are met.

                </p>


                <div class="countdown">


                    <div>

                        <strong>
                            ${days}
                        </strong>

                        <small>
                            Days
                        </small>

                    </div>


                    <div>

                        <strong>
                            ${hours}
                        </strong>

                        <small>
                            Hours
                        </small>

                    </div>


                    <div>

                        <strong>
                            ${minutes}
                        </strong>

                        <small>
                            Minutes
                        </small>

                    </div>


                    <div>

                        <strong style="color:#45d889">
                            ${String(seconds).padStart(2, "0")}
                        </strong>

                        <small>
                            Seconds
                        </small>

                    </div>


                </div>


                <div class="detail-meta">

                    <b>
                        Unlock Date & Time
                    </b>

                    <br>

                    ${unlockDate.toLocaleString()}

                    <br><br>


                    <b>
                        Description
                    </b>

                    <br>

                    ${escapeHTML(
                        capsule.description ||
                        "No description"
                    )}

                    <br><br>


                    <b>
                        Condition
                    </b>

                    <br>

                    ${escapeHTML(
                        capsule.condition
                    )}

                </div>


                <div class="warning">

                    🔒 &nbsp;

                    This content is encrypted and
                    cannot be viewed until the
                    unlock date and time.

                </div>

            `;

        }

    }


    renderCapsule();


    setInterval(
        renderCapsule,
        1000
    );

}