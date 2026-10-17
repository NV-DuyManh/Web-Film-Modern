export async function passwordRecoveryRequest(action, values = {}, signal) {
    const response = await fetch('/api/password-recovery', {
        method: 'POST', cache: 'no-store', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, action }),
    });
    let json;
    try { json = await response.json(); } catch { throw new Error('RECOVERY_UNAVAILABLE'); }
    if (!response.ok) throw Object.assign(new Error(json.error || 'RECOVERY_UNAVAILABLE'), { status: response.status });
    return json.data;
}
