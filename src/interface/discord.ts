export interface IAccessTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: 'identify' | 'identify connections';
}

export interface IDiscordUserInfoResponse {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
}
