import React, { useState } from 'react';
import { Project, Role } from '../types';
import { addMemberToProject, removeMemberFromProject, updateMemberRole } from '../services/projectService';

interface TeamModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ project, isOpen, onClose, onUpdate }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>(Role.MEMBER);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await addMemberToProject(project.id, email, role);
            setEmail('');
            setRole(Role.MEMBER);
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add member. User must be registered first.');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (confirm('Are you sure you want to remove this member?')) {
            await removeMemberFromProject(project.id, userId);
            onUpdate();
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        await updateMemberRole(project.id, userId, newRole);
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Member</h3>
                    <form onSubmit={handleAddMember} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email (user must be registered)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {Object.values(Role).map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                    </form>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Current Members</h3>
                    <div className="space-y-3">
                        {project.members && project.members.length > 0 ? (
                            project.members.map((member) => (
                                <div key={member.user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={member.user.avatarUrl} alt={member.user.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.user.id, e.target.value as Role)}
                                            className="px-2 py-1 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        >
                                            {Object.values(Role).map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.user.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No members yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
