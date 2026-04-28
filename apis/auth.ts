import http, { authTokenStorage } from './config';

import {
  type AuthTokenResponse,
  type GoogleLoginRequest,
  type SendAuthEmailRequest,
  type VerifyAuthTokenResponse,
  type VerifyTokenRequest,
} from '@/types/apis/auth';
import { type Member } from '@/types/models/member';

export const authApi = {
  sendAuthEmail: (request: SendAuthEmailRequest) => http.post<void>('/auth/send-email', request),
  verifyToken: async (request: VerifyTokenRequest) => {
    const response = await http.post<VerifyAuthTokenResponse>('/auth/verify-token', request);
    await authTokenStorage.setAccessToken(response.data.accessToken);
    return response;
  },
  loginWithGoogle: async (request: GoogleLoginRequest) => {
    const response = await http.post<AuthTokenResponse>('/auth/google', request);
    await authTokenStorage.setTokens(response.data);
    return response;
  },
  logout: async () => {
    try {
      return await http.post<void>('/auth/logout');
    } finally {
      await authTokenStorage.clear();
    }
  },
  me: () => http.get<Member>('/me'),
};
