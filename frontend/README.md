# Agora – Prototype MVP

Ce dépôt contient une première implémentation de l'application Agora avec Next.js. Elle permet de regrouper l'origine des sources d'information et d'ajouter des interactions sociales.

## Démarrage

```bash
export MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/"

npm install
npm run dev
```

L'application est ensuite disponible sur http://localhost:3000. Une base de données MongoDB accessible via `MONGODB_URI` est requise.

## Interactions côté utilisateur

Sur la page d'accueil :

- Les utilisateurs peuvent liker un rapport. Le compteur se met à jour instantanément.
- Un formulaire "Contribuer" permet d'ajouter un commentaire en choisissant la section adéquate : **Avis**, **Analyse**, **Débat**, **Question** ou **Proposition**.
- Les contributions sont affichées dans des blocs séparés selon leur section pour faciliter la lecture des discussions.

## Structure des données

Les posts sont enregistrés dans la collection `posts` avec la structure suivante :

```json
{
  "id": "uuid",
  "title": "Titre du rapport",
  "summary": "Résumé court",
  "sourceUrl": "https://lien-vers-le-rapport",
  "tags": ["France", "Politique"],
  "createdAt": "2024-05-01T12:00:00.000Z",
  "updatedAt": "2024-05-01T12:00:00.000Z",
  "likedBy": ["userId1", "userId2"],
  "comments": [
    {
      "id": "uuid",
      "section": "analysis",
      "authorId": "userId1",
      "authorName": "Clara",
      "content": "Point de vue détaillé sur la méthodologie",
      "createdAt": "2024-05-01T14:20:00.000Z",
      "replies": [
        {
          "id": "uuid",
          "parentId": "uuid",
          "authorId": "userId2",
          "authorName": "David",
          "content": "Merci pour cette analyse approfondie !",
          "createdAt": "2024-05-01T15:00:00.000Z"
        }
      ]
    }
  ]
}
```

Ce format facilite l'évolution future vers une base de données plus robuste tout en capturant les premières interactions sociales autour des rapports.
