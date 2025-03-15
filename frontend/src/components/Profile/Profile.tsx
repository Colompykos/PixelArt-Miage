import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState({});
  const [oldPassword, setOldPassword] = useState("");
  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/user/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(response.data);
      } catch (err) {
        setError("Erreur lors du chargement du profil");
      }
    };
    fetchUserData();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const newPassword = newPasswordRef.current.value;
    const confirmPassword = confirmPasswordRef.current.value;

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "/api/user/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessage("Mot de passe mis à jour avec succès");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setError("Échec de la mise à jour du mot de passe");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Profil utilisateur</h2>
      <p><strong>Nom:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <h3>Changer de mot de passe</h3>
      <form onSubmit={handlePasswordChange}>
        <input
          type="password"
          placeholder="Ancien mot de passe"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          ref={newPasswordRef}
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          ref={confirmPasswordRef}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Profile;
