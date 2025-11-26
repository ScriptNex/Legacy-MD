import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", 'utf-8');
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

function formatTime(ms) {
  if (ms <= 0) return "Ahora";
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor(totalSec % 3600 / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
  parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);
  return parts.join(" ");
}

// Verificación de repositorio Ouka-MD
const verifi = async () => {
  try {
    const pkg = await fs.readFile('./package.json', "utf-8");
    const json = JSON.parse(pkg);
    return json.repository?.["url"] === "git+https://github.com/ScriptNex/Legacy-MD.git";
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
    const userData = global.db.data.users[m.sender];
    if (!Array.isArray(userData.characters)) userData.characters = [];

    const now = Date.now();
    const lastRollTime = userData.lastRoll && now < userData.lastRoll ? userData.lastRoll - now : 0;
    const lastClaimTime = userData.lastClaim && now < userData.lastClaim ? userData.lastClaim - now : 0;
    const lastVoteTime = userData.lastVote && now < userData.lastVote ? userData.lastVote - now : 0;

    const allChars = await loadCharacters();
    const flattened = flattenCharacters(allChars);
    const totalChars = flattened.length;
    const totalSeries = Object.keys(allChars).length;

    const userCharacters = Object.entries(global.db.data.characters || {})
      .filter(([, v]) => v.user === m.sender)
      .map(([id]) => id);

    const totalValue = userCharacters.reduce((sum, id) => {
      const charValue = global.db.data.characters?.[id]?.value;
      const defaultValue = flattened.find(c => c.id === id)?.value || 0;
      return sum + (typeof charValue === "number" ? charValue : defaultValue);
    }, 0);

    let username = await (async () => {
      try {
        const name = userData.name || await conn.getName(m.sender);
        return typeof name === 'string' && name.trim() ? name : m.sender.split('@')[0];
      } catch {
        return m.sender.split('@')[0];
      }
    })();

    const message = `
*❀ Usuario <${username}>*

ⴵ RollWaifu » *${formatTime(lastRollTime)}*
ⴵ Claim » *${formatTime(lastClaimTime)}*
ⴵ Vote » *${formatTime(lastVoteTime)}*

♡ Personajes reclamados » *${userCharacters.length}*
✰ Valor total » *${totalValue.toLocaleString()}*
❏ Personajes totales » *${totalChars}*
❏ Series totales » *${totalSeries}*
    `.trim();

    await m.reply(message);

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["ginfo"];
handler.tags = ["gacha"];
handler.command = ["gachainfo", "ginfo", "infogacha"];
handler.group = true;

export default handler;
