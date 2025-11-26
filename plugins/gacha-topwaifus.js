import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", "utf-8");
  return JSON.parse(data);
}

function flattenCharacters(characters) {
  return Object.values(characters).flatMap(entry => Array.isArray(entry.characters) ? entry.characters : []);
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

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  if (!global.db.data.characters) global.db.data.characters = {};

  try {
    const charactersData = await loadCharacters();
    const charactersList = flattenCharacters(charactersData);

    const charactersWithValue = charactersList.map(char => {
      const dbChar = global.db.data.characters[char.id] || {};
      const value = typeof dbChar.value === "number" ? dbChar.value : Number(char.value || 0);
      return { name: char.name, value };
    });

    const page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(charactersWithValue.length / 10);

    if (page < 1 || page > totalPages) {
      return m.reply(`ꕥ Página no válida. Hay un total de *${totalPages}* páginas.`);
    }

    const sorted = charactersWithValue.sort((a, b) => b.value - a.value);
    const slice = sorted.slice((page - 1) * 10, page * 10);

    let text = "❀ *Personajes con más valor:*\n\n";
    slice.forEach((char, i) => {
      text += `✰ ${((page - 1) * 10 + i + 1)} » *${char.name}*\n`;
      text += `   → Valor: *${char.value.toLocaleString()}*\n`;
    });

    text += `\n⌦ Página *${page}* de *${totalPages}*`;
    await conn.reply(m.chat, text.trim(), m);

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["topwaifus"];
handler.tags = ["gacha"];
handler.command = ["waifusboard", "waifustop", "topwaifus", "wtop"];
handler.group = true;

export default handler;
