// src/features/auth/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Card from '../../../shared/components/Card';
import { useToast } from '../../../shared/hooks/useToast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clear any old token before login
    localStorage.removeItem('authToken');

    try {
      const result = await login({ email, password });
      
      console.log('Login result:', result);
      console.log('User data:', result.user);
      console.log('isProjectCoordinator:', result.user.isProjectCoordinator);
      console.log('Role:', result.user.role);
      
      showToast('Login successful!', 'success');
      
      // Check if user is both faculty and project coordinator
      if (result.user.role === 'faculty' && result.user.isProjectCoordinator) {
        // Show role selection modal
        console.log('Showing role modal');
        setLoginResult(result);
        setShowRoleModal(true);
        setLoading(false);
        return;
      }
      
      // Direct routing for other roles
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else if (result.user.role === 'faculty') {
        navigate('/faculty');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid email or password';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (selectedRole) => {
    setShowRoleModal(false);
    if (selectedRole === 'coordinator') {
      navigate('/coordinator');
    } else {
      navigate('/faculty');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Faculty Evaluation Portal
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="faculty@university.edu"
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
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
          <a href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot Password?
          </a>
        </p>
      </Card>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Select Your Role
            </h2>
            <p className="text-gray-600 mb-6">
              You have access to both Faculty and Project Coordinator portals. Please choose how you would like to proceed:
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleRoleSelection('coordinator')}
              >
                Login as Project Coordinator
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleRoleSelection('faculty')}
              >
                Login as Faculty
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Login;
