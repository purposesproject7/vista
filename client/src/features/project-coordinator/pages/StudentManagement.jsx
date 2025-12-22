// src/features/project-coordinator/pages/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import AcademicFilterSelector from '../components/shared/AcademicFilterSelector';
import StudentList from '../components/student-management/StudentList';
import StudentCreate from '../components/student-management/StudentCreate';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { getFilteredData } from '../data/sampleData';

const StudentManagement = () => {
  const [filters, setFilters] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [activeTab, setActiveTab] = useState('view');
  const { showToast } = useToast();

  // Load coordinator permissions
  useEffect(() => {
    const fetchCoordinatorPermissions = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsPrimary(true); // Mock: assuming user is primary coordinator
      } catch (error) {
        console.error('Error fetching coordinator permissions:', error);
        showToast('Error loading permissions', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatorPermissions();
  }, [showToast]);

  // Fetch students when filters are complete
  useEffect(() => {
    if (filters && activeTab === 'view') {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Get filtered students based on selected year and semester
      if (filters) {
        const filteredStudents = getFilteredData(filters.year, filters.semester, 'students');
        setStudents(filteredStudents);
        showToast(`Loaded ${filteredStudents.length} students for ${filters.year}-26, Semester ${filters.semester}`, 'success');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student) => {
    // Details view would be implemented here
    showToast(`Viewing details for ${student.name}`, 'info');
  };

  const handleFilterComplete = (selectedFilters) => {
    setFilters(selectedFilters);
  };

  const studentTabs = [
    {
      id: 'view',
      label: 'Student View',
      icon: EyeIcon,
      description: 'View existing students',
      enabled: true
    },
    {
      id: 'create',
      label: 'Student Create',
      icon: PlusCircleIcon,
      description: 'Create/upload students',
      enabled: isPrimary // Only primary coordinators can create
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isPrimary ? 'You have full access to student management' : 'You have view-only access'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2 flex-wrap">
            {studentTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = !tab.enabled;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${isDisabled 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                      : isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={isDisabled ? `Only primary coordinators can ${tab.label.toLowerCase()}` : tab.description}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Filter Selector */}
            <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

            {/* Student List */}
            {filters && (
              <StudentList 
                students={students} 
                loading={loading}
                onViewDetails={handleViewDetails}
                isPrimary={isPrimary}
              />
            )}
          </div>
        )}

        {activeTab === 'create' && isPrimary && (
          <StudentCreate />
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
