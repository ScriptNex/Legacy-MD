import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
let mentionedJid = await m.mentionedJid
let userId = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.sender
let totalreg = Object.keys(global.db.data.users).length
let totalCommands = Object.values(global.plugins).filter((v) => v.help && v.tags).length

let txt = `
> Hola  @${userId.split('@')[0]}, Soy *${botname}*,aquí tienes tu menú ✧˖°

੭₍⸝⸝> ⩊ <⸝⸝₎੭  Info del bot ⋆｡°✩

• *Tipo*: ${(conn.user.jid == global.conn.user.jid ? 'Principal' : 'Sub-Bot')}
• *Usuarios*: ${totalreg.toLocaleString()}
• *Versión*: ${vs}
• *Plugins*: ${totalCommands}
• *Librería*": ${libreria}

`.trim()
await conn.sendMessage(m.chat, { 
text: txt,
contextInfo: {
mentionedJid: [userId],
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: channelRD.id,
serverMessageId: '',
newsletterName: channelRD.name
},
externalAdReply: {
title: botname,
body: textbot,
mediaType: 1,
mediaUrl: redes,
sourceUrl: redes,
thumbnail: await (await fetch(banner)).buffer(),
showAdAttribution: false,
containsAutoReply: true,
renderLargerThumbnail: true
}}}, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help']

export default handler
