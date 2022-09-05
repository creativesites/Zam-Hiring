

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
const axios = require('axios')
const serviceAccount = require('./sa2.json');
const { count } = require('console');

const ON_DEATH = fn => process.on("exit",fn) 
let pple = []
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
    sessionId: "Jobs",
    useChrome: true,
    multiDevice: true, //required to enable multiDevice support
    authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
    blockCrashLogs: true,
    disableSpins: true,
    restartOnCrash: start,
    killProcessOnBrowserClose: true,
    headless: true,
    logConsole: false,
    popup: true,
    qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
  }).then(client => start(client));
  
  async function start(client) {
  
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT" || state==="UNLAUNCHED") client.forceRefocus();

    if(state==='UNPAIRED') console.log('LOGGED OUT!!!!')
  });
    client.onMessage(async message => {
        try {
          let serNum = message.from
        let userNum = serNum.slice(0, -5);
        var picked = lodash.filter(pple, { 'num': message.from } );
        if (message.type === 'document'){
            await client.sendText(message.from, 'Thank you for submitting your CV. Goodbye.')
        }
        if(message.type === 'chat'){
            if(picked.length > 0){
                if(message.body === 'Leave My CV'){
                    await client.sendText(message.from, 'Send your CV')
                }
                else if(message.body === 'Leave A Message'){
                    await client.sendText(message.from, 'Leave me your message. Our team will get back to you')
                }else{
                    let ell = picked[0]
                    let cnt = ell.count;
                    if(cnt === 2){}
                    else{
                        await client.sendText(message.from, 'Sorry I can only get your CV or take a message. Our team will get back to you.')
                        for (const obj of pple) {
                            if (obj.num === message.from) {
                              obj.count = 2;
                          
                              break;
                            }
                          }
                    }
                }
            }else{
                let btnz = [
                    {
                        id: 'one',
                        text: 'Leave My CV'
                    },
                    {
                        id: 'two',
                        text: 'Leave A Message'
                    }
                ]
                let bdy = 'Hello , Im the Digital Code AI Assistant. Please send me your cv and we will get in touch with you.\n\nSelect an option below.'
                await client.sendButtons(message.from, bdy, btnz, 'Leave Your CV', '©2022 Digital Code. To proceed: Click on the button below')
                pple.push({
                    num: message.from,
                    count: 1
                })
            }
            
        }
        
        } catch (error) {
          
        }
      
        
      
    });
    client.onIncomingCall(async call=>{
      await client.sendText(call.peerJid._serialized, 'Sorry I cannot accept calls');
  });
  client.onAddedToGroup(async(chat)=>{
    console.log(chat)
    try {
      let gid = chat.id
      await client.leaveGroup(gid)
    } catch (error) {
      
    }
  })
    
    
  }
  