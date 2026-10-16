import { WingedFrame } from './client/header/AvatarFrames';
import { getDefaultAvatar } from '../utils/appUtils';
import { getPlanAppearance } from '../utils/planAppearance';

export default function FramedUserAvatar({ user, plan, small = false }) {
    const theme = user?.selectedFrame || getPlanAppearance(plan).theme;
    const decorated = theme !== 'slate';
    const size = decorated ? (small ? 28 : 40) : (small ? 32 : 44);
    const space = decorated ? (small ? 48 : 64) : size;
    return (
        <span data-avatar-frame={theme} className="relative flex shrink-0 items-center justify-center" style={{ width: space, height: space }}>
            <WingedFrame theme={theme} size={size}>
                <img src={user?.avatarUrl || getDefaultAvatar(user?.sexID)} alt="" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = getDefaultAvatar(user?.sexID); }}
                    className="h-full w-full rounded-full bg-slate-800 object-cover" />
            </WingedFrame>
        </span>
    );
}
