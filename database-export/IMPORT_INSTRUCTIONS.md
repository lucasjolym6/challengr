# Supabase Import Instructions for Lovable Cloud Export

## Overview
This export contains your complete Lovable Cloud database, including:
- 19 tables with full schema
- 2 custom enum types
- 8 database functions
- Row Level Security (RLS) policies on all tables
- All your application data

## Files Included
1. **00_full_export.sql** - Schema, functions, RLS policies, and static/reference data
2. **01_transaction_data.sql** - Large transactional tables (user_challenges, submissions, posts, etc.)
3. **IMPORT_INSTRUCTIONS.md** - This file

## Pre-Import Checklist

### ✅ Requirements
- [ ] PostgreSQL 14+ compatible Supabase project
- [ ] Supabase SQL Editor access
- [ ] Admin/Owner permissions on target database
- [ ] Empty database OR willingness to drop existing tables

### ⚠️ Important Notes
- **This will DROP existing tables with the same names**
- **All data in dropped tables will be LOST**
- **Backup your existing Supabase data first if needed**
- **The auth.users table is NOT included** (managed by Supabase Auth)

## Import Steps

### Step 1: Prepare Supabase Project
1. Log into your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Import Schema & Static Data
1. Open `00_full_export.sql` in a text editor
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Wait for completion (should take 10-30 seconds)
6. Verify no errors in the output

**Expected output:** "Success. No rows returned"

### Step 3: Import Transaction Data
1. Open `01_transaction_data.sql` in a text editor
2. Copy the ENTIRE contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion (should take 10-30 seconds)
6. Verify no errors

### Step 4: Create Auth Trigger (CRITICAL)
The `handle_new_user()` function creates a profile when users sign up, but the trigger on `auth.users` cannot be auto-created. You MUST manually create it:

```sql
-- Run this separately in Supabase SQL Editor
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 5: Verify Import

Run this query to check table row counts:

```sql
SELECT 'admin_config' as table_name, COUNT(*) as row_count FROM public.admin_config
UNION ALL
SELECT 'badges', COUNT(*) FROM public.badges
UNION ALL
SELECT 'challenge_categories', COUNT(*) FROM public.challenge_categories
UNION ALL
SELECT 'challenges', COUNT(*) FROM public.challenges
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_challenges', COUNT(*) FROM public.user_challenges
UNION ALL
SELECT 'submissions', COUNT(*) FROM public.submissions
UNION ALL
SELECT 'posts', COUNT(*) FROM public.posts
UNION ALL
SELECT 'comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'likes', COUNT(*) FROM public.likes
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'validation_audit', COUNT(*) FROM public.validation_audit
UNION ALL
SELECT 'validator_notifications', COUNT(*) FROM public.validator_notifications
UNION ALL
SELECT 'user_friends', COUNT(*) FROM public.user_friends
ORDER BY table_name;
```

**Expected row counts:**
- admin_config: 5
- badges: 6
- challenge_categories: 7
- challenges: 17
- profiles: 14
- user_challenges: 49
- submissions: 10
- posts: 14
- comments: 18
- likes: 8
- messages: 10
- validation_audit: 2
- validator_notifications: 7
- user_friends: 7
- user_roles: 0
- user_badges: 0
- user_challenge_defeats: 0
- submission_reports: 0
- coaching_content: 0

### Step 6: Configure Auth Settings

Go to **Authentication** > **Settings** in your Supabase dashboard:

1. **Site URL**: Set to your application URL (e.g., `https://yourapp.com`)
2. **Redirect URLs**: Add your application URLs where users will be redirected after auth
3. **Email Templates**: Customize if needed
4. **For development**: Enable "Disable email confirmation" to speed up testing

### Step 7: Update Application Configuration

Update your application's `.env` file or configuration with new Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Step 8: Test Your Application

1. Start your application
2. Test key features:
   - [ ] User registration/login
   - [ ] Profile creation (should happen automatically)
   - [ ] Viewing challenges
   - [ ] Creating custom challenges
   - [ ] Submitting challenge completions
   - [ ] Viewing posts and comments
   - [ ] Friend connections
   - [ ] Messages between friends

## Security Verification

### Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### Check Active Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see 50+ policies across all tables.

### Test RLS with Sample Query
```sql
-- This should return 0 rows if RLS is working (no authenticated user)
SELECT COUNT(*) FROM profiles;

-- This should work (public policy)
SELECT COUNT(*) FROM badges;
```

## Storage Buckets

The export does NOT include storage bucket data. You need to manually recreate buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('user-uploads', 'user-uploads', true),
  ('challenge-media', 'challenge-media', true);
```

Then set up RLS policies for storage:

```sql
-- Allow public read access to avatars
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users Upload Own Avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Similar policies for other buckets...
```

## Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already exist. Either:
1. Drop them first: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
2. Or skip the schema import and only run data inserts

### Error: "permission denied"
**Solution**: You need admin/owner role on the Supabase project.

### Error: "function auth.uid() does not exist"
**Solution**: Make sure you're running this on a Supabase project, not a vanilla PostgreSQL database.

### RLS blocking queries
**Solution**: 
- Check you're authenticated when testing
- Review RLS policies
- Use Supabase service role key for admin operations (be careful!)

### Import hangs or times out
**Solution**:
- Try running each file separately
- Break large files into smaller batches
- Use Supabase CLI for large imports: `supabase db push --file 00_full_export.sql`

## Post-Import Maintenance

### Update Statistics
```sql
ANALYZE;
```

### Reindex (if needed)
```sql
REINDEX DATABASE postgres;
```

### Monitor Performance
Use Supabase dashboard:
- Database > Logs
- Database > Query Performance

## Need Help?

If you encounter issues:
1. Check Supabase logs: **Database** > **Logs**
2. Review RLS policies: **Authentication** > **Policies**
3. Check function definitions: **Database** > **Functions**
4. Consult Supabase docs: https://supabase.com/docs

## Additional Notes

- **User IDs**: The export preserves all UUIDs, so user references remain intact
- **Timestamps**: All preserved with timezone information
- **Constraints**: Foreign key constraints are maintained
- **Indexes**: All indexes are recreated for optimal performance
- **Functions**: All custom PL/pgSQL functions are included
- **Enums**: Custom types (app_role, challenge_type) are preserved

Your database is now fully migrated and ready to use! 🎉
