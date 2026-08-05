import MALE_AVATAR from '../assets/Male.png';
import FEMALE_AVATAR from '../assets/Female.png';

/**
 * Returns gender-appropriate default avatar when entity has no custom image.
 * @param {string} sexID - "Male", "Female", or other
 * @returns {string} path to default avatar image
 */
export const getDefaultAvatar = (sexID) => {
    return sexID === 'Female' ? FEMALE_AVATAR : MALE_AVATAR;
};
