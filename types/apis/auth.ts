export interface SendAuthEmailRequest {
  email: string;
  fromApp: boolean;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyAuthTokenResponse {
  accessToken: string;
}
