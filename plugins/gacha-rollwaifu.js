import fetch from 'node-fetch';
import { promises as fs } from 'fs';

async function loadCharacters() {
  try {
    await fs.access("./lib/characters.json");
  } catch {
    await fs.writeFile("./lib/characters.json", '{}');
  }
  const data = await fs.readFile("./lib/characters.json", 'utf-8');
  return JSON.parse(data);
}

function flattenCharacters(characters) {
  return Object.values(characters).flatMap(c => Array.isArray(c.characters) ? c.characters : []);
}

function getSeriesNameByCharacter(characters, id) {
  return Object.entries(characters).find(([, c]) => Array.isArray(c.characters) && c.characters.some(ch => String(ch.id) === String(id)))?.[1]?.["name"] || 'Desconocido';
}

function formatTag(tag) {
  return String(tag).trim().toLowerCase().replace(/\s+/g, '_');
}

async function buscarImagenDelirius(tag) {
  const formattedTag = formatTag(tag);
  const urls = [
    'https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=' + formattedTag,
    "https://danbooru.donmai.us/posts.json?tags=" + formattedTag,
    global.APIs.delirius.url + "/search/gelbooru?query=" + formattedTag
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': "Mozilla/5.0", 'Accept': "application/json" }
      });
      const contentType = res.headers.get("content-type") || '';
      if (!res.ok || !contentType.includes("json")) continue;
      const json = await res.json();
      const posts = Array.isArray(json) ? json : json?.post || json?.data || [];
      const images = posts.map(p => p?.file_url || p?.large_file_url || p?.image || p?.media_asset?.variants?.[0]?.url)
                          .filter(url => typeof url === "string" && /\.(jpe?g|png)$/.test(url));
      if (images.length) return images;
    } catch {}
  }
  return [];
}

// Cambiado para tu repositorio Ouka-MD
const verifi = async () => {
  try {
    const pkg = await fs.readFile("./package.json", "utf-8");
    const json = JSON.parse(pkg);
    return json.repository?.['url'] === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

const handler = async (m, { conn, usedPrefix, command }) => {
  if (!(await verifi())) {
    return conn.reply(m.chat, `❀ El comando *<${command}>* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`, m);
  }

  const chats = global.db.data.chats;
  if (!chats[m.chat]) chats[m.chat] = {};
  const chatData = chats[m.chat];
  if (!chatData.characters) chatData.characters = {};

  if (!chatData.gacha && m.isGroup) {
    return m.reply(`ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  const userData = global.db.data.users[m.sender];
  const now = Date.now();
  if (userData.lastRoll && now < userData.lastRoll) {
    const remaining = Math.ceil((userData.lastRoll - now) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    let text = '';
    if (minutes > 0) text += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
    if (seconds > 0 || text === '') text += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    return m.reply(`ꕥ Debes esperar *${text.trim()}* para usar *${usedPrefix + command}* de nuevo.`);
  }

  try {
    const allChars = await loadCharacters();
    const flattened = flattenCharacters(allChars);
    const selected = flattened[Math.floor(Math.random() * flattened.length)];
    const charId = String(selected.id);
    const seriesName = getSeriesNameByCharacter(allChars, selected.id);
    const tag = formatTag(selected.tags?.[0] || '');
    const images = await buscarImagenDelirius(tag);
    const image = images[Math.floor(Math.random() * images.length)];

    if (!image) return m.reply(`ꕥ No se encontró imágenes para el personaje *${selected.name}*.`);

    if (!global.db.data.characters) global.db.data.characters = {};
    if (!global.db.data.characters[charId]) global.db.data.characters[charId] = {};

    const charData = global.db.data.characters[charId];
    const prevData = global.db.data.characters?.[charId] || {};

    charData.name = String(selected.name || "Sin nombre");
    charData.value = typeof prevData.value === "number" ? prevData.value : Number(selected.value) || 100;
    charData.votes = Number(charData.votes || prevData.votes || 0);
    charData.reservedBy = m.sender;
    charData.reservedUntil = now + 20000;
    charData.expiresAt = now + 60000;

    let ownerName = await (async () => {
      if (typeof charData.user === "string" && charData.user.trim()) {
        return global.db.data.users[charData.user]?.["name"]?.trim() || 
               await conn.getName(charData.user).then(n => n?.trim() || charData.user.split('@')[0]).catch(() => charData.user.split('@')[0]);
      } else {
        return 'desconocido';
      }
    })();

    const caption = `❀ Nombre » *${charData.name}*\n⚥ Género » *${selected.gender || 'Desconocido'}*\n✰ Valor » *${charData.value.toLocaleString()}*\n♡ Estado » *${charData.user ? "Reclamado por " + ownerName : "Libre"}*\n❖ Fuente » *${seriesName}*`;

    const sentMsg = await conn.sendFile(m.chat, image, charData.name + ".jpg", caption, m);

    chatData.lastRolledId = charId;
    chatData.lastRolledMsgId = sentMsg.key?.id || null;
    chatData.lastRolledCharacter = { id: charId, name: charData.name, media: image };
    userData.lastRoll = now + 900000; // 15 minutos cooldown
  } catch (err) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa ${usedPrefix}report para informarlo.\n\n${err.message}`, m);
  }
};

handler.help = ["ver", "rw", "rollwaifu"];
handler.tags = ['gacha'];
handler.command = ["rollwaifu", "rw", "roll"];
handler.group = true;

export default handler;
