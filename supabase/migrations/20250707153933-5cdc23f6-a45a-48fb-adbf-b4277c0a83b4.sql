-- Verify database setup by checking all required objects exist
SELECT 'Checking enum' as check_type, typname as object_name FROM pg_type WHERE typname = 'app_role'
UNION ALL
SELECT 'Checking profiles table' as check_type, tablename as object_name FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public'
UNION ALL  
SELECT 'Checking user_roles table' as check_type, tablename as object_name FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public'
UNION ALL
SELECT 'Checking function' as check_type, proname as object_name FROM pg_proc WHERE proname = 'handle_new_user';