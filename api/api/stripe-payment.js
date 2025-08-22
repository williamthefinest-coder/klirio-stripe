// api/stripe-payment.js
const Stripe = require('stripe');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  // CORS: öppet i test. Byt '*' till din app-origin senare.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const key = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!key.startsWith('sk_')) {
      return res.status(500).json({ error: 'missing_or_invalid_secret_key' });
    }

    const stripe = Stripe(key);
    const body = req.body || {};
    const plan = body.plan === 'solo' ? 'solo' : 'team';
    const amount = plan === 'solo' ? 39900 : 89900; // SEK i ören

    const pi = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'sek',
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: randomUUID() }
    );

    return res.status(200).json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      amount,
      currency: 'sek',
      status: pi.status,
    });
  } catch (e) {
    return res.status(400).json({ error: e?.message || 'stripe_error' });
  }
};
