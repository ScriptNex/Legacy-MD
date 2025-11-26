import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile('./lib/characters.json', 'utf-8');
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

let pending = {};

const verifi = async () => {
  try {
    const pkg = await fs.readFile("./package.json", "utf-8");
    const json = JSON.parse(pkg);
    return json.repository?.url === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

let handler = async (m, { conn, usedPrefix }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ Este comando solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`);
  }

  try {
    const senderData = global.db.data.users[m.sender];
    if (!Array.isArray(senderData.characters)) senderData.characters = [];

    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!mentioned || typeof mentioned !== "string" || !mentioned.includes('@')) {
      return m.reply("❀ Debes mencionar a quien quieras regalarle tus personajes.");
    }

    const targetData = global.db.data.users[mentioned];
    if (!targetData) return m.reply("ꕥ El usuario mencionado no está registrado.");
    if (!Array.isArray(targetData.characters)) targetData.characters = [];

    const allChars = await loadCharacters();
    const flatChars = flattenCharacters(allChars);

    const senderChars = senderData.characters.map(id => {
      const charDB = global.db.data.characters?.[id] || {};
      const charInfo = flatChars.find(c => c.id === id) || {};
      const value = typeof charDB.value === "number" ? charDB.value : charInfo.value || 0;
      return { id, name: charDB.name || charInfo.name || `ID:${id}`, value };
    });

    if (senderChars.length === 0) return m.reply("ꕥ No tienes personajes para regalar.");

    const totalValue = senderChars.reduce((sum, c) => sum + c.value, 0);

    const senderName = senderData.name?.trim() || (await conn.getName(m.sender).catch(() => m.sender.split('@')[0]));
    const targetName = targetData.name?.trim() || (await conn.getName(mentioned).catch(() => mentioned.split('@')[0]));

    pending[m.sender] = {
      sender: m.sender,
      to: mentioned,
      value: totalValue,
      count: senderChars.length,
      ids: senderChars.map(c => c.id),
      chat: m.chat,
      timeout: setTimeout(() => delete pending[m.sender], 60000)
    };

    await conn.reply(m.chat, 
      `「✿」 *${senderName}*, ¿confirmas regalar todo tu harem a *${targetName}*?\n\n` +
      `❏ Personajes a transferir: *${senderChars.length}*\n` +
      `❏ Valor total: *${totalValue.toLocaleString()}*\n\n` +
      `✐ Para confirmar responde a este mensaje con "Aceptar".\n> Esta acción no se puede deshacer, revisa bien los datos antes de confirmar.`,
      m,
      { mentions: [mentioned] }
    );

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

// Confirmación automática
handler.before = async (m, { conn, usedPrefix }) => {
  try {
    const p = pending[m.sender];
    if (!p || m.text?.trim().toLowerCase() !== "aceptar") return;
    if (m.sender !== p.sender || m.chat !== p.chat) return;

    const senderData = global.db.data.users[m.sender];
    const targetData = global.db.data.users[p.to];

    for (const id of p.ids) {
      const char = global.db.data.characters?.[id];
      if (!char || char.user !== m.sender) continue;

      char.user = p.to;
      if (!targetData.characters.includes(id)) targetData.characters.push(id);
      senderData.characters = senderData.characters.filter(cid => cid !== id);

      if (senderData.sales?.[id]?.user === m.sender) delete senderData.sales[id];
      if (senderData.favorite === id) delete senderData.favorite;
    }

    clearTimeout(p.timeout);
    delete pending[m.sender];

    const targetName = targetData.name?.trim() || (await conn.getName(p.to).catch(() => p.to.split('@')[0]));
    await m.reply(
      `「✿」 Has regalado con éxito todos tus personajes a *${targetName}*!\n\n` +
      `> ❏ Personajes regalados: *${p.count}*\n` +
      `> ⴵ Valor total: *${p.value.toLocaleString()}*`
    );

    return true;
  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["giveallharem"];
handler.tags = ["gacha"];
handler.command = ['giveallharem'];
handler.group = true;

export default handler;
