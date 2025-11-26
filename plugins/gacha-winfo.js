import { promises as fs } from 'fs';
import fetch from 'node-fetch';

async function loadCharacters() {
  const data = await fs.readFile("./lib/characters.json", "utf-8");
  return JSON.parse(data);
}

function flattenCharacters(chars) {
  return Object.values(chars).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

function getSeriesNameByCharacter(chars, charId) {
  return Object.values(chars)
    .find(series => Array.isArray(series.characters) && series.characters.some(c => c.id === charId))?.name || "Desconocido";
}

function formatElapsed(ms) {
  if (!ms || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const weeks = Math.floor(totalSec / 604800);
  const days = Math.floor(totalSec % 604800 / 86400);
  const hours = Math.floor(totalSec % 86400 / 3600);
  const minutes = Math.floor(totalSec % 3600 / 60);
  const seconds = totalSec % 60;
  return [weeks && weeks + 'w', days && days + 'd', hours && hours + 'h', minutes && minutes + 'm', seconds && seconds + 's']
    .filter(Boolean).join(' ');
}

function formatTag(tag) {
  return String(tag).trim().toLowerCase().replace(/\s+/g, '_');
}

async function buscarImagen(tag) {
  const formatted = formatTag(tag);
  const urls = [
    `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${formatted}`,
    `https://danbooru.donmai.us/posts.json?tags=${formatted}`,
    `${global.APIs.delirius.url}/search/gelbooru?query=${formatted}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
      const type = res.headers.get("content-type") || '';
      if (!res.ok || !type.includes("json")) continue;

      const json = await res.json();
      const posts = Array.isArray(json) ? json : json?.post || json?.data || [];
      const images = posts.map(p => p.file_url || p.large_file_url || p.image || p?.media_asset?.variants?.[0]?.url)
        .filter(u => typeof u === "string" && /\.(jpe?g|png)$/.test(u));
      if (images.length) return images;
    } catch {}
  }
  return [];
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

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ El comando *<${command}>* solo está disponible para el repositorio oficial.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  try {
    if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
      return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
    }

    if (!args.length) return m.reply(`❀ Por favor, proporciona el nombre de un personaje.\n> Ejemplo » *${usedPrefix}${command} Yuki Suou*`);

    const charactersData = await loadCharacters();
    const allChars = flattenCharacters(charactersData);
    const query = args.join(" ").toLowerCase().trim();
    const char = allChars.find(c => c.name.toLowerCase() === query) ||
                 allChars.find(c => c.name.toLowerCase().includes(query) || c.tags?.some(t => t.toLowerCase().includes(query))) ||
                 allChars.find(c => query.split(" ").some(w => c.name.toLowerCase().includes(w) || c.tags?.some(t => t.toLowerCase().includes(w))));

    if (!char) return m.reply(`ꕥ No se encontró el personaje *${query}*.`);

    const db = global.db.data;
    const seriesName = getSeriesNameByCharacter(charactersData, char.id);

    switch (command) {
      case "charinfo":
      case "winfo":
      case "waifuinfo": {
        db.characters ??= {};
        db.characters[char.id] ??= {};
        const c = db.characters[char.id];
        c.name ??= char.name;
        c.value = typeof c.value === 'number' ? c.value : Number(char.value || 100);
        c.votes = typeof c.votes === 'number' ? c.votes : 0;

        const claimedUser = Object.entries(db.users).find(([, u]) => u.characters?.includes(char.id));
        const ownerName = claimedUser?.[0] ? db.users[claimedUser[0]]?.name?.trim() || await conn.getName(claimedUser[0]) || claimedUser[0].split('@')[0] : 'desconocido';
        const claimedDate = c.claimedAt ? `\nⴵ Fecha de reclamo » *${new Date(c.claimedAt).toLocaleDateString("es-VE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}*` : '';
        const lastVote = typeof c.lastVotedAt === "number" ? `hace *${formatElapsed(Date.now() - c.lastVotedAt)}*` : "*Nunca*";

        const rank = Object.values(db.characters)
          .filter(x => typeof x.value === "number")
          .sort((a,b)=>b.value-a.value)
          .findIndex(x=>x.name===c.name) + 1 || '—';

        const msg = `❀ Nombre » *${c.name}*\n⚥ Género » *${char.gender || 'Desconocido'}*\n✰ Valor » *${c.value.toLocaleString()}*\n♡ Estado » ${claimedUser ? `Reclamado por *${ownerName}*` : '*Libre*'}${claimedDate}\n❖ Fuente » *${seriesName}*\n❏ Puesto » *#${rank}*\nⴵ Último voto » ${lastVote}`;
        await conn.reply(m.chat, msg, m);
        break;
      }

      case "charimage":
      case "waifuimage":
      case "cimage":
      case "wimage": {
        const tag = char.tags?.[0];
        if (!tag) return m.reply(`ꕥ El personaje *${char.name}* no tiene un tag válido para buscar imágenes.`);
        const imgs = await buscarImagen(tag);
        const img = imgs[Math.floor(Math.random() * imgs.length)];
        if (!img) return m.reply(`ꕥ No se encontraron imágenes para *${char.name}* con el tag *${tag}*.`);
        const caption = `❀ Nombre » *${char.name}*\n⚥ Género » *${char.gender || "Desconocido"}*\n❖ Fuente » *${seriesName}*`;
        await conn.sendFile(m.chat, img, char.name+".jpg", caption, m);
        break;
      }

      case "charvideo":
      case "waifuvideo":
      case "cvideo":
      case "wvideo": {
        const tag = char.tags?.[0];
        if (!tag) return m.reply(`ꕥ El personaje ${char.name} no tiene un tag válido para buscar videos.`);
        const urls = [
          `${global.APIs.delirius.url}/search/gelbooru?query=${formatTag(tag)}`,
          `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${formatTag(tag)}`,
          `https://danbooru.donmai.us/posts.json?tags=${formatTag(tag)}`
        ];

        let videos = [];
        for (const url of urls) {
          try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
            if (!res.ok || !res.headers.get("content-type").includes("json")) continue;
            const data = await res.json();
            const posts = Array.isArray(data) ? data : data.post || data.data || [];
            videos = posts.map(p => p.file_url || p.large_file_url || p.image || p?.media_asset?.variants?.[0]?.url)
              .filter(u => typeof u === "string" && /\.(gif|mp4)$/.test(u));
            if (videos.length) break;
          } catch {}
        }

        if (!videos.length) return m.reply(`ꕥ No se encontraron videos para ${char.name}.`);
        const video = videos[Math.floor(Math.random() * videos.length)];
        const caption = `❀ Nombre » *${char.name}*\n⚥ Género » *${char.gender || "Desconocido"}*\n❖ Fuente » *${seriesName}*`;
        await conn.sendFile(m.chat, video, char.name + (video.endsWith(".mp4") ? ".mp4" : ".gif"), caption, m);
        break;
      }
    }

  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["winfo", "wimage", "waifuvideo"];
handler.tags = ["gacha"];
handler.command = ['charinfo','winfo','waifuinfo','charimage','waifuimage','cimage','wimage','charvideo','waifuvideo','cvideo','wvideo'];
handler.group = true;

export default handler;
