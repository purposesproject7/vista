// src/features/auth/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Card from '../../../shared/components/Card';
import { MOCK_USERS } from '../../../shared/utils/mockData';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ email, password });
      
      // Redirect based on role
      if (result.user.role === 'faculty') {
        navigate('/faculty');
      } else if (result.user.role === 'admin') {
        navigate('/admin');
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick login for development
  const quickLogin = (userType) => {
    const user = MOCK_USERS[userType];
    localStorage.setItem('authToken', 'mock-token-' + userType);
    localStorage.setItem('mockUser', JSON.stringify(user));
    
    if (userType === 'faculty') {
      navigate('/faculty');
    } else {
      navigate('/admin');
    }
    
    window.location.reload(); // Force reload to update auth context
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Faculty Evaluation Portal
        </h1>
        
        {/* Quick Login Buttons for Development */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-semibold mb-3">
            🚀 Quick Login (Development Only)
          </p>
          <div className="space-y-2">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => quickLogin('faculty')}
            >
              Login as Faculty
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => quickLogin('admin')}
            >
              Login as Admin
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or login manually</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="faculty@university.edu"
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-4">
          <a href="/" className="text-blue-600 hover:underline">
            View Instructions
          </a>
        </p>
      </Card>
    </div>
  );
};

export default Login;
