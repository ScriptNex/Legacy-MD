import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile('./lib/characters.json', "utf-8");
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

const verifi = async () => {
  try {
    const pkg = await fs.readFile("./package.json", "utf-8");
    const json = JSON.parse(pkg);
    return json.repository?.url === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, usedPrefix }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ Este comando solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n» *${usedPrefix}gacha on*`);
  }

  try {
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.characters) global.db.data.characters = {};

    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    const userName = await (async () => {
      const n = global.db.data.users[mentioned]?.name?.trim();
      if (n) return n;
      return conn.getName(mentioned).then(name => (name?.trim() || mentioned.split('@')[0])).catch(() => mentioned.split('@')[0]);
    })();

    const allChars = await loadCharacters();
    const flatChars = flattenCharacters(allChars);

    // Filtrar personajes del usuario
    const userChars = Object.entries(global.db.data.characters)
      .filter(([, c]) => (c.user || '').replace(/\D/g, '') === mentioned.replace(/\D/g, ''))
      .map(([id]) => id);

    if (!userChars.length) {
      const msg = mentioned === m.sender ? "ꕥ No tienes personajes reclamados." : `ꕥ *${userName}* no tiene personajes reclamados.`;
      return conn.reply(m.chat, msg, m, { mentions: [mentioned] });
    }

    // Ordenar personajes por valor
    userChars.sort((a, b) => {
      const charA = global.db.data.characters[a] || {};
      const charB = global.db.data.characters[b] || {};
      const infoA = flatChars.find(c => c.id === a);
      const infoB = flatChars.find(c => c.id === b);
      const valueA = typeof charA.value === "number" ? charA.value : Number(infoA?.value || 0);
      const valueB = typeof charB.value === "number" ? charB.value : Number(infoB?.value || 0);
      return valueB - valueA;
    });

    const page = Math.max(1, Math.min(parseInt(args[0]) || 1, Math.ceil(userChars.length / 50)));
    const start = (page - 1) * 50;
    const end = Math.min(start + 50, userChars.length);

    let text = `✿ Personajes reclamados ✿\n`;
    text += `⌦ Usuario: *${userName}*\n`;
    text += `♡ Personajes: *(${userChars.length})*\n\n`;

    for (let i = start; i < end; i++) {
      const id = userChars[i];
      const charDB = global.db.data.characters[id] || {};
      const charInfo = flatChars.find(c => c.id === id);
      const name = charInfo?.name || charDB.name || `ID:${id}`;
      const value = typeof charDB.value === "number" ? charDB.value : Number(charInfo?.value || 0);
      text += `» *${name}* (*${value.toLocaleString()}*)\n`;
    }

    text += `\n⌦ _Página *${page}* de *${Math.ceil(userChars.length / 50)}*_`;
    await conn.reply(m.chat, text.trim(), m, { mentions: [mentioned] });

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["harem"];
handler.tags = ['anime'];
handler.command = ["harem", "waifus", 'claims'];
handler.group = true;

export default handler;
