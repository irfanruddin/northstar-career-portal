requireLogin();

const token = localStorage.getItem("career_token");

async function loadProfile() {
  try {
    const response = await fetch(
      apiUrl("/api/auth/me"),
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load profile."
      );
    }

    const user = data.user;

    document.getElementById("profileName").value =
      user.name || "";

    document.getElementById("profileEmail").value =
      user.email || "";

    document.getElementById("profilePhone").value =
      user.phone || "";

    document.getElementById("profileEducation").value =
      user.education || "";

    document.getElementById("profileSkills").value =
      user.skills || "";

  } catch (error) {
    console.error("Profile loading error:", error);

    showMessage(
      document.getElementById("profileMessage"),
      "Unable to load profile."
    );
  }
}


document
  .getElementById("profileForm")
  .addEventListener("submit", async e => {

    e.preventDefault();

    const message =
      document.getElementById("profileMessage");

    const updatedProfile = {

      name:
        document
          .getElementById("profileName")
          .value
          .trim(),

      phone:
        document
          .getElementById("profilePhone")
          .value
          .trim(),

      education:
        document
          .getElementById("profileEducation")
          .value
          .trim(),

      skills:
        document
          .getElementById("profileSkills")
          .value
          .trim()
    };

    if (!updatedProfile.name || !updatedProfile.phone || !updatedProfile.education || !updatedProfile.skills) {
      showMessage(message, "Please fill in all profile fields.");
      return;
    }

    if (!isValidPhone(updatedProfile.phone)) {
      showMessage(message, "Please enter a valid phone number.");
      return;
    }


    try {

      const response = await fetch(
        apiUrl("/api/auth/profile"),
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify(updatedProfile)
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to update profile."
        );
      }

      showMessage(
        message,
        "Profile saved successfully.",
        "success"
      );

      await loadProfile();

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      showMessage(
        message,
        error.message ||
        "Unable to save profile."
      );
    }
  });


loadProfile();