import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export function generateTwoFactorSecret() {
    return authenticator.generateSecret();
}

export function generateTwoFactorToken(secret: string) {
    return authenticator.generate(secret);
}

export function verifyTwoFactorToken(token: string, secret: string) {
    console.log('[2FA Debug] Start Verification');
    console.log('[2FA Debug] Token received:', token);
    console.log('[2FA Debug] Secret used:', secret);
    
    // Check if secret is valid base32 (basic check)
    if (!secret) {
        console.error('[2FA Debug] Secret is missing!');
        return false;
    }

    try {
        // Log generation options to see what's happening
        const options = authenticator.allOptions();
        console.log('[2FA Debug] Authenticator Options:', JSON.stringify(options));

        const isValid = authenticator.verify({ token, secret });
        console.log('[2FA Debug] Verification Result:', isValid);
        
        if (!isValid) {
            // Generate what the expected token should be for debugging
            const expected = authenticator.generate(secret);
            console.log('[2FA Debug] Expected Token was:', expected);
            console.log('[2FA Debug] Time Diff:', Math.abs(parseInt(token) - parseInt(expected)));
        }

        return isValid;
    } catch (err) {
        console.error('[2FA Debug] Verification Exception:', err);
        return false;
    }
}

export async function generateQRCode(otpauth: string) {
    try {
        return await QRCode.toDataURL(otpauth);
    } catch (err) {
        console.error('QRCode generation error:', err);
        throw err;
    }
}

export function generateOtpPath(serviceName: string, accountName: string, secret: string) {
    return authenticator.keyuri(accountName, serviceName, secret);
}
