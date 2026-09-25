import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { toast } from 'react-toastify';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const userRole = await login(username, password, rememberMe);
      if (userRole) {
        toast.success(`Welcome back! Logged in successfully.`);
        if (userRole === 'client') {
          navigate('/client/inventory');
        } else {
          navigate(`/${userRole}/dashboard`);
        }
      } else {
        toast.error('Invalid username or password');
      }
    } catch (err) {
      toast.error('Authentication service error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }
    setIsForgotLoading(true);
    await forgotPassword(forgotEmail);
    setIsForgotLoading(false);
    setIsForgotOpen(false);
    toast.success('Password reset link sent to your registered email');
    setForgotEmail('');
  };



  /* ─── Shared Login Form Content ─── */
  const loginFormContent = (
    <>
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* Hidden dummy fields to absorb browser autofill */}
        <input type="text" name="fake_user" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="fake_pass" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} />
        
        <Input
          label="Username or Email"
          type="text"
          placeholder="name@company.com or username"
          required
          name="nh_login_user"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          leftIcon={<HiOutlineUser className="h-5 w-5" />}
        />
        
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder=""
            required
            name="nh_login_pass"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<HiOutlineLockClosed className="h-5 w-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer flex items-center justify-center p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="h-4.5 w-4.5" />
                ) : (
                  <HiOutlineEye className="h-4.5 w-4.5" />
                )}
              </button>
            }
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-500">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-stone-300 text-primary focus:ring-primary h-4 w-4"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setIsForgotOpen(true)}
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <Button variant="primary" size="lg" className="w-full mt-2" type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>
    </>
  );

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden font-sans"
        style={{
          background: 'linear-gradient(135deg, #2f37d6 0%, #262db8 25%, #1d2396 50%, #2f37d6 75%, #4f57ea 100%)',
        }}
      >
        {/* Decorative background circles — only visible on mobile (hidden on desktop) */}
        <div className="absolute top-[-80px] left-[-60px] w-64 h-64 rounded-full opacity-30 pointer-events-none md:hidden"
          style={{ background: 'radial-gradient(circle, #4f57ea, transparent 70%)' }}
        />
        <div className="absolute bottom-[-100px] right-[-80px] w-80 h-80 rounded-full opacity-25 pointer-events-none md:hidden"
          style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }}
        />
        <div className="absolute top-1/3 right-[-40px] w-48 h-48 rounded-full opacity-20 pointer-events-none md:hidden"
          style={{ background: 'radial-gradient(circle, #4f57ea, transparent 70%)' }}
        />

        {/* Left Panel — Only on desktop (md and up) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-between"
          style={{
            background: 'linear-gradient(160deg, #2f37d6 0%, #252cbd 40%, #1c2294 70%, #151a75 100%)',
          }}
        >
          {/* Decorative elements for desktop left panel */}
          <div className="absolute top-[-120px] left-[-100px] w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #4f57ea, transparent 70%)' }}
          />
          <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }}
          />
          <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #4f57ea, transparent 70%)' }}
          />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Top: Logo */}
          <div className="relative z-10 p-10 lg:p-14">
            <div className="flex items-center gap-3 select-none">
              <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-wider block leading-none">UNAI INFRA</span>
                <span className="text-[10px] font-bold text-blue-200 tracking-widest uppercase leading-none">
                  Civil Equipment Rental
                </span>
              </div>
            </div>
          </div>

          {/* Center: Hero Text */}
          <div className="relative z-10 px-10 lg:px-14 flex-1 flex flex-col justify-center">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Hey, Hello!
            </h2>
            <p className="text-sm lg:text-base text-blue-100 leading-relaxed max-w-md font-medium">
              We provide all the advantages that can simplify all your equipment rental management and financial transactions without any further requirements.
            </p>
          </div>

          {/* Bottom: Footer */}
          <div className="relative z-10 p-10 lg:p-14">
            <div className="flex items-center gap-4 text-xs text-blue-200/60 font-medium">
              <span>© 2026 UNAI Infra Ltd.</span>
              <span className="w-1 h-1 rounded-full bg-blue-200/40" />
              <span>All rights reserved.</span>
            </div>
          </div>
        </div>

        {/* Right Panel (Mobile: Centered Card wrapper; Desktop: Split screen right half) */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-stretch px-5 py-10 md:py-0 md:px-10 lg:px-20 xl:px-28 md:w-1/2 md:bg-white z-10">
          
          {/* Mobile-only Heading (Hidden on desktop) */}
          <div className="flex flex-col items-center mb-8 select-none md:hidden">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Login</h1>
            <p className="text-xs text-white/70 font-medium mt-1">
              UNAI Infra Portal
            </p>
          </div>

          {/* Form Card (Mobile: bg-white/95 glass card; Desktop: plain content wrapper) */}
          <div className="w-full max-w-sm md:max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-7 border border-white/30 md:bg-transparent md:backdrop-blur-none md:rounded-none md:shadow-none md:p-0 md:border-none">
            {/* Desktop-only Header */}
            <div className="mb-8 hidden md:block">
              <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-stone-500 mt-1.5 font-medium">
                Sign in to your portal and continue.
              </p>
            </div>

            {loginFormContent}
          </div>

          {/* Mobile-only Footer */}
          <p className="text-[10px] text-white/50 mt-8 font-medium md:hidden">© 2026 UNAI Infra Ltd. All rights reserved.</p>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Password" size="sm">
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
          <p className="text-xs text-brand-dark-grey leading-relaxed">
            Enter your registered email address below. We'll send you a secure link to reset your account password.
          </p>
          <Input
            label="Registered Email Address"
            type="email"
            placeholder="name@company.com"
            required
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            leftIcon={<HiOutlineEnvelope className="h-5 w-5" />}
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsForgotOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isForgotLoading}>
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
export default Login;
