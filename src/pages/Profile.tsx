import { useState } from 'react';
import { User, Mail, BookOpen, GraduationCap, Phone, Building2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    major: profile?.major || '',
    graduation_year: profile?.graduation_year?.toString() || '',
    university: profile?.university || '',
    phone: profile?.phone || '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      ...form,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-sky-500 to-sky-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="w-20 h-20 bg-white border-4 border-white rounded-2xl shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-700 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || 'Your Name'}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          {profile?.bio && <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <User size={18} className="text-sky-600" />
          Edit Profile
        </h3>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User size={13} /> Full Name
              </label>
              <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Jane Smith" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={13} /> Email
              </label>
              <input value={user?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
              <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="Tell other students about yourself..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} /> University
              </label>
              <input name="university" value={form.university} onChange={handleChange} placeholder="State University" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} /> Phone
              </label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={13} /> Major
              </label>
              <input name="major" value={form.major} onChange={handleChange} placeholder="Computer Science" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap size={13} /> Graduation Year
              </label>
              <input name="graduation_year" type="number" value={form.graduation_year} onChange={handleChange} placeholder="2026" min="2024" max="2030" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {saved && <span className="text-emerald-600 text-sm font-medium">Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
