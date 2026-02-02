import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-slate-800 tracking-wide mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 text-sm">
            Sign in to your Edge.dev account
          </p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          redirectUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white shadow-lg border border-slate-200 rounded-sm",
              headerTitle: "text-slate-800 font-light tracking-wide",
              headerSubtitle: "text-slate-600 text-sm",
              socialButtonsBlockButton: "bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-800 rounded-sm font-light tracking-wide transition-all duration-300",
              formButtonPrimary: "bg-studio-gold hover:bg-studio-gold/90 text-slate-800 font-light tracking-wide rounded-sm transition-all duration-300 shadow-lg",
              formFieldInput: "bg-slate-50 border border-slate-300 rounded-sm text-slate-700 placeholder:text-slate-400 focus:border-studio-gold/50 focus:ring-1 focus:ring-studio-glow/30 transition-all duration-300",
              dividerText: "text-slate-500 text-sm",
              footerActionText: "text-slate-600 text-sm",
              footerActionLink: "text-studio-gold hover:text-studio-gold/80 text-sm font-light tracking-wide transition-colors duration-200"
            }
          }}
        />
        <div className="text-center mt-6">
          <p className="text-slate-600 text-sm">
            Don't have an account?{' '}
            <a
              href="/sign-up"
              className="text-studio-gold hover:text-studio-gold/80 font-light tracking-wide transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}