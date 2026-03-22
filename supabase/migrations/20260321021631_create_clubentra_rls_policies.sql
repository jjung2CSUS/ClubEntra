/*
  # Clubentra RLS Policies

  Enables Row Level Security and creates access policies for all tables.
*/

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_collaborations ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CLUBS policies
CREATE POLICY "Anyone can view public clubs"
  ON clubs FOR SELECT TO authenticated USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Club officers can update clubs"
  ON clubs FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active')
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active')
  );

-- CLUB MEMBERS policies
CREATE POLICY "Members can view club membership"
  ON club_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members cm2 WHERE cm2.club_id = club_id AND cm2.user_id = auth.uid() AND cm2.status = 'active'));

CREATE POLICY "Officers can insert members"
  ON club_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members cm2 WHERE cm2.club_id = club_id AND cm2.user_id = auth.uid() AND cm2.role IN ('president', 'officer', 'admin') AND cm2.status = 'active'));

CREATE POLICY "Officers can update members"
  ON club_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members cm2 WHERE cm2.club_id = club_id AND cm2.user_id = auth.uid() AND cm2.role IN ('president', 'officer', 'admin') AND cm2.status = 'active'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members cm2 WHERE cm2.club_id = club_id AND cm2.user_id = auth.uid() AND cm2.role IN ('president', 'officer', 'admin') AND cm2.status = 'active'));

CREATE POLICY "Members can leave"
  ON club_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members cm2 WHERE cm2.club_id = club_id AND cm2.user_id = auth.uid() AND cm2.role IN ('president', 'officer', 'admin') AND cm2.status = 'active'));

-- MEMBERSHIP APPLICATIONS policies
CREATE POLICY "Users can view own applications"
  ON membership_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Users can submit applications"
  ON membership_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Officers can update applications"
  ON membership_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

-- EVENTS policies
CREATE POLICY "Anyone can view public events"
  ON events FOR SELECT TO authenticated
  USING (is_public = true OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.status = 'active'));

CREATE POLICY "Officers can create events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can update events"
  ON events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'))
  WITH CHECK (auth.uid() = created_by OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can delete events"
  ON events FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

-- EVENT RSVPs policies
CREATE POLICY "Anyone can view event rsvps"
  ON event_rsvps FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own rsvps"
  ON event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rsvps"
  ON event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rsvps"
  ON event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ANNOUNCEMENTS policies
CREATE POLICY "Members can view announcements"
  ON announcements FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.status = 'active') OR
    EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_id AND clubs.is_public = true)
  );

CREATE POLICY "Officers can create announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can update announcements"
  ON announcements FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'))
  WITH CHECK (auth.uid() = author_id OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can delete announcements"
  ON announcements FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

-- DOCUMENTS policies
CREATE POLICY "Members can view documents"
  ON documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.status = 'active'));

CREATE POLICY "Officers can add documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by AND EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can delete documents"
  ON documents FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

-- FUNDING REQUESTS policies
CREATE POLICY "Members can view funding requests"
  ON funding_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.status = 'active'));

CREATE POLICY "Officers can submit funding requests"
  ON funding_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by AND EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can update funding requests"
  ON funding_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

-- CLUB COLLABORATIONS policies
CREATE POLICY "Members can view collaborations"
  ON club_collaborations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id IN (club_id_1, club_id_2) AND club_members.user_id = auth.uid() AND club_members.status = 'active'));

CREATE POLICY "Officers can create collaborations"
  ON club_collaborations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_id_1 AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));

CREATE POLICY "Officers can update collaborations"
  ON club_collaborations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id IN (club_id_1, club_id_2) AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id IN (club_id_1, club_id_2) AND club_members.user_id = auth.uid() AND club_members.role IN ('president', 'officer', 'admin') AND club_members.status = 'active'));
