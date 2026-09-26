import { ChannelTypeEnum } from "@/constants/channels"
import { createHmac, timingSafeEqual } from "crypto"


const OAUTH_STATE_SECRET = process.env.CHANNEL_OAUTH_STATE_SECRET || "dev_secret_oauth_state_secret_32_bytes!!";

export type OAuthStatePayload = {
  userId: string
  channelTypeId: string
  channelType: ChannelTypeEnum
  redirectTo?: string
  exp: number
}
export function createOAuthState(payload: Omit<OAuthStatePayload, 'exp'> & {
    expiresInMs?: number
}) {
    const statePayload:OAuthStatePayload = {
        ...payload,
        exp: Date.now() + (payload.expiresInMs ?? 10 * 60 * 1000)
    }
    const encodedState = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const signature = createHmac('sha256', OAUTH_STATE_SECRET).update(encodedState).digest('base64url');

    return `${encodedState}.${signature}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload {
    const [encodedState, signature] = state.split('.');
    if(!encodedState || !signature) {
        throw new Error('Invalid state format');
    }
    const expectedSignature = createHmac('sha256', OAUTH_STATE_SECRET).update(encodedState).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        throw new Error('Invalid state signature');
    }
    const statePayload = JSON.parse(Buffer.from(encodedState, 'base64url').toString('utf-8'));


    if (!statePayload.exp || statePayload.exp < Date.now()) {
        throw new Error('OAuth state expired');
    }
    return statePayload;
}