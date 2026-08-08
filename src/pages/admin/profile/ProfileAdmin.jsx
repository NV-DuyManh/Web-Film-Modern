import React from 'react';
import Profile from '../../client/account/profile/Profile';

function ProfileAdmin() {
    return (
        <div className="w-full h-[calc(100vh-100px)] p-6 rounded-tl-3xl shadow-2xl relative overflow-hidden bg-transparent">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="h-full relative">
                <Profile />
            </div>
        </div>
    );
}

export default ProfileAdmin;
