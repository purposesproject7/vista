// src/features/auth/pages/InstructionsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';

const InstructionsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Faculty Evaluation Portal
          </h1>
          <p className="text-gray-600">Complete guide to using the system</p>
        </div>

        <Card className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">For Faculty</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Login & Select Filters</h3>
              <p>After login, select Year, School, Programme, and your Role (Guide/Panel)</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">2. Active Reviews</h3>
              <p>Click on a review to expand and see your assigned teams. Click "Enter Marks" to evaluate students.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">3. Mark Entry</h3>
              <p>Enter marks for each rubric component. Total must equal 100 for each student. Marks are validated automatically.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">4. Missed Deadlines</h3>
              <p>If you missed a deadline, use "Request Edit Access" to ask admin for extension.</p>
            </div>
          </div>
        </Card>


        <div className="text-center mt-8">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;
