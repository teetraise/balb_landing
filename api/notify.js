export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    res.status(500).json({ error: 'Bot is not configured' })
    return
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'
  const referer = req.headers['referer'] || null
  const path = typeof req.body?.path === 'string' ? req.body.path : '-'

  const text = [
    '🌐 Новый визит на сайт',
    `IP: ${ip}`,
    `Устройство: ${userAgent}`,
    `Страница: ${path}`,
    referer ? `Referer: ${referer}` : null,
  ].filter(Boolean).join('\n')

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })

    if (!tgRes.ok) {
      res.status(502).json({ error: 'Telegram request failed' })
      return
    }

    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to send notification' })
  }
}
