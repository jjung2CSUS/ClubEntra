interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onCreateAccount, onLogin }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-8">
          <img
            src="/App_icon_5.png"
            alt="ClubEntra"
            className="w-72 h-72 rounded-3xl object-cover shadow-lg"
            style={{ boxShadow: '0 8px 32px rgba(16, 185, 129, 0.18)' }}
          />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 text-center">
          ClubEntra
        </h1>
        <p className="text-base text-slate-400 font-medium text-center mb-12 tracking-wide">
          Your Campus Club Hub
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={onCreateAccount}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-base shadow-md
              hover:bg-emerald-600 active:scale-95 active:bg-emerald-700
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            style={{ boxShadow: '0 4px 16px rgba(16, 185, 129, 0.30)' }}
          >
            Create Account
          </button>

          <button
            onClick={onLogin}
            className="w-full py-3.5 rounded-2xl bg-white text-emerald-600 font-semibold text-base
              border-2 border-emerald-200
              hover:bg-emerald-50 hover:border-emerald-400 active:scale-95 active:bg-emerald-100
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
          >
            Login
          </button>
        </div>

        <p className="mt-10 text-xs text-slate-300 text-center tracking-wide">
          Trusted by 500+ student organizations
        </p>
      </div>
    </div>
  );
}
