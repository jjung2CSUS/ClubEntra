export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      clubs: {
        Row: Club;
        Insert: Partial<Club>;
        Update: Partial<Club>;
      };
      club_members: {
        Row: ClubMember;
        Insert: Partial<ClubMember>;
        Update: Partial<ClubMember>;
      };
      membership_applications: {
        Row: MembershipApplication;
        Insert: Partial<MembershipApplication>;
        Update: Partial<MembershipApplication>;
      };
      events: {
        Row: Event;
        Insert: Partial<Event>;
        Update: Partial<Event>;
      };
      event_rsvps: {
        Row: EventRSVP;
        Insert: Partial<EventRSVP>;
        Update: Partial<EventRSVP>;
      };
      announcements: {
        Row: Announcement;
        Insert: Partial<Announcement>;
        Update: Partial<Announcement>;
      };
      documents: {
        Row: Document;
        Insert: Partial<Document>;
        Update: Partial<Document>;
      };
      funding_requests: {
        Row: FundingRequest;
        Insert: Partial<FundingRequest>;
        Update: Partial<FundingRequest>;
      };
      club_collaborations: {
        Row: ClubCollaboration;
        Insert: Partial<ClubCollaboration>;
        Update: Partial<ClubCollaboration>;
      };
    };
  };
};

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  major: string;
  graduation_year: number | null;
  university: string;
  phone: string;
  username: string;
  student_id: string;
  student_role: 'member' | 'officer';
  club_name: string;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  short_description: string;
  category: string;
  logo_url: string;
  banner_url: string;
  university: string;
  is_active: boolean;
  is_public: boolean;
  member_count: number;
  founded_year: number | null;
  contact_email: string;
  website: string;
  instagram: string;
  twitter: string;
  meeting_schedule: string;
  location: string;
  total_funds: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'officer' | 'president' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  joined_at: string;
}

export interface MembershipApplication {
  id: string;
  club_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string | null;
  is_public: boolean;
  max_attendees: number | null;
  rsvp_count: number;
  image_url: string;
  event_type: 'general' | 'meeting' | 'social' | 'fundraiser' | 'workshop' | 'competition' | 'community';
  created_by: string;
  created_at: string;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
}

export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  club_id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: 'general' | 'financial' | 'meeting_notes' | 'constitution' | 'forms' | 'media';
  uploaded_by: string;
  created_at: string;
}

export interface FundingRequest {
  id: string;
  club_id: string;
  title: string;
  description: string;
  amount: number;
  category: 'general' | 'event' | 'supplies' | 'travel' | 'marketing' | 'equipment';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string;
  created_at: string;
}

export interface ClubFund {
  id: string;
  club_id: string;
  fund_type: 'IRA' | 'DOC' | 'ASI' | 'Club Fund';
  balance: number;
  funds_used: number;
  year: number;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface FundTransaction {
  id: string;
  club_fund_id: string | null;
  club_id: string;
  fund_type: string;
  year: number;
  event_name: string;
  event_date: string;
  attendee_count: number;
  description: string;
  amount: number;
  receipt_url: string;
  created_by: string | null;
  created_at: string;
}

export interface ClubCollaboration {
  id: string;
  club_id_1: string;
  club_id_2: string;
  project_name: string;
  description: string;
  status: 'proposed' | 'active' | 'completed' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
}

export type Page =
  | 'home'
  | 'club-funds'
  | 'dashboard'
  | 'directory'
  | 'club-detail'
  | 'my-clubs'
  | 'events'
  | 'announcements'
  | 'documents'
  | 'funding'
  | 'officer'
  | 'analytics'
  | 'profile'
  | 'collaborations'
  | 'admin-home'
  | 'admin-users'
  | 'admin-clubs'
  | 'admin-chat'
  | 'admin-create-user'
  | 'admin-edit-users'
  | 'admin-officers'
  | 'admin-advisors'
  | 'admin-members'
  | 'admin-edit-club-funds'
  | 'fund-detail'
  | 'add-transaction';
