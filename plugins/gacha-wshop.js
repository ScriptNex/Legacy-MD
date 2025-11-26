import { promises as fs } from 'fs';

// Verifica que el comando solo se ejecute en este repositorio
const verifi = async () => {
  try {
    const packageJson = await fs.readFile("./package.json", "utf-8");
    const data = JSON.parse(packageJson);
    return data.repository?.url === "git+https://github.com/ScriptNex/Legacy-MD.git";
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!(await verifi())) {
    return conn.reply(
      m.chat,
      `❀ El comando *<${command}>* solo está disponible para Legacy-MD.\n> https://github.com/ScriptNex/Legacy-MD.git`,
      m
    );
  }

  const chatData = global.db.data.chats[m.chat];
  if (!chatData.sales) chatData.sales = {};
  if (!global.db.data.characters) global.db.data.characters = {};
  if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = { coin: 0, characters: [] };

  if (!chatData.gacha && m.isGroup) {
    return m.reply(
      `ꕥ Los comandos de *Gacha* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con el comando:\n» *${usedPrefix}gacha on*`
    );
  }

  try {
    switch (command) {
      case "sell":
      case "vender": {
        if (args.length < 2) {
          return m.reply(`❀ Debes especificar un precio y el personaje.\n> Ejemplo » *${usedPrefix + command} 5000 Yuki Suou*`);
        }
        const price = parseInt(args[0]);
        if (isNaN(price) || price < 2000) return m.reply(`ꕥ El precio mínimo para subastar un personaje es de *¥2,000*.`);

        const charName = args.slice(1).join(" ").toLowerCase();
        const charId = Object.keys(global.db.data.characters).find(
          k => (global.db.data.characters[k]?.name || '').toLowerCase() === charName && global.db.data.characters[k]?.user === m.sender
        );

        if (!charId) return m.reply(`ꕥ No se ha encontrado al personaje *${args.slice(1).join(" ")}*.`);

        const char = global.db.data.characters[charId];
        chatData.sales[charId] = { name: char.name, user: m.sender, price, time: Date.now() };

        let sellerName = await (async () =>
          global.db.data.users[m.sender].name?.trim() || (await conn.getName(m.sender).catch(() => m.sender.split('@')[0]))
        )();

        m.reply(
          `✎ *${char.name}* ha sido puesto a la venta!\n❀ Vendedor » *${sellerName}*\n⛁ Valor » *¥${price.toLocaleString()}*\nⴵ Expira en » *3 dias*\n> Puedes ver los personajes en venta usando *${usedPrefix}wshop*`
        );
        break;
      }

      case "removesale":
      case "removerventa": {
        if (!args.length) return m.reply(`❀ Debes especificar un personaje para eliminar.\n> Ejemplo » *${usedPrefix + command} Yuki Suou*`);

        const charName = args.join(" ").toLowerCase();
        const charId = Object.keys(chatData.sales).find(k => (chatData.sales[k]?.name || '').toLowerCase() === charName);

        if (!charId || chatData.sales[charId].user !== m.sender) {
          return m.reply(`ꕥ El personaje *${args.join(" ")}* no está a la venta por ti.`);
        }

        delete chatData.sales[charId];
        m.reply(`❀ *${args.join(" ")}* ha sido eliminado de la lista de ventas.`);
        break;
      }

      case "wshop":
      case "haremshop":
      case "tiendawaifus": {
        const salesList = Object.entries(chatData.sales || {});
        if (!salesList.length) {
          const groupName = (await conn.groupMetadata(m.chat)).subject || "este grupo";
          return m.reply(`ꕥ No hay personajes en venta en *${groupName}*`);
        }

        const page = parseInt(args[0]) || 1;
        const pages = Math.ceil(salesList.length / 10);
        if (page < 1 || page > pages) return m.reply(`ꕥ Página inválida. Solo hay *${pages}* disponible(s).`);

        const lines = [];
        for (const [charId, data] of salesList.slice((page - 1) * 10, page * 10)) {
          const remaining = 259200000 - (Date.now() - data.time); // 3 días en ms
          const d = Math.floor(remaining / 86400000);
          const h = Math.floor((remaining % 86400000) / 3600000);
          const m_ = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);

          const sellerName = await (async () =>
            global.db.data.users[data.user]?.name?.trim() || (await conn.getName(data.user).catch(() => data.user.split('@')[0]))
          )();

          const value = typeof global.db.data.characters[charId]?.value === 'number' ? global.db.data.characters[charId].value : 0;

          lines.push(`❀ *${data.name}* (✰ ${value}):\n⛁ Precio » *¥${data.price.toLocaleString()}*\n❖ Vendedor » *${sellerName}*\nⴵ Expira en » *${d}d ${h}h ${m_}m ${s}s*`);
        }

        m.reply(`*☆ HaremShop*\n❏ Personajes en venta <${salesList.length}>:\n\n${lines.join("\n\n")}\n\n> • Página *${page}* de *${pages}*`);
        break;
      }

      case "buyc":
      case "buycharacter":
      case "buychar": {
        if (!args.length) return m.reply(`❀ Debes especificar un personaje para comprar.\n> Ejemplo » *${usedPrefix + command} Yuki Suou*`);

        const charName = args.join(" ").toLowerCase();
        const charId = Object.keys(chatData.sales).find(k => (chatData.sales[k]?.name || '').toLowerCase() === charName);

        if (!charId) return m.reply(`ꕥ No se ha encontrado al personaje *${args.join(" ")}* en venta.`);

        const sale = chatData.sales[charId];
        if (sale.user === m.sender) return m.reply(`ꕥ No puedes comprar tu propio personaje.`);

        const buyer = global.db.data.users[m.sender];
        if (buyer.coin < sale.price) return m.reply(`ꕥ No tienes suficientes monedas para comprar a *${sale.name}*.\n> Necesitas *¥${sale.price.toLocaleString()}*`);

        const seller = global.db.data.users[sale.user] || { coin: 0, characters: [] };
        buyer.coin -= sale.price;
        seller.coin += sale.price;

        global.db.data.characters[charId].user = m.sender;
        if (!buyer.characters.includes(charId)) buyer.characters.push(charId);
        seller.characters = seller.characters.filter(c => c !== charId);
        if (seller.favorite === charId) delete seller.favorite;

        delete chatData.sales[charId];

        const sellerName = await (async () => seller.name?.trim() || (await conn.getName(sale.user).catch(() => sale.user.split('@')[0])))();
        const buyerName = await (async () => buyer.name?.trim() || (await conn.getName(m.sender).catch(() => m.sender.split('@')[0])))();

        m.reply(`❀ *${sale.name}* ha sido comprado por *${buyerName}*!\n> Se han transferido *¥${sale.price.toLocaleString()}* a *${sellerName}*`);
        break;
      }
    }
  } catch (e) {
    await conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`, m);
  }
};

handler.help = ["sell", "removesale", "wshop", "buyc"];
handler.tags = ["gacha"];
handler.command = ["sell", "vender", "removesale", "removerventa", "haremshop", "tiendawaifus", "wshop", "buycharacter", "buychar", "buyc"];
handler.group = true;

export default handler;
