import { WingedFrame } from './client/header/AvatarFrames';
import { getDefaultAvatar } from '../utils/appUtils';
import { getAvatarFrameTheme } from '../utils/planAppearance';

export default function FramedUserAvatar({ user, plan, small = false, size = small ? 28 : 40, src, alt = '' }) {
    const theme = getAvatarFrameTheme(user, plan);
    const ultra = ['yellow', 'red', 'rose', 'admin'].includes(theme);
    const space = ultra ? Math.ceil(size * 1.9) : size + (small ? 20 : 24);
    return (
        <span data-avatar-frame={theme} className="relative flex shrink-0 items-center justify-center" style={{ width: space, height: space }}>
            <WingedFrame theme={theme} size={size}>
                <img src={src || user?.avatarUrl || user?.imgUrl || getDefaultAvatar(user?.sexID)} alt={alt} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = getDefaultAvatar(user?.sexID); }}
                    className="h-full w-full rounded-full bg-slate-800 object-cover" />
            </WingedFrame>
        </span>
    );
}
