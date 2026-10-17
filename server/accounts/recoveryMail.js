import process from 'node:process';

export function recoveryMailConfigured(env = process.env) {
    return ['EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_RESET_TEMPLATE_ID', 'PASSWORD_RESET_SECRET']
        .every(key => typeof env[key] === 'string' && !!env[key].trim());
}

export function createRecoveryMailer(env = process.env, fetcher = fetch) {
    return async ({ email, code, expiresInMinutes, requestId }) => {
        if (!recoveryMailConfigured(env)) throw new Error('Recovery mail is not configured');
        const response = await fetcher('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(12_000),
            body: JSON.stringify({
                service_id: env.EMAILJS_SERVICE_ID, template_id: env.EMAILJS_RESET_TEMPLATE_ID,
                user_id: env.EMAILJS_PUBLIC_KEY, accessToken: env.EMAILJS_PRIVATE_KEY,
                template_params: { mfilm_reset: true, to_email: email, code, expires_minutes: expiresInMinutes, app_name: 'MFilm', request_id: requestId },
            }),
        });
        // Provider response bodies may contain email addresses or other private data.
        if (!response.ok) throw Object.assign(new Error('Recovery mail delivery failed'), { code: `emailjs-http-${response.status}` });
    };
}
