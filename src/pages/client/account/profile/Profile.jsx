import React, { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument } from '../../../../services/firebaseService';
import Swal from 'sweetalert2';
import { uploadImageToCloudinary } from '../../../../config/cloudinaryConfig';
import { SubscriptionContext } from '../../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import { getUserPlanInfo } from '../../../../utils/themeUtils';
function Profile() {
    const { isLogin, setGlobalAvatarPreview } = useContext(AuthContext);
    const subscriptions = useContext(SubscriptionContext) || [];
    const plans = useContext(PlanContext) || [];

    const currentPlanInfo = React.useMemo(() => {
        return getUserPlanInfo(isLogin, subscriptions, plans);
    }, [isLogin, subscriptions, plans]);

    const AVAILABLE_FRAMES = React.useMemo(() => {
        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const themes = ['blue', 'cyan', 'yellow', 'rose', 'purple', 'emerald'];
        
        const frames = sortedPlans.map((plan, index) => ({
            id: themes[index] || 'slate',
            label: plan.name,
            minLevel: plan.level
        }));

        if (isLogin?.role === 'admin') {
            frames.push({
                id: 'admin',
                label: 'Admin',
                minLevel: 999
            });
        }

        return frames;
    }, [plans, isLogin]);

    const currentSelectedTheme = isLogin?.selectedFrame || currentPlanInfo.theme;

    const handleAvatarChange = async (file) => {
        if (!isLogin) return;
        const reader = new FileReader();
        reader.onload = async () => {
            setGlobalAvatarPreview(reader.result);
            const uploadedUrl = await uploadImageToCloudinary(file, "Users");
            await updateDocument("Users", { id: isLogin.id, avatarUrl: uploadedUrl });
            setGlobalAvatarPreview(null);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (formData) => {
        if (!isLogin) return false;
        await updateDocument("Users", { id: isLogin.id, ...formData });
        Swal.fire({
            icon: 'success', title: 'Thành công', text: 'Cập nhật thông tin thành công!',
            background: '#0f172a', color: '#fff', confirmButtonColor: '#22d3ee'
        });
        return true;
    };

    const handleSavePassword = async (passwordData) => {
        if (!isLogin) return false;
        if (passwordData.currentPassword !== isLogin.password) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Mật khẩu hiện tại không đúng!', background: '#0f172a', color: '#fff', confirmButtonColor: '#22d3ee' });
            return false;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Mật khẩu mới không khớp!', background: '#0f172a', color: '#fff', confirmButtonColor: '#22d3ee' });
            return false;
        }
        if (passwordData.newPassword.length < 6) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Mật khẩu phải từ 6 ký tự trở lên!', background: '#0f172a', color: '#fff', confirmButtonColor: '#22d3ee' });
            return false;
        }
        
        await updateDocument("Users", { id: isLogin.id, password: passwordData.newPassword });
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Đổi mật khẩu thành công!', background: '#0f172a', color: '#fff', confirmButtonColor: '#22d3ee' });
        return true;
    };

    const handleSelectFrame = async (frameId) => {
        if (!isLogin) return;
        await updateDocument("Users", { id: isLogin.id, selectedFrame: frameId });
    };

    return (
        <div className="flex flex-col gap-4 overflow-auto custom-scrollbar h-full pr-2">
            <ProfileHeader 
                isLogin={isLogin}
                currentPlanInfo={currentPlanInfo}
                currentSelectedTheme={currentSelectedTheme}
                AVAILABLE_FRAMES={AVAILABLE_FRAMES}
                onAvatarChange={handleAvatarChange}
                onSelectFrame={handleSelectFrame}
            />
            
            <ProfileForm 
                isLogin={isLogin}
                onSaveProfile={handleSaveProfile}
                onSavePassword={handleSavePassword}
            />
        </div>
    );
}

export default Profile;
