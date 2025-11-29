import { promises as fs } from 'fs'

let proposals = {}


const verifi = async () => {
  try {
    const pkg = await fs.readFile('./package.json', 'utf-8')
    const data = JSON.parse(pkg)
    return data?.repository?.url === 'git+https://github.com/ScriptNex/Legacy-MD.git'
  } catch {
    return false
  }
}

let handler = async (m, { conn, command, usedPrefix, args }) => {

  
  if (!await verifi()) {
    return conn.reply(
      m.chat,
      `❀ El comando *${command}* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`,
      m
    )
  }

  try {
    switch (command) {

            case 'marry': {

        let user = m.sender
        let mentioned = await m.mentionedJid
        let target = mentioned && mentioned.length > 0
          ? mentioned[0]
          : m.quoted
            ? m.quoted.sender
            : null

        if (!target) {
          return conn.reply(
            m.chat,
            `❀ Debes mencionar a un usuario o responder su mensaje para proponer o aceptar matrimonio.\n> Ejemplo: *#marry @usuario*`,
            m
          )
        }

        if (user === target) {
          return m.reply('ꕥ No puedes proponerte matrimonio a ti mismo.')
        }

        let users = global.db.data.users

                if (users[user].marry) {
          let pareja = users[user].marry
          return conn.reply(
            m.chat,
            `ꕥ Ya estás casado/a con *${users[pareja].name}*.`,
            m
          )
        }

                if (users[target].marry) {
          let pareja = users[target].marry
          return conn.reply(
            m.chat,
            `ꕥ *${users[target].name}* ya está casado/a con *${users[pareja].name}*.`,
            m
          )
        }

                setTimeout(() => {
          if (proposals[user]) delete proposals[user]
        }, 120000)

        if (proposals[target] && proposals[target] === user) {

          delete proposals[target]

          users[user].marry = target
          users[target].marry = user

          return conn.reply(
            m.chat,
            `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧

•.¸♡ Esposo/a ${users[user].name} ♡¸.•*
•.¸♡ Esposo/a ${users[target].name} ♡¸.•*

\`Disfruten de su luna de miel\`
✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
            m
          )
        }

                proposals[user] = target

        return conn.reply(
          m.chat,
          `♡ *${users[target].name}*, *${users[user].name}* te ha propuesto matrimonio.

⚘ *Responde con:*
> ● *${usedPrefix}${command}* para aceptar.
> ● La propuesta expirará en 2 minutos.`,
          m
        )
      }

            case 'divorce': {

        let user = m.sender
        let users = global.db.data.users

        if (!users[user].marry) {
          return m.reply('✎ Tú no estás casado con nadie.')
        }

        let pareja = users[user].marry

        users[user].marry = ''
        users[pareja].marry = ''

        return conn.reply(
          m.chat,
          `ꕥ *${users[user].name}* y *${users[pareja].name}* se han divorciado.`,
          m
        )
      }
    }
  }

  catch (error) {
    return m.reply(
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\nError: ${error}`
    )
  }
}

handler.help = ['profile']
handler.command = ['marry', 'divorce']
handler.tags = ['profile']
handler.group = true

export default handler
