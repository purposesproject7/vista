// src/features/admin/components/student-management/ContactCard.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const ContactCard = ({ student }) => {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <EnvelopeIcon className="w-4 h-4 text-blue-600" />
        Contact Information
      </h3>
      <div className="space-y-0">
        <InfoRow 
          icon={EnvelopeIcon} 
          label="Email" 
          value={student.email}
        />
        <InfoRow 
          icon={PhoneIcon} 
          label="Phone" 
          value={student.phone}
        />
      </div>
    </Card>
  );
};

export default ContactCard;
