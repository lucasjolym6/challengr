# 🚨 URGENT: Configuration des variables d'environnement

## Erreur actuelle
```
supabaseUrl is required.
```

## Solution

### 1. Créer le fichier `.env.local`

Crée un fichier `.env.local` à la racine du projet avec ce contenu :

```env
VITE_SUPABASE_URL=https://kyepnqeigutvaafqtzvg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Obtenir tes clés Supabase

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Va dans **Settings** > **API**
4. Copie :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 3. Redémarrer le serveur

```bash
npm run dev
```

## Structure du fichier `.env.local`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=ta_cle_publique_ici
```

## Vérification

Après avoir créé le fichier, l'application devrait se charger sans l'erreur `supabaseUrl is required`.
