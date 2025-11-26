import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", "utf-8");
  return JSON.parse(data);
}

function getCharacterById(id, characters) {
  return Object.values(characters)
    .flatMap(c => c.characters)
    .find(ch => ch.id === id);
}

// Verificación de repositorio Ouka-MD
const verifi = async () => {
  try {
    const pkg = await fs.readFile("./package.json", 'utf-8');
    const json = JSON.parse(pkg);
    return json.repository?.["url"] === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ El comando *<${command}>* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  const chatData = global.db.data.chats?.[m.chat] || {};
  if (!chatData.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  try {
    const userData = global.db.data.users[m.sender];
    const now = Date.now();

    if (userData.lastClaim && now < userData.lastClaim) {
      const remaining = Math.ceil((userData.lastClaim - now) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      let text = '';
      if (minutes > 0) text += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
      if (seconds > 0 || text === '') text += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
      return m.reply(`ꕥ Debes esperar *${text.trim()}* para usar *${usedPrefix + command}* de nuevo.`);
    }

    const lastName = chatData.lastRolledCharacter?.name || '';
    const quotedValid = m.quoted?.id === chatData.lastRolledMsgId ||
                        m.quoted?.text?.includes(lastName) && lastName;
    if (!quotedValid) {
      return m.reply("❀ Debes citar un personaje válido para reclamar.");
    }

    const charId = chatData.lastRolledId;
    const allChars = await loadCharacters();
    const character = getCharacterById(charId, allChars);

    if (!character) return m.reply("ꕥ Personaje no encontrado en characters.json");

    if (!global.db.data.characters) global.db.data.characters = {};
    if (!global.db.data.characters[charId]) global.db.data.characters[charId] = {};
    const charData = global.db.data.characters[charId];

    charData.name = charData.name || character.name;
    charData.value = typeof charData.value === 'number' ? charData.value : character.value || 0;
    charData.votes = charData.votes || 0;

    if (charData.reservedBy && charData.reservedBy !== m.sender && now < charData.reservedUntil) {
      let reservedName = await (async () => global.db.data.users[charData.reservedBy]?.name || 
        await conn.getName(charData.reservedBy).catch(() => charData.reservedBy.split('@')[0]))();
      const remainingSec = ((charData.reservedUntil - now) / 1000).toFixed(1);
      return m.reply(`ꕥ Este personaje está protegido por *${reservedName}* durante *${remainingSec}s.*`);
    }

    if (charData.expiresAt && now > charData.expiresAt && !charData.user && !(charData.reservedBy && now < charData.reservedUntil)) {
      const expiredSec = ((now - charData.expiresAt) / 1000).toFixed(1);
      return m.reply(`ꕥ El personaje ha expirado » ${expiredSec}s.`);
    }

    if (charData.user) {
      let ownerName = await (async () => global.db.data.users[charData.user]?.name || 
        await conn.getName(charData.user).catch(() => charData.user.split('@')[0]))();
      return m.reply(`ꕥ El personaje *${charData.name}* ya ha sido reclamado por *${ownerName}*`);
    }

    // Reclamar personaje
    charData.user = m.sender;
    charData.claimedAt = now;
    delete charData.reservedBy;
    delete charData.reservedUntil;

    userData.lastClaim = now + 1800000; // 30 min cooldown
    if (!Array.isArray(userData.characters)) userData.characters = [];
    if (!userData.characters.includes(charId)) userData.characters.push(charId);

    let userName = await (async () => global.db.data.users[m.sender]?.name || 
      await conn.getName(m.sender).catch(() => m.sender.split('@')[0]))();
    const charName = charData.name;
    const claimMsg = userData.claimMessage;
    const elapsed = typeof charData.expiresAt === "number" ? ((now - charData.expiresAt + 60000) / 1000).toFixed(1) : '∞';
    const finalMsg = claimMsg ? claimMsg.replace(/€user/g, `*${userName}*`).replace(/€character/g, `*${charName}*`) 
                              : `*${charName}* ha sido reclamado por *${userName}*`;

    await conn.reply(m.chat, `❀ ${finalMsg} (${elapsed}s)`, m);

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ['claim'];
handler.tags = ["gacha"];
handler.command = ["claim", 'c', 'reclamar'];
handler.group = true;

export default handler;
