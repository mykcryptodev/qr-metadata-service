export type QRDailyLinkWinner = {
  id: number;
  token_id: number;
  winner_address: string;
  amount: number;
  url: string;
  display_name: string | null;
  farcaster_username: string | null;
  basename: string | null;
  usd_value: number;
  ens_name: string | null;
  twitter_username: string | null;
  contributors: unknown[];
  auction_version: string;
};

export type QRDailyLinkResponse = {
  success: boolean;
  data: QRDailyLinkWinner[];
};

export type OgMetadata = {
  image: string | null;
  title: string | null;
  description: string | null;
};

export type QRWinnerApiResponse = {
  winner: QRDailyLinkWinner | null;
  og: OgMetadata;
  source: 'microlink' | 'direct' | 'playwright' | 'none';
  fetchedAt: string;
};
