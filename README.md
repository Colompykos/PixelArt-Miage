# Front-PixelArt-Miage

## 📚 Table des matières

- [Lancement de toute l'application en local avec Docker](#lancement-de-toute-lapplication-en-local-avec-docker)
- [Fonctionnalités générales](#-fonctionnalités-générales)
- [Bonus implémentés](#-bonus-implémentés)
- [Remarque : Ajouter un compte admin](#ℹ️-remarque--ajouter-un-compte-admin)
- [Déploiement](#déploiement)
- [Contributions](#-contributions)

---

## Lancement de toute l'applciation en local avec Docker

1. Démarrez les trois services Back/Front/BD :
   ```sh
   docker-compose up --build
   ```

## ✅ Fonctionnalités générales

- [x] Page d'accueil avec :
  - [x] Nombre d'utilisateurs inscrits
  - [x] Nombre de PixelBoards
  - [x] Aperçu des PixelBoards en cours et terminés
- [x] Authentification (connexion / inscription) avec JWT
- [x] Création, modification, suppression des PixelBoards (admin)
- [x] Affichage des propriétés d’un PixelBoard :
  - [x] Titre, taille, statut
  - [x] Délai entre participations
  - [x] Mode d’écrasement de pixel
  - [x] Temps restant avant fermeture
- [x] Possibilité de dessiner sur un PixelBoard
- [x] Profil utilisateur :
  - [x] Modification des infos
  - [x] Visualisation des contributions
- [x] Validation des champs dans les formulaires
- [x] Gestion des erreurs et spinners (chargement)
- [x] Architecture propre (routes, services, modèles, context, hooks)
- [x] Utilisation de Docker (Compose) et Dockerfile
- [x] Responsive design

---

## 🌟 Bonus implémentés

- [x] Déploiement en ligne  🦁
- [x] WebSockets pour mise à jour temps réel des pixels 🥷
- [x] Export d’un PixelBoard en image PNG 🐵
- [x] Heatmap des zones les plus utilisées 🐵/🦁
- [x] Replay : historique des pixels et timeline du dessin 🥷

## ℹ️ Remarque : Ajouter un compte admin

Pour passer un utilisateur en **admin** dans la base MongoDB (dans le conteneur Docker) :

```bash
docker-compose exec mongo mongosh
```
```bash
use PixelArt
```
```bash
db.users.updateOne(
  { email: "votre-email@exemple.com" },  
  { $set: { role: "admin", isActive: true } }
)
```
```bash
db.users.find()
```
Cela permet d’avoir un compte administrateur pour accéder aux fonctionnalités avancées dans l’interface.

## Déploiement

L’application est déployée avec **[Railway](https://railway.app)**, une plateforme qui prend en charge les projets Docker multi-services incluant le **Backend**, le **Frontend** et la **base de données MongoDB**.

> Le déploiement a été effectué à partir d’un **dépôt GitHub distinct** :  
> [https://github.com/salah0250/PixelArt-Miage](https://github.com/salah0250/PixelArt-Miage)  
> Cela permet de **préserver la version locale** utilisée pour le développement sans perturber sa configuration.

### 🔗 URLs de production

- **Frontend (React + Vite + Nginx)** :  
  [https://frontend-production-1b5d.up.railway.app](https://frontend-production-1b5d.up.railway.app)

- **Backend (Express + MongoDB)** :  
  [https://backend-production-5808.up.railway.app](https://backend-production-5808.up.railway.app)

## 👥 Contributions

| Nom prénom               | Identifiant GitHub | Tâches |
|--------------------------|-------------------|--------|
| **TAKI EDINE Marouane**  | Colompykos        | - Login / Register pages  <br> - JWT system  <br> - Handle Login/Register exceptions  <br> - Use WebSockets to view design progress in real time  <br> - Fix the size of the pixels with dynamic size of the boards  <br> - Uploader une image qui sera converti en pixel  <br> - Add contributions details in profile  <br> - Heatmap montrant les zones (pixels) les plus utilisés  <br> - Conserver l'historique des contributions pour chaque pixel et faire un mode "replay" du dessin |
| **ABOULKACIM Salah Eddine** | salah0250     | - Créer un PixelBoard en spécifiant les propriétés dans un formulaire  <br> - Dockirisation de l'app  <br>  - Récupération et affichage des données du PixelBoard  <br>  - Dessin et interaction avec le PixelBoard sur le canvas  <br> - Afficher la prévisualisation de la grille lors de creation  <br> - Add filtering, sorting, and search to PixelBoards list  <br> - App deployement |
| **SAADAOUI Brahim**      | BrahimSD         | - HomePage - Creation de la page Profile (afficher infos et changer mot de passe)  <br> - PixelBoard - Ajout d'un timer flottant pour le délai entre placements de pixels  <br> - AdminPage - Panel d'administration complet pour gestion des utilisateurs et tableaux de pixels  <br> - Ajout de l'exportation des PixelBoards en SVG/PNG  <br> - Implémentation de la protection des routes et ajout d'une barre de navigation  <br> - Fix bug nginx related to docker |
| **Zaid LAASRI**          | ZaidLaasri       | - Appliquer le thème pixel à la Home Page  <br> - Séparation du style et maintien de la taille native des pixels  <br> - Mise en page et adaptation du preview en mode pixel  <br> - Refonte du style de la page Profile avec thème pixel  <br> - Harmonisation globale du thème pixel sur le front-end |
| **Abdellah ADANSAR**     | zertyg1          | - Correction d'un bug dans la mise à jour du mot de passe  <br> - User data updates  <br> - Fix input spaces  <br> - Display all boards on home page  <br> - Board & home font |
