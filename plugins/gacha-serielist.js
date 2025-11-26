import { promises as fs } from 'fs';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", 'utf-8');
  return JSON.parse(data);
}

const verifi = async () => {
  try {
    const pkgData = await fs.readFile('./package.json', "utf-8");
    const pkg = JSON.parse(pkgData);
    return pkg.repository?.url === "git+https://github.com/ScriptNex/Legacy-MD.git";
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

  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(
        `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`
      );
    }

    const charactersData = await loadCharacters();

    switch (command) {
      case "serielist":
      case "slist":
      case "animelist": {
        const seriesKeys = Object.keys(charactersData);
        const totalSeries = seriesKeys.length;
        const page = parseInt(args[0]) || 1;
        const maxPages = Math.max(1, Math.ceil(totalSeries / 20));
        if (page < 1 || page > maxPages) {
          return m.reply(`ꕥ Página no válida. Hay un total de *${maxPages}* páginas.`);
        }

        const start = (page - 1) * 20;
        const end = Math.min(start + 20, totalSeries);
        const pageSeries = seriesKeys.slice(start, end);

        let text = `*❏ Lista de series (${totalSeries}):*\n\n`;
        for (const key of pageSeries) {
          const serie = charactersData[key];
          const name = typeof serie.name === "string" ? serie.name : key;
          const count = Array.isArray(serie.characters) ? serie.characters.length : 0;
          text += `» *${name}* (${count}) *ID* (${key})\n`;
        }
        text += `\n> • _Página ${page}/${maxPages}_`;
        await m.reply(text.trim());
        break;
      }

      case "serieinfo":
      case "ainfo":
      case "animeinfo": {
        if (!args.length) {
          return m.reply(
            `❀ Debes especificar el nombre de un anime\n> Ejemplo » ${usedPrefix}${command} Naruto`
          );
        }

        const query = args.join(" ").toLowerCase().trim();
        const entries = Object.entries(charactersData);
        const serieEntry = entries.find(
          ([, s]) =>
            (typeof s.name === "string" && s.name.toLowerCase().includes(query)) ||
            (Array.isArray(s.tags) && s.tags.some(tag => tag.toLowerCase().includes(query)))
        ) || entries[0] || [];

        const [serieId, serie] = serieEntry;
        if (!serieId || !serie) {
          return m.reply(
            `ꕥ No se encontró la serie *${query}*\n> Puedes sugerirlo usando el comando *${usedPrefix}suggest sugerencia de serie: ${query}*`
          );
        }

        let chars = Array.isArray(serie.characters) ? serie.characters : [];
        const totalChars = chars.length;
        const claimed = chars.filter(c =>
          Object.values(global.db.data.users).some(u => Array.isArray(u.characters) && u.characters.includes(c.id))
        );

        chars.sort((a, b) => {
          const aVal = typeof global.db.data.characters?.[a.id]?.value === 'number' ? global.db.data.characters[a.id].value : Number(a.value || 0);
          const bVal = typeof global.db.data.characters?.[b.id]?.value === 'number' ? global.db.data.characters[b.id].value : Number(b.value || 0);
          return bVal - aVal;
        });

        let text = `*❀ Fuente: \`<${serie.name || serieId}>\`*\n\n`;
        text += `❏ Personajes » *\`${totalChars}\`*\n`;
        text += `♡ Reclamados » *\`${claimed.length}/${totalChars} (${((claimed.length/totalChars)*100).toFixed(0)}%)\`*\n`;
        text += "❏ Lista de personajes:\n\n";

        for (const c of chars) {
          const charData = global.db.data.characters?.[c.id] || {};
          const value = typeof charData.value === 'number' ? charData.value : Number(c.value || 0);
          const ownerEntry = Object.entries(global.db.data.users).find(([uid, u]) => Array.isArray(u.characters) && u.characters.includes(c.id));
          const ownerName = ownerEntry ? (global.db.data.users[ownerEntry[0]].name?.trim() || ownerEntry[0].split('@')[0]) : 'Libre';
          const status = ownerEntry ? `Reclamado por *${ownerName}*` : "Libre";
          text += `» *${c.name}* (${value.toLocaleString()}) • ${status}.\n`;
        }

        text += `\n> ⌦ _Página *1* de *1*_`;
        await conn.reply(m.chat, text.trim(), m);
        break;
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

handler.help = ["serielist", 'serieinfo'];
handler.tags = ["gacha"];
handler.command = ["serielist", "slist", 'animelist', "serieinfo", "ainfo", "animeinfo"];
handler.group = true;
export default handler;
