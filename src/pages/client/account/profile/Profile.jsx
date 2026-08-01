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

const Profile = () => {
    const { isLogin, setGlobalAvatarPreview } = useContext(AuthContext);
    const subscriptions = useContext(SubscriptionContext) || [];
    const plans = useContext(PlanContext) || [];

    const getExpiryDate = (p) => {
        if (!p || !p.expiryDate) return new Date(0);
        if (typeof p.expiryDate.toDate === 'function') return p.expiryDate.toDate();
        if (p.expiryDate.seconds) return new Date(p.expiryDate.seconds * 1000);
        return new Date(p.expiryDate);
    };

    const currentPlanInfo = React.useMemo(() => {
        if (!isLogin) return { name: 'FREE', level: 0, theme: 'blue' };
        if (isLogin.role === 'Admin') return { name: 'ADMIN', level: 99, theme: 'red' };

        const userSubs = subscriptions.filter(p => p.userID === isLogin.id && getExpiryDate(p) > new Date());
        if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'blue' };

        const highestSub = userSubs.reduce((max, item) => {
            const currentPlan = getObjectById(plans, item.planID);
            const maxPlan = getObjectById(plans, max.planID);
            return (currentPlan?.level || 0) > (maxPlan?.level || 0) ? item : max;
        }, userSubs[0]);

        const highestPlan = getObjectById(plans, highestSub.planID);
        if (!highestPlan) return { name: 'VIP', level: 1, theme: 'cyan' };

        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const index = sortedPlans.findIndex(p => p.id === highestPlan.id);
        const themeNames = ['slate', 'cyan', 'yellow', 'rose'];
        const theme = themeNames[index] || 'yellow';

        return {
            name: highestPlan.name,
            level: highestPlan.level,
            theme: theme,
        };
    }, [isLogin, subscriptions, plans]);

    const AVAILABLE_FRAMES = React.useMemo(() => {
        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const themes = ['blue', 'cyan', 'yellow', 'rose', 'purple', 'emerald'];
        
        return sortedPlans.map((plan, index) => ({
            id: themes[index] || 'slate',
            label: plan.name,
            minLevel: plan.level
        }));
    }, [plans]);

    const currentSelectedTheme = isLogin?.selectedFrame || currentPlanInfo.theme;

    const handleAvatarChange = async (file) => {
        if (!isLogin) return;
        const reader = new FileReader();
        reader.onload = async () => {
            setGlobalAvatarPreview(reader.result);
            const uploadedUrl = await uploadImageToCloudinary(file, "Users");
            await updateDocument("Users", { id: isLogin.id, imgUrl: uploadedUrl });
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
};

export default Profile;
