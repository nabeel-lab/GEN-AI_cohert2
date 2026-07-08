import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/projects');
        } else {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen bg-background text-zinc-100 flex items-center justify-center p-6 relative">
            <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                        <Lock className="text-blue-400" size={24} />
                    </div>
                </div>
                
                <h2 className="text-2xl font-medium tracking-tight text-center mb-2">Welcome Back</h2>
                <p className="text-zinc-500 text-center font-light mb-8">Sign in to access your AI strategies.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700/50 focus:border-zinc-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors font-light"
                            placeholder="founder@startup.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700/50 focus:border-zinc-500 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors font-light"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-medium rounded-xl py-3 mt-4 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        Sign In <ArrowRight size={16} />
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500 mt-6 font-light">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Sign up</Link>
                </p>
            </motion.div>
        </div>
    );
}
