# Agora – Prototype MVP

Ce dépôt contient une première implémentation de l'application Agora avec Next.js. Elle permet de regrouper l'origine des sources d'information et d'ajouter des interactions sociales.

## Démarrage

```bash
export DB_ACCESSOR_API_URL="http://localhost:8080"

npm install
npm run dev
```

L'application est ensuite disponible sur http://localhost:3000. Elle s'appuie désormais sur l'API `db-accessor` pour toutes les opérations de persistance.

## Interactions côté utilisateur

Sur la page d'accueil :

- Les utilisateurs peuvent liker un rapport. Le compteur se met à jour instantanément.
- Un formulaire "Contribuer" permet d'ajouter un commentaire en choisissant la section adéquate : **Avis**, **Analyse**, **Débat**, **Question** ou **Proposition**.
- Les contributions sont affichées dans des blocs séparés selon leur section pour faciliter la lecture des discussions.

## Structure des données

Les posts sont stockés par l'API `db-accessor` dans la collection `posts` avec la structure suivante :

```json
{
  "id": "uuid",
  "title": "Titre du rapport",
  "summary": "Résumé court",
  "sourceUrl": "https://lien-vers-le-rapport",
  "tags": ["France", "Politique"],
  "createdAt": "2024-05-01T12:00:00.000Z",
  "likedBy": ["userId1", "userId2"],
  "comments": [
    {
      "id": "uuid",
      "section": "analysis",
      "author": "Clara",
      "authorId": "userId1",
      "content": "Point de vue détaillé sur la méthodologie",
      "createdAt": "2024-05-01T14:20:00.000Z",
      "replies": [
        {
          "id": "uuid",
          "parentId": "uuid",
          "author": "David",
          "authorId": "userId2",
          "content": "Merci pour cette analyse approfondie !",
          "createdAt": "2024-05-01T15:00:00.000Z"
        }
      ]
    }
  ]
}
```

Ce format facilite l'évolution future vers une base de données plus robuste tout en capturant les premières interactions sociales autour des rapports.
