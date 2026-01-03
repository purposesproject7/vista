// src/features/project-coordinator/components/project-management/ProjectViewTab.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Badge from '../../../../shared/components/Badge';
import Button from '../../../../shared/components/Button';
import ProjectDetailsModal from './ProjectDetailsModal';
import { AcademicCapIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ProjectViewTab = ({ projects = [], isPrimary = false }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  if (projects.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center text-gray-500">
          <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Project Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{project.title}</h3>
                </div>
                <p className="text-xs text-blue-600 font-medium mb-2">{project.id}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              </div>

              {/* Guide Info */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-500">Guide</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{project.guide.name}</p>
                <p className="text-xs text-gray-600">{project.guide.employeeID}</p>
              </div>

              {/* Team Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserGroupIcon className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-500">Team Members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary">{project.team.length} members</Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetails(project)}
                >
                  View Details & Marks
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />
    </>
  );
};

export default ProjectViewTab;
