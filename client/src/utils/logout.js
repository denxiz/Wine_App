// src/utils/logout.js
export default function logout() {
  localStorage.removeItem("token");
  window.location.href = "/"; // or "#/" if using HashRouter
}
