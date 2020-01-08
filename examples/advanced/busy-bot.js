#!/usr/bin/env node
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
const qrTerm = require('qrcode-terminal')
const runOps = require('./game')

const {
  IoClient,
  Wechaty,
  config,
  log,
}             = require('wechaty')

console.log(`
=============== Powered by Wechaty ===============
-------- https://github.com/Chatie/wechaty --------

I'm the BUSY BOT, I can do auto response message for you when you are BUSY.

Send command to FileHelper to:

1. '#busy' - set busy mode ON
2. '#busy I'm busy' - set busy mode ON and set a Auto Reply Message
3. '#free' - set busy mode OFF
4. '#status' - check the current Busy Mode and Auto Reply Message.

Loading... please wait for QrCode Image Url and then scan to login.
`)

let bot

const token = config.token

if (token) {
  log.info('Wechaty', 'TOKEN: %s', token)

  bot = Wechaty.instance({ profile: token })
  const ioClient = new IoClient({
    token,
    wechaty: bot,
  })

  ioClient.start().catch(e => {
    log.error('Wechaty', 'IoClient.init() exception: %s', e)
    bot.emit('error', e)
  })
} else {
  log.verbose('Wechaty', 'TOKEN: N/A')
  bot = Wechaty.instance()
}

bot
.on('scan', (qrcode, status) => {
  qrTerm.generate(qrcode, { small: true })
  console.log(`${status}: ${qrcode} - Scan QR Code of the url to login:`)
})
.on('logout'	, user => log.info('Bot', `${user.name()} logouted`))
.on('error'   , e => log.info('Bot', 'error: %s', e))

.on('login', async function(user) {
  const msg = `${user.name()} logined`

  log.info('Bot', msg)
  await this.say(msg)

})

/**
 * Global Event: message
 */

let busyIndicator    = false
let busyAnnouncement = `[自动回复] 你好，短期内无法回复你的消息，若有急事请电话联系，抱歉。\n[Auto Reply] Hey, this is a game. Say Yahaha!`
let gameMap = {
  'START': '=== 游戏开始 ===\n' +
          '起始位置：(2, 4)\n' + 
          '终点位置：(0, 0)\n' +
          '上下左右：wsad\n' + 
          '剩余生命：3',
  'WIN': 'YOU WIN !!!',
  'LOSE': 'GAME OVER :(',
  GAMING: function ({life, cx, cy}) {
    return `当前位置：(${cx}, ${cy})\n` +
           `剩余生命：${life}`
  }
}
const passwords = ['yahaha', 'yahaha!', 'yahaha！']
let startedSenders = {}

bot.on('message', async function(msg) {
  log.info('Bot', '(message) %s', msg)

  const filehelper = bot.Contact.load('filehelper')

  const sender   = msg.from()
  const receiver = msg.to()
  const text     = msg.text().toLowerCase()
  const room     = msg.room()

  // if (msg.age() > 60) {
  //   log.info('Bot', 'on(message) skip age(%d) > 60 seconds: %s', msg.age(), msg)
  //   return
  // }

  if (!sender || !receiver) {
    return
  }

  if (receiver.id === 'filehelper') {
    if (text === '#status') {
      await filehelper.say('in busy mode: ' + busyIndicator)
      await filehelper.say('auto reply: ' + busyAnnouncement)

    } else if (text === '#free') {
      busyIndicator = false
      await filehelper.say('auto reply stopped.')

    } else if (/^#busy/i.test(text)) {

      busyIndicator = true
      await filehelper.say('in busy mode: ' + 'ON')

      const matches = text.match(/^#busy (.+)$/i)
      if (!matches || !matches[1]) {
        await filehelper.say('auto reply message: "' + busyAnnouncement + '"')

      } else {
        busyAnnouncement = matches[1]
        await filehelper.say('set auto reply to: "' + busyAnnouncement + '"')

      }
    }

    return
  }

  if (sender.type() !== bot.Contact.Type.Personal) {
    return
  }

  if (!busyIndicator) {
    return  // free
  }

  if (msg.self()) {
    return
  }
  /**
   * 1. Send busy anoncement to contact
   */
  // console.log(sender)
  if (!room) {
    // 游戏已开始
    if (startedSenders.hasOwnProperty(sender.id)) {
      if (startedSenders[sender.id].win) {
        await msg.say('赢了就别来找我了 没有奖品')
        return 
      }
      let res = runOps(text, startedSenders[sender.id].cx, startedSenders[sender.id].cy)
      if (res.win) {
        startedSenders[sender.id].win = true
        await msg.say(gameMap.WIN)
      } else if (startedSenders[sender.id].life <= res.lostLife) {
        await msg.say(gameMap.LOSE) // TODO:
        delete startedSenders[sender.id]
      } else {
        startedSenders[sender.id].cx = res.cx
        startedSenders[sender.id].cy = res.cy
        startedSenders[sender.id].life -= res.lostLife
        await msg.say(gameMap.GAMING(startedSenders[sender.id])) // TODO:
      }
    // 触发游戏开始口令
    } else if (passwords.includes(text)) {
      startedSenders[sender.id] = {
        cx: 2,
        cy: 4,
        life: 2,
        win: false
      }
      await msg.say(gameMap.START)
    // 未触发开始游戏
    } else {
      await msg.say(busyAnnouncement)
    }
    return
  }

  /**
   * 2. If there's someone mentioned me in a room,
   *  then send busy annoncement to room and mention the contact who mentioned me.
   */
  // const contactList = await msg.mention()
  // const contactIdList = contactList.map(c => c.id)
  // if (contactIdList.includes(this.userSelf().id)) {
  //   await msg.say(busyAnnouncement, sender)
  // }

})

bot.start()
.catch(e => console.error(e))
