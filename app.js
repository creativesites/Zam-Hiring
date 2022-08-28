

const { create, Client, decryptMedia, ev, smartUserAgent, NotificationLanguage } = require('@open-wa/wa-automate');
const mime = require('mime-types');
const fs = require('fs');
const wa = require('@open-wa/wa-automate');
const dialogflow = require('@google-cloud/dialogflow');
const {fileToBase64} = require('file-base64');
const path = require('path');
const moment = require('moment');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const asyncSleep = require('simple-async-sleep')
const schedule = require('node-schedule');
var lodash = require('lodash');
const serviceAccount = require('./sa1.json');
let availableJobs = []
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const ON_DEATH = fn => process.on("exit",fn) 
async function bd(){
  console.log('getting jobs')
  availableJobs = []
  const snapshot = await db.collection('Jobs').get();
  snapshot.forEach((doc) => {
  let hkf = doc.data()
  //console.log(hkf.name)
  availableJobs.push(hkf)
  });
}
bd()
const job = schedule.scheduleJob('42 * * * *', function(){
  console.log('getting jobs');
  bd()
});

let globalClient
ON_DEATH(async function() {
    console.log('killing session');
    if(globalClient)await globalClient.kill();
  })
  
  /**
   * Detect the qr code
   */
  ev.on('qr.**', async (qrcode,sessionId) => {
    //base64 encoded qr code image
    const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
    fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
  });
  
  /**
   * Detect when a session has been started successfully
   */
  ev.on('STARTUP.**', async (data,sessionId) => {
    if(data==='SUCCESS') console.log(`${sessionId} started!`)
  })
  
  wa.create({
    licenseKey: "F06AF165-DA3F4EC4-814580F1-57816687",
    sessionId: "Chatlearn",
    useChrome: true,
    multiDevice: true, //required to enable multiDevice support
    authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
  }).then(client => start(client));
  
  async function start(client) {
    async function runSample(projectId, msgNum, messageBody) {
      //const sessionClient = new dialogflow.SessionsClient();
      const sessionClient = new dialogflow.SessionsClient({ keyFilename: path.resolve(__dirname, './sa.json') })
      
      const sessionPath = sessionClient.projectAgentSessionPath(projectId, msgNum);
      // The text query request.
      const request = {
          session: sessionPath,
          queryInput: {
              text: {

                  text: messageBody,
                  languageCode: 'en-US'
              }
          }
      };
      await sessionClient
          .detectIntent(request)
          .then(async(res) => {
              //console.log(JSON.stringify(res))
              let res2 = JSON.parse(JSON.stringify(res));
              
              try {
                let resp = res[0].queryResult.fulfillmentMessages
                for (let index = 0; index < resp.length; index++) {
                  const element = resp[index];
                  if(element.image){
                    await client.sendImage(msgNum, element.image.imageUri, 'filename.jpeg', `*${element.text.text[0]}*\n`)
                     
                  }else if(element.payload){
                    let type = element.payload.fields.type.stringValue
                    if(type === 'video'){
                      let txtt = element.payload.fields.text.stringValue
                      let vid = element.payload.fields.video.stringValue
                      await client.sendText(msgNum, txtt)
                      await client.sendVideoAsGif(msgNum, vid, 'welcome.gif')
                    }
                    if(type === 'buttons'){
                      let ttx = element.payload.fields.text.stringValue
                      let btns = []
                      let btn1 = {}
                      let btn1Id = element.payload.fields.button1.structValue.fields.id.stringValue
                      let btn1text = element.payload.fields.button1.structValue.fields.txt.stringValue
                      btn1.id = btn1Id
                      btn1.text = btn1text
                      btns.push(btn1)
                      let btn2 = {}
                      let btn2Id = element.payload.fields.button2.structValue.fields.id.stringValue
                      let btn2text = element.payload.fields.button2.structValue.fields.txt.stringValue
                      btn2.id = btn2Id
                      btn2.text = btn2text
                      btns.push(btn2)
                      let btn3 = {}
                      let btn3Id = element.payload.fields.button3.structValue.fields.id.stringValue
                      let btn3text = element.payload.fields.button3.structValue.fields.txt.stringValue
                      btn3.id = btn3Id
                      btn3.text = btn3text
                      btns.push(btn3)
                      await client.sendText(msgNum, ttx)
                      await client.sendButtons(msgNum, 'Please select an option below', btns, 'Digital Code Bot Services', '©2022 Digital Code')
                    }
                    if(type === 'jobs'){
                      let jbsArr = element.payload.fields.jobs.listValue.values
                      jbsArr.forEach(async(element) => {
                        let btnns = []
                        let bId = element.structValue.fields.name.stringValue
                        let exp = element.structValue.fields.excerpt.stringValue
                        let cmpny = element.structValue.fields.company.stringValue
                        let lnk = element.structValue.fields.email.stringValue
                        let tt = element.structValue.fields.title.stringValue
                        let lp = `🏣 Company: ${cmpny}`
                        let bdy = `♨️ Position: ${tt}

${exp}

📮 Apply To: ${lnk}`
                        let bhk = {
                          id: bId,
                          text: bId
                        }
                        btnns.push(bhk)
                        await asyncSleep(4000)
                        await client.sendButtons(msgNum, bdy, btnns, lp, '©2022 Digital Code')
                      });
                    }
                    
                  }
                  else {
                    let msgs = element.text.text
                    for(const msg of msgs){
                      await client.sendText(msgNum, msg)
                    }
                  }
                  
                }
              } catch (error) {
                console.log(error)
              }
              

          })

  }
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT" || state==="UNLAUNCHED") client.forceRefocus();

    if(state==='UNPAIRED') console.log('LOGGED OUT!!!!')
  });
    client.onMessage(async message => {
        let serNum = message.from
        let userNum = serNum.slice(0, -5);
        
        var picked = lodash.filter(availableJobs, { 'name': message.body } );
        //console.log(message.body)
        if(picked.length > 0){
          let ell = picked[0]
          let cmp = ell.company
          let dtl = ell.details
          dtl = dtl.replace(/\./g, "\n")
          dtl = dtl.replace(/:\s*/g, '\n')
          let lnkk = ell.email
          let ttr = ell.title
          let bdy = `🏣 Company: ${cmp}
♨️ Position: ${ttr}
  
${dtl}
  
📮 Apply To: ${lnkk}`
          await client.sendText(message.from, bdy)
        }else{
          runSample('small-talk-5315f', message.from, message.body)
        }
      
        
      
    });
    
    
  }
  