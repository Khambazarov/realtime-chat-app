export const fetchUserLanguage = async () => {
  const response = await fetch("/api/users/current", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user language");
  }
  return response.json();
};

export const updateUserLanguage = async (language) => {
  const response = await fetch("api/users/language", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ language }),
  });
  if (!response.ok) {
    throw new Error("Failed to update user language");
  }
  return response.json();
};
