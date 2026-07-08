import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('lw_token');
        if (token && token.startsWith('mockjwt.')) {
            try {
                const parts = token.split('.');
                const payloadB64 = parts[1];
                const payloadJson = atob(payloadB64);
                const payload = JSON.parse(payloadJson);
                setUser({
                    id: payload.sub,
                    email: payload.email
                });
            } catch (err) {
                console.error('Error decoding stored mock token:', err);
                localStorage.removeItem('lw_token');
            }
        }
        setLoading(false);
    }, []);

    // Setup global fetch interceptor to automatically append the Auth JWT
    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === 'string' ? input : input.url;
            if (url.includes('localhost:8000') || url.startsWith('/')) {
                const token = localStorage.getItem('lw_token');
                if (token) {
                    init = init || {};
                    init.headers = init.headers || {};
                    if (init.headers instanceof Headers) {
                        init.headers.set('Authorization', `Bearer ${token}`);
                    } else if (Array.isArray(init.headers)) {
                        const authIdx = init.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
                        if (authIdx !== -1) {
                            init.headers[authIdx] = ['Authorization', `Bearer ${token}`];
                        } else {
                            init.headers.push(['Authorization', `Bearer ${token}`]);
                        }
                    } else {
                        init.headers['Authorization'] = `Bearer ${token}`;
                    }
                }
            }
            return originalFetch(input, init);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const loginWithMockGoogle = async (email) => {
        try {
            // Generate standard-looking mock JWT
            const safeId = "google_mock_" + btoa(email).replace(/=/g, "").toLowerCase();
            const payload = {
                sub: safeId,
                email: email
            };
            const payloadB64 = btoa(JSON.stringify(payload));
            const mockToken = `mockjwt.${payloadB64}.signature`;
            
            localStorage.setItem('lw_token', mockToken);
            setUser({ id: safeId, email: email });
            return true;
        } catch (err) {
            console.error('Mock login error:', err);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('lw_token');
        setUser(null);
    };

    const login = async () => true;
    const register = async () => true;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithMockGoogle }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);



