# Front-PixelArt-Miage

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


## Sans Docker

### Lancer le Frontend

1. Naviguez vers le répertoire `frontend` :
   ```sh
   cd frontend
   ```
2. Installez les dépendances :
   ```sh
   npm install
   ```
3. Démarrez le serveur de développement :
   ```sh
   npm run dev
   ```
### Lancer le Backend

1. Naviguez vers le répertoire `backend` :
   ```sh
   cd backend
   ```
2. Installez les dépendances :
   ```sh
   npm install
   ```
3. Démarrez le serveur de développement :
   ```sh
   npm run dev
   ```

## Avec Docker

1. Démarrez les trois services Back/Front/BD :
   ```sh
   docker-compose up --build
   ```

