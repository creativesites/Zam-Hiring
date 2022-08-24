

const { create, Client, decryptMedia, ev, smartUserAgent, NotificationLanguage } = require('@open-wa/wa-automate');
const mime = require('mime-types');
const fs = require('fs');
const wa = require('@open-wa/wa-automate');
const dialogflow = require('@google-cloud/dialogflow');
const {fileToBase64} = require('file-base64');
const imageDataURI = require('image-data-uri');
const path = require('path');
const moment = require('moment');


const ON_DEATH = fn => process.on("exit",fn) 

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
      const sessionClient = new dialogflow.SessionsClient({ keyFilename: path.resolve(__dirname, './utils/sa.json') })
      
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
                    imageDataURI
                        .encodeFromURL(element.image.imageUri)
                        .then(async(resp2) => {
                            await client.sendImage(msgNum, resp2, 'filename.jpeg', `*${element.text.text[0]}*\n`)
                            

                        })
                        .catch((err1) => {
                            console.log('failed to send img')
                        })
                    
                  }else {
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
        if(message.body === 'Test server'){
          await client.sendText(message.from, '👋 Hello from server!')
        }
        runSample('whatsapp-chatbot-290018', message.from, message.body)
      
    });
    
    
  }
  