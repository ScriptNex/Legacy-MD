import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

//BETA: Si quiere evitar escribir el número que será bot en la consola, agregué desde aquí entonces:
//Sólo aplica para opción 2 (ser bot con código de texto de 8 digitos)
global.botNumber = "" //Ejemplo: 573218138672

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.owner = [
  '5216631079388', // 🜲 Propietario 🜲
  '5212202410659',
  '573154062343',
  '573214401313',
  '117094280605916', // Destroy
]

global.suittag = [] 
global.prems = []

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.libreria = "Baileys Multi Device"
global.vs = "^1.8.2|Latest"
global.nameqr = "Ouka-MD"
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.OukaJadibts = true

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.botname = "⏤͟͟͞͞⸙ְ̻࠭ ✿ 𝑳𝒆𝒈𝒂𝒄𝒚 𝑩𝒐𝒕 ✿ ⸙ְ̻࠭"
global.textbot = "⏤͟͟͞͞⸙ְ̻࠭ ✿ 𝑳𝒆𝒈𝒂𝒄𝒚 𝑩𝒐𝒕 ✿ ⸙ְ̻࠭"
global.dev = "⚙️ ⌬ 𝙲𝚞𝚜𝚝𝚘𝚖 𝙼𝚘𝚍𝚜 𝙱𝚢 𐔌 𝑵𝒆𝒚𝒌𝒐𝒐𝒓 💻🛠️"
global.author = "𐔌 𝗡𝗲𝘆𝗸𝗼𝗼𝗿 ❝ 𝗠𝗮𝗱𝗲 𝗪𝗶𝘁𝗵 𝗟𝗼𝘃𝗲 ❞ 𓆩 ͡꒱"
global.etiqueta = "𝑵𝒆𝒚𝒌𝒐𝒐𝒓 💻🛠️"
global.currency = "¥enes"
global.banner = "https://files.catbox.moe/p9ueek.jpg"
global.icono = "https://files.catbox.moe/ecdeli.jpeg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.group = "https://chat.whatsapp.com/Gqv0byeAjXiHPL5bX94UGE"
global.community = "https://chat.whatsapp.com/CHXQizfRDItFdWM8F217oB"
global.channel = "https://whatsapp.com/channel/0029VazHywx0rGiUAYluYB24"
global.github = "https://github.com/Aqua200"
global.gmail = "chinquepapa@gmail.com"
global.ch = {
ch1: "120363392571425662@newsletter"
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

global.APIs = {
xyro: { url: "https://api.xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null },
adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
}

//*─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})
