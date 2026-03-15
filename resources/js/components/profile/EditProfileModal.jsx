import React from 'react';
import Modal from '../common/Modal';
import EditProfileForm from './EditProfileForm';

const EditProfileModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg">
            <div className="-mx-5 -mt-4 -mb-4">
                <EditProfileForm onSuccess={onClose} onCancel={onClose} />
            </div>
        </Modal>
    );
};

export default EditProfileModal;
