import { promises as fs } from 'fs';
let pendingTrade = {};

const verifi = async () => {
  try {
    const pkgData = await fs.readFile('./package.json', 'utf-8');
    const pkg = JSON.parse(pkgData);
    return pkg.repository?.url === 'git+https://github.com/ScriptNex/Legacy-MD.git';
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ El comando *<${command}>* solo está disponible para el repositorio oficial.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
    }

    if (!args.length || !m.text.includes('/')) {
      return m.reply(`❀ Debes especificar dos personajes para intercambiarlos.\n> ✐ Ejemplo: *${usedPrefix}${command} Personaje1 / Personaje2*\n> Donde "Personaje1" es el personaje que quieres intercambiar y "Personaje2" es el personaje que quieres recibir.`);
    }

    const tradeText = m.text.slice(m.text.indexOf(" ") + 1).trim();
    const [fromName, toName] = tradeText.split('/').map(n => n.trim().toLowerCase());

    const fromCharId = Object.keys(global.db.data.characters).find(id =>
      (global.db.data.characters[id]?.name || '').toLowerCase() === fromName &&
      global.db.data.characters[id]?.user === m.sender
    );

    const toCharId = Object.keys(global.db.data.characters).find(id =>
      (global.db.data.characters[id]?.name || '').toLowerCase() === toName
    );

    if (!fromCharId || !toCharId) {
      const missing = !fromCharId ? fromName : toName;
      return m.reply(`ꕥ No se ha encontrado al personaje *${missing}*.`);
    }

    const fromChar = global.db.data.characters[fromCharId];
    const toChar = global.db.data.characters[toCharId];

    if (toChar.user === m.sender) {
      return m.reply(`ꕥ El personaje *${toChar.name}* ya está reclamado por ti.`);
    }
    if (!toChar.user) {
      return m.reply(`ꕥ El personaje *${toChar.name}* no está reclamado por nadie.`);
    }
    if (!fromChar.user || fromChar.user !== m.sender) {
      return m.reply(`ꕥ *${fromChar.name}* no está reclamado por ti.`);
    }

    const toUser = toChar.user;
    const fromUser = m.sender;

    let fromUserName = global.db.data.users[fromUser]?.name?.trim() || await conn.getName(fromUser).catch(() => fromUser.split('@')[0]);
    let toUserName = global.db.data.users[toUser]?.name?.trim() || await conn.getName(toUser).catch(() => toUser.split('@')[0]);

    pendingTrade[toUser] = {
      from: fromUser,
      to: toUser,
      chat: m.chat,
      give: fromCharId,
      get: toCharId,
      timeout: setTimeout(() => delete pendingTrade[toUser], 60000)
    };

    await conn.reply(m.chat, `「✿」 *${toUserName}*, *${fromUserName}* te ha enviado una solicitud de intercambio.\n\n✦ [${toUserName}] *${toChar.name}* (${toChar.value || 0})\n✦ [${fromUserName}] *${fromChar.name}* (${fromChar.value || 0})\n\n✐ Para aceptar el intercambio responde a este mensaje con "aceptar", la solicitud expira en 60 segundos.`, m, { mentions: [toUser] });

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.before = async (m, { conn }) => {
  try {
    if (m.text.trim().toLowerCase() !== "aceptar") return;

    const tradeEntry = Object.entries(pendingTrade).find(([_, t]) => t.chat === m.chat);
    if (!tradeEntry) return;

    const [tradeKey, trade] = tradeEntry;
    if (m.sender !== trade.to) {
      const toName = global.db.data.users[trade.to]?.name?.trim() || await conn.getName(trade.to).catch(() => trade.to.split('@')[0]);
      return m.reply(`ꕥ Solo *${toName}* puede aceptar la solicitud de intercambio.`);
    }

    const giveChar = global.db.data.characters[trade.give];
    const getChar = global.db.data.characters[trade.get];

    if (!giveChar || !getChar || giveChar.user !== trade.from || getChar.user !== trade.to) {
      delete pendingTrade[tradeKey];
      return m.reply("⚠︎ Uno de los personajes ya no está disponible para el intercambio.");
    }

    giveChar.user = trade.to;
    getChar.user = trade.from;

    const fromUser = global.db.data.users[trade.from];
    const toUser = global.db.data.users[trade.to];

    if (!toUser.characters.includes(trade.give)) toUser.characters.push(trade.give);
    if (!fromUser.characters.includes(trade.get)) fromUser.characters.push(trade.get);

    fromUser.characters = fromUser.characters.filter(id => id !== trade.give);
    toUser.characters = toUser.characters.filter(id => id !== trade.get);

    if (fromUser.favorite === trade.give) delete fromUser.favorite;
    if (toUser.favorite === trade.get) delete toUser.favorite;

    clearTimeout(trade.timeout);
    delete pendingTrade[tradeKey];

    const fromName = fromUser?.name?.trim() || await conn.getName(trade.from).catch(() => trade.from.split('@')[0]);
    const toName = toUser?.name?.trim() || await conn.getName(trade.to).catch(() => trade.to.split('@')[0]);

    await m.reply(`「✿」Intercambio aceptado!\n\n✦ ${toName} » *${giveChar.name}*\n✦ ${fromName} » *${getChar.name}*`);

    return true;
  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["trade"];
handler.tags = ["gacha"];
handler.command = ["trade", "intercambiar"];
handler.group = true;

export default handler;
