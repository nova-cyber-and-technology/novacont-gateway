import { Config } from '../config';

/**
 * DeepLinkBuilder — Generates redirect URLs for NovaCont Lite (TON) and NovaCont (Base).
 * Discord never touches the blockchain; it only creates links that the web apps handle.
 */
export class DeepLinkBuilder {

  /** Build an escrow creation link for NovaCont Lite (TON) */
  escrowTon(params: { provider: string; amount: string; description: string }): string {
    const base = Config.NOVACONT_LITE.URL;
    const query = new URLSearchParams({
      provider: params.provider,
      amount: params.amount,
      desc: params.description,
    });
    return `${base}?${query.toString()}`;
  }

  /** Build an escrow creation link for NovaCont (Base) */
  escrowBase(params: { provider: string; amount: string; description: string }): string {
    const base = Config.NOVACONT.URL;
    const query = new URLSearchParams({
      provider: params.provider,
      title: 'NovaCont Gateway Escrow',
      desc: params.description,
      price: params.amount,
      acceptDays: '3',
      deliveryDays: '7'
    });
    return `${base}/accept?${query.toString()}`;
  }

  /** Build a wallet connection link */
  walletConnect(network: 'TON' | 'BASE'): string {
    if (network === 'TON') {
      return Config.NOVACONT_LITE.URL;
    }
    return Config.NOVACONT.URL;
  }

  /** Build a profile view link */
  profileLink(network: 'TON' | 'BASE', walletAddress: string): string {
    if (network === 'TON') {
      return `${Config.NOVACONT_LITE.URL}?wallet=${walletAddress}`;
    }
    return `${Config.NOVACONT.URL}/profile/${walletAddress}`;
  }

  /** Build a dispute link */
  disputeLink(network: 'TON' | 'BASE', escrowId: string): string {
    if (network === 'TON') {
      return `${Config.NOVACONT_LITE.URL}?dispute=${escrowId}`;
    }
    return `${Config.NOVACONT.URL}/dispute/${escrowId}`;
  }

  /** Build a marketplace link */
  marketplaceLink(): string {
    return `${Config.NOVACONT.URL}/marketplace`;
  }
}
