
const form = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");
const nextTarget = safeNextTarget(new URLSearchParams(window.location.search).get("next"));

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const phone = document.getElementById("registerPhone").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerConfirm").value;

    if (!name || !email || !phone || !password || !confirm) {
        showMessage(message, "Please fill in all fields.");
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(message, "Please enter a valid email address.");
        return;
    }

    if (!isValidPhone(phone)) {
        showMessage(message, "Please enter a valid phone number.");
        return;
    }

    if (password.length < 6) {
        showMessage(message, "Password must be at least 6 characters.");
        return;
    }

    if (password !== confirm) {
        showMessage(message, "Passwords do not match.");
        return;
    }

    try {
        const response = await fetch(apiUrl("/api/auth/register"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(message, data.message);
            return;
        }

        showMessage(message, data.message, "success");

        form.reset();

        setTimeout(() => {
            window.location.href = "login.html" + (nextTarget ? "?next=" + encodeURIComponent(nextTarget) : "");
        }, 1000);

    } catch (error) {
        console.error(error);
        showMessage(
            message,
            "Unable to connect to the server. Please check your connection and try again."
        );
    }
});