// src/features/admin/pages/FacultyManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import FacultyList from '../components/faculty-management/FacultyList';
import FacultyFilters from '../components/faculty-management/FacultyFilters';
import FacultyModal from '../components/faculty-management/FacultyModal';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useToast } from '../../../shared/hooks/useToast';
import { INITIAL_FACULTY } from '../components/faculty-management/facultyData';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const FacultyManagement = () => {
  const [allFaculty, setAllFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const { showToast } = useToast();

  // Simulate fetching faculty from database based on filters
  const fetchFaculty = async () => {
    if (!filters) return;
    
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter the mock data based on applied filters
      const filteredData = INITIAL_FACULTY.filter(member => {
        // School filter (required)
        if (member.schoolId !== parseInt(filters.school)) return false;

        // Programme filter (required)
        if (member.programId !== parseInt(filters.programme)) return false;

        // Year filter (required)
        if (member.yearId !== parseInt(filters.year)) return false;

        // Semester filter (required)
        if (member.semesterId !== parseInt(filters.semester)) return false;

        return true;
      });

      setAllFaculty(filteredData);
      setSearchQuery(''); // Reset search when filters change
    } catch (error) {
      showToast('Error fetching faculty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on search query
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return allFaculty;

    const query = searchQuery.toLowerCase();
    return allFaculty.filter(member => {
      // Search by name
      if (member.name.toLowerCase().includes(query)) return true;
      
      // Search by employee ID
      if (member.id.toLowerCase().includes(query)) return true;
      
      // Search by email
      if (member.email.toLowerCase().includes(query)) return true;
      
      // Search in projects guided or panel
      if (member.projects && member.projects.length > 0) {
        return member.projects.some(project => 
          project.title.toLowerCase().includes(query) ||
          project.studentName.toLowerCase().includes(query) ||
          project.studentRegNo.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
  }, [allFaculty, searchQuery]);

  // Fetch faculty when filters are complete
  useEffect(() => {
    if (filters) {
      fetchFaculty();
    }
  }, [filters]);

  const handleAddFaculty = async (facultyData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newFaculty = {
        id: Math.max(...INITIAL_FACULTY.map(f => f.id), 0) + 1,
        ...facultyData,
        projects: []
      };
      
      // In real implementation, this would be added to database
      INITIAL_FACULTY.push(newFaculty);
      
      setIsModalOpen(false);
      showToast('Faculty member added successfully', 'success');
      
      // Refresh the list
      fetchFaculty();
    } catch (error) {
      showToast('Error adding faculty member', 'error');
    }
  };

  const handleEditFaculty = async (facultyData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In real implementation, this would update the database
      const index = INITIAL_FACULTY.findIndex(f => f.id === selectedFaculty.id);
      if (index !== -1) {
        INITIAL_FACULTY[index] = { ...INITIAL_FACULTY[index], ...facultyData };
      }
      
      setSelectedFaculty(null);
      setIsModalOpen(false);
      showToast('Faculty member updated successfully', 'success');
      
      // Refresh the list
      fetchFaculty();
    } catch (error) {
      showToast('Error updating faculty member', 'error');
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In real implementation, this would delete from database
        const index = INITIAL_FACULTY.findIndex(f => f.id === id);
        if (index !== -1) {
          INITIAL_FACULTY.splice(index, 1);
        }
        
        showToast('Faculty member deleted successfully', 'success');
        
        // Refresh the list
        fetchFaculty();
      } catch (error) {
        showToast('Error deleting faculty member', 'error');
      }
    }
  };

  const openEditModal = (member) => {
    setSelectedFaculty(member);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedFaculty(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              
            </p>
          </div>
          <Button onClick={openAddModal}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Faculty
          </Button>
        </div>

        <FacultyFilters onFilterComplete={setFilters} />

        {/* Search Bar - Only shown when data is loaded */}
        {filters && allFaculty.length > 0 && !loading && (
          <div className="mt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, employee ID, or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredFaculty.length} of {allFaculty.length} faculty members
            </p>
          </div>
        )}

        {/* Faculty List - Only shown when filters are complete */}
        {filters && (
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <FacultyList 
                faculty={filteredFaculty}
                onEdit={openEditModal}
                onDelete={handleDeleteFaculty}
              />
            )}
          </div>
        )}
      </div>

      <FacultyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFaculty(null);
        }}
        onSave={selectedFaculty ? handleEditFaculty : handleAddFaculty}
        initialData={selectedFaculty}
      />
    </div>
  );
};

export default FacultyManagement;
