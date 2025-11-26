import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile('./lib/characters.json', 'utf-8');
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

// Verificación de repositorio Ouka-MD
const verifi = async () => {
  try {
    const pkg = await fs.readFile("./package.json", "utf-8");
    const json = JSON.parse(pkg);
    return json.repository?.['url'] === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ El comando *<${command}>* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  try {
    const userData = global.db.data.users[m.sender];
    if (!Array.isArray(userData.characters)) userData.characters = [];

    if (!args.length) {
      return m.reply(`❀ Debes especificar un personaje para eliminar.\n> Ejemplo » *${usedPrefix + command} Yuki Suou*`);
    }

    const charName = args.join(" ").toLowerCase().trim();
    const allChars = await loadCharacters();
    const flattened = flattenCharacters(allChars);
    const character = flattened.find(c => c.name.toLowerCase() === charName);

    if (!character) {
      return m.reply(`ꕥ No se ha encontrado ningún personaje con el nombre *${charName}*\n> Puedes sugerirlo usando *${usedPrefix}suggest personaje ${charName}*`);
    }

    if (!global.db.data.characters?.[character.id] || global.db.data.characters[character.id].user !== m.sender || !userData.characters.includes(character.id)) {
      return m.reply(`ꕥ *${character.name}* no está reclamado por ti.`);
    }

    // Eliminar personaje
    delete global.db.data.characters[character.id];
    userData.characters = userData.characters.filter(id => id !== character.id);

    if (userData.sales?.[character.id]?.user === m.sender) {
      delete userData.sales[character.id];
    }

    if (userData.favorite === character.id) {
      delete userData.favorite;
    }

    await m.reply(`❀ *${character.name}* ha sido eliminado de tu lista de reclamados.`);
  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["delchar"];
handler.tags = ["gacha"];
handler.command = ["delchar", 'deletewaifu', 'delwaifu'];
handler.group = true;

export default handler;
