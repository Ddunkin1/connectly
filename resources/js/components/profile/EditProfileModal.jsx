import React from 'react';
import Modal from '../common/Modal';
import EditProfileForm from './EditProfileForm';

const EditProfileModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="2xl">
            <div className="theme-surface -mx-6 -mt-4 -mb-4 rounded-b-xl overflow-hidden">
                <EditProfileForm onSuccess={onClose} onCancel={onClose} />
            </div>
        </Modal>
    );
};

export default EditProfileModal;
