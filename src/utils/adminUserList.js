export function filterAdminUsers(users = [], { search = '', role = 'all', onlineIds = new Set() } = {}) {
    const keyword = search.trim().toLowerCase();
    return users.filter(user => {
        const isAdmin = user.role === 'admin';
        const matchesRole = role === 'all' || (role === 'admin' ? isAdmin : !isAdmin);
        return matchesRole && (!keyword || [user.name, user.fullName, user.email, user.phone]
            .some(value => String(value ?? '').toLowerCase().includes(keyword)));
    }).sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)));
}
