# Agora – Prototype MVP

Ce dépôt contient une première implémentation de l'application Agora avec Next.js. Elle permet à un administrateur de créer un post (résumé d'un rapport) et d'afficher ce post dans le fil d'actualité côté utilisateur.

## Démarrage

```bash
npm install
npm run dev
```

L'application est ensuite disponible sur http://localhost:3000.

## Création d'un post

1. Définissez un jeton administrateur côté serveur (optionnel mais recommandé) :

   ```bash
   export ADMIN_TOKEN="mon-super-jeton"
   ```

   Si aucune valeur n'est fournie, le jeton par défaut est `changeme`.

2. Rendez-vous sur http://localhost:3000/admin et remplissez le formulaire (titre, résumé, lien vers la source, tags facultatifs et jeton administrateur).
3. Après soumission, le post est stocké dans `data/posts.json` et apparaît instantanément dans le fil d'actualité public.

## Interactions côté utilisateur

Sur la page d'accueil :

- Les utilisateurs peuvent liker un rapport. Le compteur se met à jour instantanément.
- Un formulaire "Contribuer" permet d'ajouter un commentaire en choisissant la section adéquate : **Analyse**, **Débat**, **Question** ou **Proposition**.
- Les contributions sont affichées dans des blocs séparés selon leur section pour faciliter la lecture des discussions.

## Structure des données

Les posts sont enregistrés dans `data/posts.json` avec la structure suivante :

```json
{
  "id": "uuid",
  "title": "Titre du rapport",
  "summary": "Résumé court",
  "sourceUrl": "https://lien-vers-le-rapport",
  "tags": ["France", "Politique"],
  "createdAt": "2024-05-01T12:00:00.000Z",
  "likes": 3,
  "comments": [
    {
      "id": "uuid",
      "section": "analysis",
      "author": "Clara",
      "content": "Point de vue détaillé sur la méthodologie",
      "createdAt": "2024-05-01T14:20:00.000Z"
    }
  ]
}
```

Ce format facilite l'évolution future vers une base de données plus robuste tout en capturant les premières interactions sociales autour des rapports.
