export interface Game {
  id: string;
  code: string;
  name: string;
  provider: string;
  providerId: number | string;
  image: string;
  category: string;
  isOriginal?: boolean;
  isLive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  rtp?: number;
  minBet?: number;
  maxBet?: number;
  externalCode?: string;
}

export interface Provider {
  id: number | string;
  name: string;
  slug: string;
  logo: string;
  gameCount?: number;
}

export interface User {
  id: string;
  code: string;
  email: string;
  name: string;
  balance: number;
  avatar?: string;
}

export interface Winner {
  id: string;
  userName: string;
  gameName: string;
  gameImage: string;
  amount: number;
  timestamp: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface GameLaunchResponse {
  status: boolean;
  msg: string;
  launch_url: string;
  user_code: string;
  user_balance: number;
  user_created: boolean;
  name: string;
}

export interface BalanceResponse {
  msg: string;
  balance: number;
}
