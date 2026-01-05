// src/features/admin/components/faculty-management/FacultyViewTab.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Input from '../../../../shared/components/Input';
import FacultyList from './FacultyList';
import FacultyModal from './FacultyModal';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { useToast } from '../../../../shared/hooks/useToast';
import { fetchFaculty, updateFaculty, deleteFaculty } from '../../services/adminApi';

const FacultyViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [allFaculty, setAllFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setAllFaculty([]);
    setSearchQuery('');
  }, []);

  // Fetch faculty when filters change
  useEffect(() => {
    if (filters) {
      loadFaculty();
    }
  }, [filters]);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const response = await fetchFaculty({
        school: filters.school,
        department: filters.department,
        academicYear: filters.academicYear
      });
      
      if (response.success) {
        setAllFaculty(response.faculty || []);
      } else {
        showToast(response.message || 'Failed to load faculty', 'error');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      showToast(error.response?.data?.message || 'Error fetching faculty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on search query
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return allFaculty;

    const query = searchQuery.toLowerCase();
    return allFaculty.filter(member => {
      if (member.name?.toLowerCase().includes(query)) return true;
      if (member.employeeId?.toLowerCase().includes(query)) return true;
      if (member.email?.toLowerCase().includes(query)) return true;
      if (member.specialization?.some(s => s.toLowerCase().includes(query))) return true;
      
      return false;
    });
  }, [allFaculty, searchQuery]);

  const handleEditFaculty = async (facultyData) => {
    try {
      const response = await updateFaculty(selectedFaculty.employeeId, facultyData);
      
      if (response.success) {
        // Reload faculty list to get updated data
        await loadFaculty();
        showToast('Faculty member updated successfully', 'success');
        setIsModalOpen(false);
        setSelectedFaculty(null);
      } else {
        showToast(response.message || 'Failed to update faculty', 'error');
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      showToast(error.response?.data?.message || 'Error updating faculty member', 'error');
    }
  };

  const handleDeleteFaculty = async (member) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${member.name}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        const response = await deleteFaculty(member.employeeId);
        
        if (response.success) {
          // Remove from local state
          const updatedFaculty = allFaculty.filter(f => f._id !== member._id);
          setAllFaculty(updatedFaculty);
          showToast('Faculty member deleted successfully', 'success');
        } else {
          showToast(response.message || 'Failed to delete faculty', 'error');
        }
      } catch (error) {
        console.error('Error deleting faculty:', error);
        showToast(error.response?.data?.message || 'Error deleting faculty member', 'error');
      }
    }
  };

  const openEditModal = (member) => {
    setSelectedFaculty(member);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Faculty Content - only show when filters are complete */}
      {filters && (
        <>
          {/* Search Bar */}
          {allFaculty.length > 0 && !loading && (
            <div className="mb-6">
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

          {/* Faculty List */}
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

          {/* Edit Modal */}
          <FacultyModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedFaculty(null);
            }}
            onSave={handleEditFaculty}
            faculty={selectedFaculty}
            filters={filters}
          />
        </>
      )}
    </div>
  );
};

export default FacultyViewTab;
