import express from 'express';
import cors from 'cors';
import { StatsCollector } from '../managers/StatsCollector';
import { ProfileManager } from '../managers/ProfileManager';
import { Config } from '../config';

export function startApiServer(port: number, statsCollector: StatsCollector, profileManager: ProfileManager) {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Middleware to verify API Key
  const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (!Config.WEBHOOK_SECRET || apiKey !== Config.WEBHOOK_SECRET) {
      res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
      return;
    }
    next();
  };

  // Webhook for TON (NovaCont Lite)
  app.post('/api/webhook/ton', requireApiKey, async (req, res) => {
    try {
      await statsCollector.processEvent('TON', req.body);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('[API] Error processing TON webhook:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Webhook for Base (NovaCont)
  app.post('/api/webhook/base', requireApiKey, async (req, res) => {
    try {
      await statsCollector.processEvent('BASE', req.body);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('[API] Error processing BASE webhook:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Wallet Link API
  app.post('/api/wallet/link', async (req, res) => {
    const { discordId, network, address } = req.body;
    
    if (!discordId || !network || !address) {
       res.status(400).json({ success: false, error: 'Missing required parameters' });
       return;
    }

    try {
      if (network === 'TON') {
        await profileManager.linkTonWallet(discordId, address);
      } else if (network === 'BASE') {
        await profileManager.linkBaseWallet(discordId, address);
      } else {
         res.status(400).json({ success: false, error: 'Invalid network' });
         return;
      }
      
      // We don't have the client in this file easily, but we can emit an event or pass it
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('[API] Error linking wallet:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.listen(port, () => {
    console.log(`[API] Web server listening on port ${port}`);
  });
}
