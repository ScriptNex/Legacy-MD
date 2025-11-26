import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", "utf-8");
  return JSON.parse(data);
}

function flattenCharacters(characters) {
  return Object.values(characters).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

const verifi = async () => {
  try {
    const pkgData = await fs.readFile('./package.json', "utf-8");
    const pkg = JSON.parse(pkgData);
    return pkg.repository?.url === 'git+https://github.com/ScriptNex/Legacy-MD.git';
  } catch {
    return false;
  }
};

let handler = async (m, { conn, usedPrefix, command }) => {
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

  const user = global.db.data.users[m.sender];
  if (!Array.isArray(user.characters)) user.characters = [];
  if (user.robCooldown == null) user.robCooldown = 0;
  if (!user.robVictims) user.robVictims = {};

  const now = Date.now();
  const nextRob = user.robCooldown + 28800000; // 8 horas cooldown

  if (user.robCooldown > 0 && now < nextRob) {
    const remaining = nextRob - now;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    let timeText = '';
    if (hours) timeText += `${hours} hora${hours !== 1 ? 's' : ''} `;
    if (minutes) timeText += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
    if (seconds || timeText === '') timeText += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    return m.reply(`ꕥ Debes esperar *${timeText.trim()}* para usar *${usedPrefix}${command}* de nuevo.`);
  }

  const mentioned = await m.mentionedJid;
  const target = mentioned[0] || (m.quoted && await m.quoted.sender);

  if (!target || typeof target !== 'string' || !target.includes('@')) {
    return m.reply("❀ Por favor, cita o menciona al usuario a quien quieras robarle una waifu.");
  }

  if (target === m.sender) {
    const name = await (async () => user.name?.trim() || (await conn.getName(m.sender).then(n => n?.trim() || m.sender.split('@')[0]).catch(() => m.sender.split('@')[0])))();
    return m.reply(`ꕥ No puedes robarte a ti mismo, *${name}*.`);
  }

  const lastRobTarget = user.robVictims[target];
  if (lastRobTarget && now - lastRobTarget < 86400000) {
    const targetName = await (async () => global.db.data.users[target]?.name?.trim() || (await conn.getName(target).then(n => n?.trim() || target.split('@')[0]).catch(() => target.split('@')[0])))();
    return m.reply(`ꕥ Ya robaste a *${targetName}* hoy. Solo puedes robarle a alguien *una vez cada 24 horas*.`);
  }

  const targetUser = global.db.data.users[target];
  if (!targetUser || !Array.isArray(targetUser.characters) || targetUser.characters.length === 0) {
    const targetName = await (async () => targetUser?.name?.trim() || (await conn.getName(target).then(n => n?.trim() || target.split('@')[0]).catch(() => target.split('@')[0])))();
    return m.reply(`ꕥ *${targetName}* no tiene waifus que puedas robar.`);
  }

  const success = Math.random() < 0.9; // 90% chance de éxito
  user.robCooldown = now;
  user.robVictims[target] = now;

  if (!success) {
    const targetName = await (async () => targetUser?.name?.trim() || (await conn.getName(target).then(n => n?.trim() || target.split('@')[0]).catch(() => target.split('@')[0])))();
    return m.reply(`ꕥ El intento de robo ha fallado. *${targetName}* defendió a su waifu heroicamente.`);
  }

  const charId = targetUser.characters[Math.floor(Math.random() * targetUser.characters.length)];
  const charData = global.db.data.characters?.[charId] || {};
  const charName = typeof charData.name === 'string' ? charData.name : `ID:${charId}`;

  charData.user = m.sender;
  targetUser.characters = targetUser.characters.filter(c => c !== charId);
  if (!user.characters.includes(charId)) user.characters.push(charId);

  if (user.sales?.[charId]?.user === target) delete user.sales[charId];
  if (targetUser.favorite === charId) delete targetUser.favorite;
  if (global.db.data.users[target]?.favorite === charId) delete global.db.data.users[target].favorite;

  const senderName = await (async () => user.name?.trim() || (await conn.getName(m.sender).then(n => n?.trim() || m.sender.split('@')[0]).catch(() => m.sender.split('@')[0])))();
  const targetName = await (async () => targetUser?.name?.trim() || (await conn.getName(target).then(n => n?.trim() || target.split('@')[0]).catch(() => target.split('@')[0])))();

  await m.reply(`❀ *${senderName}* ha robado a *${charName}* del harem de *${targetName}*.`);
};

handler.help = ["robwaifu"];
handler.tags = ["gacha"];
handler.command = ["robwaifu", "robarwaifu"];
handler.group = true;
export default handler;
