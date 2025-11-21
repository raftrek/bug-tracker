import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProfileSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Create a preview URL
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', name);
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            } else {
                formData.append('avatarUrl', avatarUrl);
            }

            const response = await api.put('/auth/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            updateUser(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Profile Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Avatar
                    </label>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => {
                                    setAvatarUrl(e.target.value);
                                    setSelectedFile(null); // Clear file if URL is manually edited
                                }}
                                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                                placeholder="https://example.com/avatar.jpg"
                            />
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">OR</span>
                            <label className="cursor-pointer bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                                Upload Image
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Provide a URL or upload an image (max 5MB).
                        </p>
                    </div>
                </div>

                {avatarUrl && (
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <img
                            src={avatarUrl}
                            alt="Avatar preview"
                            className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                            }}
                        />
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">Preview</p>
                            <p>This is how your avatar will look.</p>
                        </div>
                    </div>
                )}

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};
