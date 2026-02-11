import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateGroupConversation } from '../../hooks/useGroupConversations';
import { useSuggestedUsers } from '../../hooks/useUsers';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import useAuthStore from '../../store/authStore';

const NewGroupModal = ({ isOpen, onClose, onCreated }) => {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { name: '' } });
    const [selectedIds, setSelectedIds] = useState([]);
    const createMutation = useCreateGroupConversation();
    const { data: suggestedUsers = [] } = useSuggestedUsers();

    const name = watch('name', '');

    const toggleMember = (id) => {
        if (id === user?.id) return;
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onSubmit = async (data) => {
        if (!data.name?.trim()) return;
        if (selectedIds.length === 0) {
            import('react-hot-toast').then(({ default: toast }) =>
                toast.error('Select at least one member')
            );
            return;
        }

        try {
            const res = await createMutation.mutateAsync({
                name: data.name.trim(),
                member_ids: selectedIds,
            });
            reset();
            setSelectedIds([]);
            onClose();
            if (res?.data?.group) {
                onCreated?.(res.data.group);
            }
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        reset();
        setSelectedIds([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Group" size="lg">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Group name
                        </label>
                        <input
                            {...register('name', { required: 'Name is required', maxLength: 100 })}
                            type="text"
                            placeholder="Enter group name"
                            className="w-full px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Add members
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-2">
                            {suggestedUsers
                                .filter((u) => u.id !== user?.id)
                                .slice(0, 20)
                                .map((u) => (
                                    <label
                                        key={u.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(u.id)}
                                            onChange={() => toggleMember(u.id)}
                                            className="rounded text-[var(--theme-accent)]"
                                        />
                                        <Avatar
                                            src={u.profile_picture}
                                            alt={u.name}
                                            size="sm"
                                        />
                                        <span className="text-gray-200">{u.name}</span>
                                        {u.username && (
                                            <span className="text-gray-500 text-sm">
                                                @{u.username}
                                            </span>
                                        )}
                                    </label>
                                ))}
                            {suggestedUsers.filter((u) => u.id !== user?.id).length === 0 && (
                                <p className="text-gray-500 text-sm p-2">
                                    No suggested users. Try following more people first.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!name.trim() || selectedIds.length === 0 || createMutation.isPending}
                        loading={createMutation.isPending}
                    >
                        Create Group
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default NewGroupModal;
