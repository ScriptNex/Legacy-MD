import { promises as fs } from 'fs'

let proposals = {}

let handler = async (m, { conn, command, usedPrefix, args }) => {
    let user = m.sender
    let mentioned = m.mentionedJid && m.mentionedJid[0]
    let target = mentioned ? mentioned : m.quoted ? m.quoted.sender : null

    switch (command) {

        // 💍 PROPONER MATRIMONIO
        case 'marry': {

            if (!target) {
                await conn.reply(m.chat,
`❀ Debes mencionar o responder a alguien para proponer matrimonio.
Ejemplo:
> *${usedPrefix}marry @usuario*`, m)
                return
            }

            if (target === user) {
                await conn.reply(m.chat, `ꕥ No puedes casarte contigo mismo.`, m)
                return
            }

            let users = global.db.data.users

            if (users[user].marry) {
                let pareja = users[user].marry
                await conn.reply(m.chat, `ꕥ Ya estás casado/a con *${users[pareja].name}*.`, m)
                return
            }

            if (users[target].marry) {
                let pareja = users[target].marry
                await conn.reply(m.chat, `ꕥ Ese usuario ya está casado/a con *${users[pareja].name}*.`, m)
                return
            }

            // SI AMBOS SE PROPONEN → MATRIMONIO AUTOMÁTICO
            if (proposals[target] && proposals[target] === user) {
                delete proposals[target]
                users[user].marry = target
                users[target].marry = user

                await conn.reply(m.chat,
`✩.･:｡≻──── ⋆♡⋆ ────.•:｡✩
¡Se han casado! 💞

♡ Esposo/a: *${users[user].name}*
♡ Esposo/a: *${users[target].name}*

Disfruten su luna de miel 💗
✩.･:｡≻──── ⋆♡⋆ ────.•:｡✩`, m)

                return
            }

            // REGISTRAR PROPUESTA
            proposals[user] = target

            // LA PROPUESTA EXPIRA EN 2 MINUTOS
            setTimeout(() => {
                if (proposals[user]) delete proposals[user]
            }, 120000)

            await conn.reply(m.chat,
`♡ *${users[target].name}*, *${users[user].name}* te ha propuesto matrimonio.
  
⚘ Responde con:
> ● *${usedPrefix}marry* para aceptar.
> ● La propuesta expira en 2 minutos.`, m)
        }
        break

        // 💔 DIVORCIO
        case 'divorce': {

            let users = global.db.data.users

            if (!users[user].marry) {
                await conn.reply(m.chat, `✎ Tú no estás casado/a con nadie.`, m)
                return
            }

            let pareja = users[user].marry

            users[user].marry = ''
            users[pareja].marry = ''

            await conn.reply(m.chat,
`ꕥ *${users[user].name}* y *${users[pareja].name}* se han divorciado.`, m)
        }
        break
    }
}

// CONFIGURACIÓN DEL HANDLER
handler.help = ['marry', 'divorce']
handler.command = ['marry', 'divorce']
handler.tags = ['fun']
handler.group = true

export default handler
