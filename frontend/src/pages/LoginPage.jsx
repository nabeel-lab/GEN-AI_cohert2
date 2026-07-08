import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const { loginWithMockGoogle } = useAuth();
    const navigate = useNavigate();
    
    // Popup state simulation
    const [showPopup, setShowPopup] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleClick = () => {
        setShowPopup(true);
    };

    const handleMockLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid Google email address');
            return;
        }

        setIsLoading(true);
        setTimeout(async () => {
            const success = await loginWithMockGoogle(email);
            setIsLoading(false);
            if (success) {
                setShowPopup(false);
                navigate('/projects');
            } else {
                setError('Failed to login. Please try again.');
            }
        }, 1200); // Simulate authentic Google OAuth redirect delay
    };

    return (
        <div className="min-h-screen bg-background text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 relative z-10 text-center shadow-2xl"
            >
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-blue-400 text-lg">💡</span>
                </div>
                
                <h2 className="text-3xl font-medium tracking-tight text-zinc-100 mb-2">Welcome to LaunchWise</h2>
                <p className="text-zinc-500 font-light mb-8">Access your AI decision intelligence workspace.</p>

                <button
                    onClick={handleGoogleClick}
                    className="w-full bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl py-3.5 px-4 transition-all duration-300 font-medium flex items-center justify-center gap-3 shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </button>

                <p className="text-zinc-650 text-[10px] mt-6 font-mono uppercase tracking-wider">Zero configuration required</p>
            </motion.div>

            {/* Simulated Google OAuth Popup Modal */}
            <AnimatePresence>
                {showPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPopup(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white text-zinc-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-zinc-200"
                        >
                            <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span className="font-medium text-sm text-zinc-700">Sign in with Google</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setShowPopup(false)}
                                    className="text-zinc-400 hover:text-zinc-650 text-xs font-mono"
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleMockLoginSubmit} className="p-6 space-y-4">
                                <div className="text-center mb-2">
                                    <h3 className="font-semibold text-lg text-zinc-800">Sign in</h3>
                                    <p className="text-zinc-500 text-xs font-light">to continue to launchwise.ai</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                        Google Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-light"
                                        placeholder="yourname@gmail.com"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Next"
                                    )}
                                </button>

                                <div className="text-center pt-2">
                                    <p className="text-[10px] text-zinc-400 leading-normal">
                                        To make local development easy, enter any email. A mock Google profile will automatically register in your local SQLite database.
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}



