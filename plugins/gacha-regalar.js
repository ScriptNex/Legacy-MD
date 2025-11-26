import { promises as fs } from 'fs';

const verifi = async () => {
  try {
    const data = await fs.readFile("./package.json", "utf-8");
    const pkg = JSON.parse(data);
    return pkg.repository?.url === 'git+https://github.com/ScriptNex/Legacy-MD.git';
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!(await verifi())) {
    return conn.reply(
      m.chat,
      `❀ El comando *<${command}>* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`,
      m
    );
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(
      `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`
    );
  }

  try {
    const user = global.db.data.users[m.sender];
    if (!Array.isArray(user.characters)) user.characters = [];

    if (!args.length) {
      return m.reply(
        "❀ Debes escribir el nombre del personaje y citar o mencionar al usuario que lo recibirá"
      );
    }

    const mentioned = await m.mentionedJid;
    const to = mentioned[0] || (m.quoted && await m.quoted.sender);
    if (!to) return m.reply("❀ Debes mencionar o citar el mensaje del destinatario.");

    const charName = m.quoted
      ? args.join(" ").toLowerCase().trim()
      : args.slice(0, -1).join(" ").toLowerCase().trim();

    const charId = Object.keys(global.db.data.characters).find(k => {
      const c = global.db.data.characters[k];
      return typeof c.name === "string" && c.name.toLowerCase() === charName && c.user === m.sender;
    });

    if (!charId) {
      return m.reply(`ꕥ No se encontró el personaje *${charName}* o no está reclamado por ti.`);
    }

    const charData = global.db.data.characters[charId];

    if (!user.characters.includes(charId)) {
      return m.reply(`ꕥ *${charData.name}* no está reclamado por ti.`);
    }

    const recipient = global.db.data.users[to];
    if (!recipient) return m.reply("ꕥ El usuario mencionado no está registrado.");
    if (!Array.isArray(recipient.characters)) recipient.characters = [];
    if (!recipient.characters.includes(charId)) recipient.characters.push(charId);

    user.characters = user.characters.filter(c => c !== charId);
    charData.user = to;

    if (user.sales?.[charId]?.user === m.sender) delete user.sales[charId];
    if (user.favorite === charId) delete user.favorite;
    if (global.db.data.users[m.sender]?.favorite === charId) delete global.db.data.users[m.sender].favorite;

    const senderName = await (async () => user.name?.trim() || (await conn.getName(m.sender).then(n => typeof n === "string" && n.trim() ? n : m.sender.split('@')[0]).catch(() => m.sender.split('@')[0])))();
    const recipientName = await (async () => recipient.name?.trim() || (await conn.getName(to).then(n => typeof n === "string" && n.trim() ? n : to.split('@')[0]).catch(() => to.split('@')[0])))();

    await conn.reply(
      m.chat,
      `❀ *${charData.name}* ha sido regalado a *${recipientName}* por *${senderName}*.`,
      m,
      { mentions: [to] }
    );
  } catch (err) {
    await conn.reply(
      m.chat,
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`,
      m
    );
  }
};

handler.help = ["regalar"];
handler.tags = ["gacha"];
handler.command = ["givechar", "givewaifu", "regalar"];
handler.group = true;
export default handler;
