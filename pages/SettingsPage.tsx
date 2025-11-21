import React from 'react';
import { Link } from 'react-router-dom';
import { ProfileSettings } from '../components/ProfileSettings';
import { ThemeToggle } from '../components/ThemeToggle';
import { ChevronLeftIcon } from '../components/icons';

const SettingsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
            <header className="bg-white dark:bg-neutral-800 shadow-sm p-4 sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-700">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/projects"
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Settings</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 max-w-2xl">
                <ProfileSettings />
            </main>
        </div>
    );
};

export default SettingsPage;
