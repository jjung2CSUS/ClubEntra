import { useRef, useState } from 'react';
import {
  ChevronLeft, DollarSign, FileText, Calendar, CheckCircle2, AlertCircle,
  Users, Tag, Camera, ImagePlus, X, Receipt,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/layout/BottomNav';
import type { Page } from '../lib/types';
import type { FundType } from './FundDetail';

interface AddTransactionProps {
  clubId: string;
  clubFundId: string | null;
  fundType: FundType;
  year: number;
  onNavigate: (page: Page) => void;
  onBack: () => void;
  onSuccess: () => void;
}

const FUND_BADGE: Record<FundType, { bg: string; text: string }> = {
  IRA: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  DOC: { bg: 'bg-sky-100', text: 'text-sky-700' },
  ASI: { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Club Fund': { bg: 'bg-rose-100', text: 'text-rose-700' },
};

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border border-slate-200 text-[15px] text-slate-800 ' +
  'placeholder:text-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 ' +
  'focus:border-transparent transition-all';

export function AddTransaction({
  clubId,
  clubFundId,
  fundType,
  year,
  onNavigate,
  onBack,
  onSuccess,
}: AddTransactionProps) {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [attendeeCount, setAttendeeCount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showPickerSheet, setShowPickerSheet] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const badge = FUND_BADGE[fundType];

  function handleFileSelected(file: File | null) {
    if (!file) return;
    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
    setShowPickerSheet(false);
  }

  function clearReceipt() {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
  }

  async function uploadReceipt(): Promise<string | null> {
    if (!receiptFile || !user) return null;
    setUploadingReceipt(true);
    const ext = receiptFile.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('receipts')
      .upload(path, receiptFile, { upsert: false });
    setUploadingReceipt(false);
    if (upErr) return null;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!eventName.trim()) { setError('Please enter an event name.'); return; }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount greater than $0.'); return; }

    const parsedAttendees = attendeeCount ? parseInt(attendeeCount, 10) : 0;

    setSaving(true);

    let receiptUrl = '';
    if (receiptFile) {
      const url = await uploadReceipt();
      if (!url) {
        setError('Could not upload receipt image. Please try again.');
        setSaving(false);
        return;
      }
      receiptUrl = url;
    }

    const { error: insertErr } = await supabase
      .from('fund_transactions')
      .insert({
        club_fund_id: clubFundId,
        club_id: clubId,
        fund_type: fundType,
        year,
        event_name: eventName.trim(),
        event_date: eventDate.trim(),
        attendee_count: parsedAttendees,
        amount: parsedAmount,
        description: description.trim(),
        receipt_url: receiptUrl,
        created_by: user?.id,
      });

    setSaving(false);
    if (insertErr) {
      setError('Could not save transaction. Please try again.');
      return;
    }
    onSuccess();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white px-5 pt-14 pb-5" style={{ boxShadow: '0 1px 0 #f1f5f9' }}>
        <div className="max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 active:scale-95 transition-all -ml-1 mb-4"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            <span className="text-sm font-semibold">{fundType} Funds</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[26px] font-extrabold text-slate-900 leading-tight tracking-tight">
                Add Transaction
              </h1>
              <p className="text-[13px] text-slate-400 mt-0.5 font-medium">{year} fiscal year</p>
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
              {fundType}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-36 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-3">

          <FormField label="Event Name" icon={<Tag size={15} className="text-slate-400" />}>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Fall Festival, Club Meeting..."
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Event Date" icon={<Calendar size={15} className="text-slate-400" />}>
            <input
              type="text"
              placeholder="e.g. October 15, 2025"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Number of People Attended" icon={<Users size={15} className="text-slate-400" />}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={attendeeCount}
              onChange={e => setAttendeeCount(e.target.value.replace(/[^0-9]/g, ''))}
              className={inputClass}
            />
          </FormField>

          <FormField label="Amount" icon={<DollarSign size={15} className="text-slate-400" />}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[15px]">$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`${inputClass} pl-9 font-bold`}
              />
            </div>
          </FormField>

          <FormField label="Description" icon={<FileText size={15} className="text-slate-400" />} optional>
            <textarea
              rows={4}
              placeholder="Add any additional details about this transaction..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </FormField>

          <ReceiptUploadCard
            preview={receiptPreview}
            onTap={() => setShowPickerSheet(true)}
            onClear={clearReceipt}
          />

          {error && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-rose-400 shrink-0" />
              <p className="text-[13px] text-rose-600 font-medium">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || uploadingReceipt}
              className="w-full bg-sky-500 text-white rounded-2xl py-4 text-[15px] font-bold
                active:scale-95 hover:bg-sky-600 transition-all disabled:opacity-60
                flex items-center justify-center gap-2.5"
              style={{ boxShadow: '0 6px 20px rgba(14,165,233,0.32)' }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} strokeWidth={2.5} />
                  <span>Save Transaction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <BottomNav currentPage="home" onNavigate={onNavigate} />

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0] ?? null)}
      />

      {showPickerSheet && (
        <PickerSheet
          onCamera={() => { cameraInputRef.current?.click(); }}
          onGallery={() => { galleryInputRef.current?.click(); }}
          onClose={() => setShowPickerSheet(false)}
        />
      )}
    </div>
  );
}

function ReceiptUploadCard({
  preview,
  onTap,
  onClear,
}: {
  preview: string | null;
  onTap: () => void;
  onClear: () => void;
}) {
  if (preview) {
    return (
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Receipt Attached</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center
              hover:bg-rose-50 hover:text-rose-400 text-slate-400 active:scale-95 transition-all"
          >
            <X size={13} />
          </button>
        </div>
        <div className="px-3 pb-3">
          <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
            <img
              src={preview}
              alt="Receipt preview"
              className="w-full max-h-52 object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onTap}
            className="mt-2 w-full text-center text-[12px] font-semibold text-sky-500 py-1.5
              hover:text-sky-600 active:scale-95 transition-all"
          >
            Change photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full bg-white rounded-2xl px-6 py-7 flex flex-col items-center justify-center gap-3
        border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50/40
        active:scale-[0.98] transition-all group"
      style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}
    >
      <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center
        group-hover:bg-sky-100 transition-colors">
        <ImagePlus size={24} className="text-sky-400 group-hover:text-sky-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-bold text-slate-700 group-hover:text-sky-600 transition-colors">
          Add Picture of the Receipt
        </p>
        <p className="text-[12px] text-slate-400 mt-0.5">Tap to take a photo or upload from library</p>
      </div>
    </button>
  );
}

function PickerSheet({
  onCamera,
  onGallery,
  onClose,
}: {
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-4 pb-10 pt-2
          animate-[slideUp_0.22s_ease-out]"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 mt-2" />
        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
          Add Receipt Photo
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onCamera}
            className="w-full flex items-center gap-4 px-5 py-4 bg-slate-50 rounded-2xl
              hover:bg-sky-50 active:scale-[0.98] transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0
              group-hover:bg-sky-200 transition-colors">
              <Camera size={20} className="text-sky-500" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-slate-800">Take Picture from Camera</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Open camera to photograph your receipt</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onGallery}
            className="w-full flex items-center gap-4 px-5 py-4 bg-slate-50 rounded-2xl
              hover:bg-sky-50 active:scale-[0.98] transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0
              group-hover:bg-emerald-200 transition-colors">
              <ImagePlus size={20} className="text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-slate-800">Select from Photo Library</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Choose an existing photo from your device</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-3.5 rounded-2xl bg-slate-100 text-slate-600
            font-bold text-[15px] hover:bg-slate-200 active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

function FormField({
  label,
  icon,
  optional = false,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl px-4 pt-4 pb-4" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 mb-2.5">
        {icon}
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        {optional && (
          <span className="text-[10px] text-slate-300 font-normal normal-case tracking-normal ml-0.5">optional</span>
        )}
      </div>
      {children}
    </div>
  );
}
