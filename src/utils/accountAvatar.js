import Logo5 from '../assets/Logo5.png';
import Female from '../assets/Female.png';
import Male from '../assets/Male.png';

export function resolveAccountAvatar(user) {
    const avatar = user.avatarUrl;
    return { ...user, avatarUrl: !avatar || avatar.includes('src/assets') || avatar.includes('Logo') ? (user.sexID === 'Female' ? Female : user.sexID === 'Male' ? Male : Logo5) : avatar };
}
