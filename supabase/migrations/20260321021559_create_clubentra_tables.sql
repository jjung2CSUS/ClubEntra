/*
  # Clubentra Tables - Phase 1

  Creates all core tables first, then policies separately to avoid forward reference issues.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  major text DEFAULT '',
  graduation_year integer,
  university text DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  short_description text DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  logo_url text DEFAULT '',
  banner_url text DEFAULT '',
  university text DEFAULT '',
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  member_count integer DEFAULT 0,
  founded_year integer,
  contact_email text DEFAULT '',
  website text DEFAULT '',
  instagram text DEFAULT '',
  twitter text DEFAULT '',
  meeting_schedule text DEFAULT '',
  location text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'officer', 'president', 'admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text DEFAULT '',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  is_public boolean DEFAULT true,
  max_attendees integer,
  rsvp_count integer DEFAULT 0,
  image_url text DEFAULT '',
  event_type text DEFAULT 'general' CHECK (event_type IN ('general', 'meeting', 'social', 'fundraiser', 'workshop', 'competition', 'community')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_type text DEFAULT '',
  file_size integer DEFAULT 0,
  category text DEFAULT 'general' CHECK (category IN ('general', 'financial', 'meeting_notes', 'constitution', 'forms', 'media')),
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  amount decimal(10,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'general' CHECK (category IN ('general', 'event', 'supplies', 'travel', 'marketing', 'equipment')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  submitted_by uuid REFERENCES profiles(id),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id_1 uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  club_id_2 uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_announcements_club_id ON announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_documents_club_id ON documents(club_id);
CREATE INDEX IF NOT EXISTS idx_funding_requests_club_id ON funding_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_membership_applications_club_id ON membership_applications(club_id);
CREATE INDEX IF NOT EXISTS idx_membership_applications_user_id ON membership_applications(user_id);
