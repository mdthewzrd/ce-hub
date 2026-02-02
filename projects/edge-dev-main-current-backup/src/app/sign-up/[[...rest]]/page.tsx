import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-slate-800 tracking-wide mb-2">
            Create Account
          </h1>
          <p className="text-slate-600 text-sm">
            Join Edge.dev trading platform
          </p>
        </div>
        <SignUp
          routing="hash"
          signInUrl="/sign-in"
          redirectUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white shadow-lg border border-slate-200 rounded-sm",
              headerTitle: "text-slate-800 font-light tracking-wide",
              headerSubtitle: "text-slate-600 text-sm",
              socialButtonsBlockButton: "bg-studio-surface border border-studio-border/60 hover:bg-studio-surface/80 text-studio-text hover:text-studio-text rounded-sm font-light tracking-wide transition-all duration-300",
              formButtonPrimary: "bg-studio-gold hover:bg-studio-gold/90 text-slate-800 font-light tracking-wide rounded-sm transition-all duration-300 shadow-lg",
              formFieldInput: "bg-studio-surface/50 border border-studio-border/60 rounded-sm text-studio-text placeholder:text-studio-muted/60 focus:border-studio-gold/50 focus:ring-1 focus:ring-studio-gold/30 transition-all duration-300",
              dividerText: "text-studio-muted text-sm",
              footerActionText: "text-studio-muted text-sm",
              footerActionLink: "text-studio-gold hover:text-studio-gold/80 text-sm font-light tracking-wide transition-colors duration-200"
            }
          }}
        />
        <div className="text-center mt-6">
          <p className="text-slate-600 text-sm">
            Already have an account?{' '}
            <a
              href="/sign-in"
              className="text-studio-gold hover:text-studio-gold/80 font-light tracking-wide transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}