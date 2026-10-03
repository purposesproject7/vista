import React from 'react';
import Modal from '../../../../shared/components/Modal';
import Button from '../../../../shared/components/Button';
import { ExclamationTriangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const DuplicateProjectsModal = ({ isOpen, onClose, duplicates, onNotify, isSending }) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Duplicate Projects Detected"
            size="lg"
        >
            <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                The following {duplicates.length} students resulted in a duplicate entry error (likely due to conflicting Project Names or Student ID).
                                <br />
                                We prevented these uploads to avoid data corruption.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-60 border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {duplicates.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{item.regNo}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                        {item.guideName} <br /> <span className="text-xs text-gray-400">{item.guideEmail}</span>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{item.projectName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} disabled={isSending}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onNotify}
                        disabled={isSending}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                    >
                        <EnvelopeIcon className="w-4 h-4" />
                        {isSending ? 'Sending Emails...' : 'Notify All Guides via Email'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DuplicateProjectsModal;
