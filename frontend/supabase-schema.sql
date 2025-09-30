-- Enable RLS
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'rachancheet';

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id uuid not null references auth.users on delete cascade,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('user', 'admin', 'super_admin')) DEFAULT 'user',
    created_by UUID REFERENCES users(id), -- Track who created admin accounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
 primary key (id)
);

CREATE TABLE IF NOT EXISTS resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    file_name Text NOT NULL,
    file_url TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    preview_url TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected')) DEFAULT 'pending',
    score INTEGER CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert themselves as user only"
ON users
FOR INSERT
WITH CHECK (
  id = auth.uid()
  AND role = 'user'
);


CREATE POLICY "Only service role can insert super_admin"
ON public.users
FOR INSERT
WITH CHECK (
  role != 'super_admin' OR auth.role() = 'service_role'
);

-- Create policies for resumes table
CREATE POLICY "Users can view own resumes" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
    FOR DELETE USING (auth.uid() = user_id);

-- -- Admin policies for resumes (role-based)
CREATE POLICY "Admins can view all resumes" ON resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update all resumes" ON resumes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- -- Service role policies (for backend operations)
-- CREATE POLICY "Service role can view all resumes" ON resumes
--     FOR SELECT USING (current_setting('role') = 'service_role');

-- CREATE POLICY "Service role can update all resumes" ON resumes
--     FOR UPDATE USING (current_setting('role') = 'service_role');

-- Admin policy for users table
-- CREATE POLICY "Admins can view all users" ON users
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM users u 
--             WHERE u.id = auth.uid() 
--             AND u.role IN ('admin', 'super_admin')
--         )
--     );

-- -- Super admin policies for user management
-- CREATE POLICY "Super admins can manage all users" ON users
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM users u 
--             WHERE u.id = auth.uid() 
--             AND u.role = 'super_admin'
--         )
--     );

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created_at ON resumes(created_at);
CREATE INDEX idx_users_role ON users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for resumes table
CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -- Create function to handle user creation
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGI
--     INSERT INTO public.users (id, email)
--     VALUES (NEW.id, NEW.email);
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Create trigger for new user creation
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create storage policies
CREATE POLICY "Users can upload own resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own resumes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own resumes" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own resumes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Service role can access all files
CREATE POLICY "Service role can access all resume files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'resumes' AND 
        current_setting('role') = 'service_role'
    );

-- Admins can view all resume files
CREATE POLICY "Admins can view all resume files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle user creation with role support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has role metadata (for admin invites)
    IF NEW.raw_user_meta_data ? 'role' THEN
        INSERT INTO public.users (id, email, role, created_by)
        VALUES (
            NEW.id, 
            NEW.email, 
            (NEW.raw_user_meta_data->>'role')::text,
            CASE 
                WHEN NEW.raw_user_meta_data ? 'created_by' THEN 
                    (NEW.raw_user_meta_data->>'created_by')::uuid
                ELSE NULL
            END
        );
    ELSE
        -- Default user creation
        INSERT INTO public.users (id, email, role)
        VALUES (NEW.id, NEW.email, 'user');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();





-- Enable pg_net extension (for http requests)
create extension if not exists pg_net;

-- Function to notify Supabase Edge Function
create or replace function notify_resume_status_change()
returns trigger as $$
declare
  user_email text;
begin
  if new.status is distinct from old.status then
    -- Get user email
    select email into user_email from users where id = new.user_id;

    -- Call Edge Function webhook
    perform
      net.http_post(
        url := 'https://<YOUR_PROJECT>.functions.supabase.co/resume-status-change',
        body := json_build_object(
          'resume_id', new.id,
          'user_id', new.user_id,
          'email', user_email,
          'new_status', new.status
        )::text,
        headers := json_build_object('Content-Type','application/json')
      );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger
drop trigger if exists on_resume_status_change on resumes;

create trigger on_resume_status_change
after update of status on resumes
for each row
execute function notify_resume_status_change();






-- Enable extension (run once)
create extension if not exists "pg_net";

-- Function called by trigger
create or replace function public.notify_resume_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Build payload: old & new rows
  perform net.http_post(
    url := 'https://<your-project>.supabase.co/functions/v1/resume-update',  -- replace
    body := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Supabase-Event-Signature', '<YOUR_DB_WEBHOOK_SECRET>'  -- replace with same secret used by Edge Function
    ),
    timeout_milliseconds := 5000
  );

  return NEW;
end;
$$;

-- Trigger on UPDATE only (fires AFTER update)
create trigger trg_resumes_update
after update on public.resumes
for each row
when (OLD IS DISTINCT FROM NEW)
execute function public.notify_resume_update();
   