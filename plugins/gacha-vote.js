import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", 'utf-8');
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

function getSeriesNameByCharacter(chars, charId) {
  return Object.values(chars)
    .find(series => Array.isArray(series.characters) && series.characters.some(c => c.id === charId))?.name || "Desconocido";
}

const verifi = async () => {
  try {
    const pkgData = await fs.readFile("./package.json", "utf-8");
    const pkg = JSON.parse(pkgData);
    return pkg.repository?.url === "git+https://github.com/ScriptNex/Legacy-MD.git";
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

    if (!global.db.data.characters) global.db.data.characters = {};

    const userData = global.db.data.users[m.sender];
    const now = Date.now();

    if (userData.lastVote && now < userData.lastVote) {
      const remaining = Math.ceil((userData.lastVote - now) / 1000);
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      let timeText = '';
      if (hours > 0) timeText += `${hours} hora${hours !== 1 ? 's' : ''} `;
      if (minutes > 0) timeText += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
      if (seconds > 0 || timeText === '') timeText += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
      return m.reply(`ꕥ Debes esperar *${timeText.trim()}* para usar *${usedPrefix}${command}* de nuevo.`);
    }

    const charName = args.join(" ").trim();
    if (!charName) return m.reply(`❀ Debes especificar un personaje para votarlo.`);

    const charactersData = await loadCharacters();
    const allChars = flattenCharacters(charactersData);
    const char = allChars.find(c => c.name.toLowerCase() === charName.toLowerCase());
    if (!char) return m.reply("ꕥ Personaje no encontrado. Asegúrate de que el nombre esté correcto.");

    if (!global.db.data.characters[char.id]) global.db.data.characters[char.id] = {};
    const dbChar = global.db.data.characters[char.id];

    if (typeof dbChar.value !== "number") dbChar.value = Number(char.value || 0);
    if (typeof dbChar.votes !== "number") dbChar.votes = 0;
    if (!dbChar.name) dbChar.name = char.name;

    if (dbChar.lastVotedAt && now < dbChar.lastVotedAt + 7200000) {
      const remaining = Math.ceil((dbChar.lastVotedAt + 7200000 - now) / 1000);
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      let timeText = '';
      if (hours > 0) timeText += `${hours} hora${hours !== 1 ? 's' : ''} `;
      if (minutes > 0) timeText += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
      if (seconds > 0 || timeText === '') timeText += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
      return m.reply(`ꕥ *${dbChar.name}* ha sido votada recientemente.\n> Debes esperar *${timeText.trim()}* para votarla de nuevo.`);
    }

    if (!dbChar.dailyIncrement) dbChar.dailyIncrement = {};
    const today = new Date().toISOString().slice(0, 10);
    const todayVotes = dbChar.dailyIncrement[today] || 0;

    if (todayVotes >= 900) return m.reply(`ꕥ El personaje *${dbChar.name}* ya tiene el valor máximo.`);

    const increment = Math.min(900 - todayVotes, Math.floor(Math.random() * 201) + 50);
    dbChar.value += increment;
    dbChar.votes += 1;
    dbChar.lastVotedAt = now;
    dbChar.dailyIncrement[today] = todayVotes + increment;
    userData.lastVote = now + 7200000;

    const seriesName = getSeriesNameByCharacter(charactersData, char.id);

    await conn.reply(m.chat, `❀ Votaste por *${dbChar.name}* (*${seriesName}*)\n> Su nuevo valor es *${dbChar.value.toLocaleString()}*`, m);

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["vote"];
handler.tags = ["gacha"];
handler.command = ["vote", "votar"];
handler.group = true;

export default handler;
