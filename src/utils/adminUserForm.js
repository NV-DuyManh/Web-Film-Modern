export function adminUserPasswordError(user) {
    return !user.id && !String(user.password ?? '').trim() ? 'Please enter password' : '';
}

export function adminUserSubmitData(user) {
    const data = { ...user };
    // Omitting this field in a Firestore update preserves the existing credential.
    if (user.id && !String(user.password ?? '').trim()) delete data.password;
    return data;
}
