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
    const pkgData = await fs.readFile("./package.json", "utf-8");
    const pkg = JSON.parse(pkgData);
    return pkg.repository?.url === 'git+https://github.com/ScriptNex/Legacy-MD.git';
  } catch {
    return false;
  }
};

const handler = async (m, { conn, args, usedPrefix, command }) => {
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

  if (!global.db.data.characters) global.db.data.characters = {};
  if (!global.db.data.users) global.db.data.users = {};

  const userData = global.db.data.users[m.sender];
  if (!Array.isArray(userData.characters)) userData.characters = [];

  try {
    const characters = await loadCharacters();
    const flatChars = flattenCharacters(characters);

    switch (command) {
      case "setfav":
      case "wfav": {
        if (!args.length) {
          return m.reply(
            `❀ Debes especificar un personaje.\n> Ejemplo » *${usedPrefix}${command} Yuki Suou*`
          );
        }
        const target = args.join(" ").toLowerCase().trim();
        const char = flatChars.find(c => c.name.toLowerCase() === target);
        if (!char) return m.reply(`ꕥ No se encontró el personaje *${target}*.`);
        if (!userData.characters.includes(char.id)) {
          return m.reply(`ꕥ El personaje *${char.name}* no está reclamado por ti.`);
        }
        const prevFav = userData.favorite;
        userData.favorite = char.id;
        if (prevFav && prevFav !== char.id) {
          const prevChar = global.db.data.characters?.[prevFav];
          const prevName = prevChar?.name || "personaje anterior";
          return m.reply(`❀ Se ha reemplazado tu favorito *${prevName}* por *${char.name}* !`);
        }
        return m.reply(`❀ Ahora *${char.name}* es tu personaje favorito!`);
      }

      case "favtop":
      case "favoritetop":
      case "favboard": {
        const favCount = {};
        Object.values(global.db.data.users).forEach(u => {
          if (u.favorite) favCount[u.favorite] = (favCount[u.favorite] || 0) + 1;
        });
        const topChars = flatChars
          .map(c => ({ name: c.name, favorites: favCount[c.id] || 0 }))
          .filter(c => c.favorites > 0)
          .sort((a, b) => b.favorites - a.favorites);

        const page = parseInt(args[0]) || 1;
        const pages = Math.max(1, Math.ceil(topChars.length / 10));
        if (page < 1 || page > pages) return m.reply(`ꕥ Página no válida. Hay un total de *${pages}* páginas.`);

        const list = topChars.slice((page - 1) * 10, page * 10);
        let text = "✰ Top de personajes favoritos:\n\n";
        list.forEach((c, i) => {
          text += `#${(page - 1) * 10 + i + 1} » *${c.name}*\n   ♡ ${c.favorites} favorito${c.favorites !== 1 ? "s" : ""}.\n`;
        });
        text += `\n> Página ${page} de ${pages}`;
        return conn.reply(m.chat, text.trim(), m);
      }

      case "deletefav":
      case "delfav": {
        if (!userData.favorite) return m.reply("❀ No tienes ningún personaje marcado como favorito.");
        const charId = userData.favorite;
        const charData = global.db.data.characters?.[charId] || flatChars.find(c => c.id === charId);
        const name = charData?.name || "personaje desconocido";
        delete userData.favorite;
        return m.reply(`✎ *${name}* ha dejado de ser tu personaje favorito.`);
      }
    }

  } catch (err) {
    await conn.reply(
      m.chat,
      `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`,
      m
    );
  }
};

handler.help = ["setfav", "favtop", "delfav"];
handler.tags = ["gacha"];
handler.command = ["setfav", "wfav", "favtop", "favoritetop", "favboard", "deletefav", "delfav"];
handler.group = true;

export default handler;
