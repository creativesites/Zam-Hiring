

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
const serviceAccount = require('./sa1.json');
let availableJobs = []
initializeApp({
  credential: cert(serviceAccount)
});
const subs = require('./subs.json')
const db = getFirestore();
const {min,max, sum, quantile, mean,mode, median,rootMeanSquare, sampleSkewness, variance, sampleVariance, standardDeviation, zScore} = require('simple-statistics');
const {atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt} = require('mathjs');
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
    restartOnCrash: start,
    killProcessOnBrowserClose: true,
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
                    await client.sendImage(msgNum, element.image.imageUri, 'filename.jpeg')
                     
                  }else if(element.payload){
                    let type = element.payload.fields.type.stringValue
                    console.log(type)
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
                      await client.sendButtons(msgNum, ttx, btns, 'Digital Code Bot Services', '©2022 Digital Code')
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
                        await client.sendButtons(msgNum, bdy, btnns, lp, '©2022 Digital Code. To get more details: Click on the button below')
                      });
                    }
                    if(type === 'subjectList'){
                      let sbj = element.payload.fields.subjects.listValue.values
                      sbj.forEach(async(elm) => {
                        let nmm = elm.stringValue
                        let bId = nmm.replace(/\s+/g, '');
                        let bbt = []
                        let bhk = {
                          id: bId,
                          text: nmm.replace('.', '') + ' - Notes'
                        }
                        let bhk2 = {
                          id: bId + '12',
                          text: nmm.replace('.', '') + ' - Tests'
                        }
                        bbt.push(bhk)
                        bbt.push(bhk2)
                        await asyncSleep(4000)
                        await client.sendButtons(msgNum, 'To select the subject: Click on the button below', bbt, 'Select Subject', '©2022 Digital Code')
                      });
                    }
                    if(type === 'subjectNotes'){
                      let nts = element.payload.fields.notes.listValue.values
                      let bs = nts.length
                      if(bs > 0){
                        nts.forEach(async(elk) => {
                          let nonm = elk.structValue.fields.name.stringValue
                          let ifp = nonm.replace(/\s+/g, '');
                          let bbt = []
                          let bhk = {
                            id: ifp,
                            text: nonm
                          }
                          bbt.push(bhk)
                          await asyncSleep(4000)
                          await client.sendButtons(msgNum, 'To select Notes you want: Click on the button below\n*Please Note: The pdf files can sometimes take a while to arrive*', bbt, 'Select Notes', '©2022 Digital Code')
                        });
                      }else{
                        await client.sendText('Sorry, we currently have no notes for this subject')
                      }
                      
                    }
                    if(type === 'subjectTests'){
                      let nts = element.payload.fields.tests.listValue.values
                      let bs = nts.length
                      console.log(bs)
                      if(bs > 0){
                        nts.forEach(async(elk) => {
                          try {
                            let nb = elk.structValue.fields.exam.structValue.fields.name.stringValue
                            let exm = nb.replace('.', '') + '-Answers'
                            let ifp = nb.replace(/\s+/g, '');
                          let bbt = []
                          let bhk = {
                            id: ifp,
                            text: nb
                          }
                          let bhk1 = {
                            id: ifp,
                            text: exm
                          }
                          bbt.push(bhk)
                          bbt.push(bhk1)
                          await asyncSleep(4000)
                          await client.sendButtons(msgNum, 'To select Test or Answers you want: Click on the button below.\n*Please Note: The pdf files can sometimes take a while to arrive*', bbt, 'Select Tests', '©2022 Digital Code')
                          } catch (error) {
                            let nom = elk.structValue.fields.name.stringValue
                            let ifp = nom.replace(/\s+/g, '');
                          let bbt = []
                          let bhk = {
                            id: ifp,
                            text: nom
                          }
                          bbt.push(bhk)
                          await asyncSleep(4000)
                          await client.sendButtons(msgNum, 'To select Test or Answersyou want: Click on the button below.\n*Please Note: The pdf files can sometimes take a while to arrive*', bbt, 'Select Tests', '©2022 Digital Code')
                          }
                          
                        });
                      }else{
                        await client.sendText(msgNum,'Sorry, we currently have no tests for this subject')
                      }
                      
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
        try {
          let serNum = message.from
        let userNum = serNum.slice(0, -5);
        //await client.sendFileFromUrl(message.from, 'https://drive.google.com/uc?export=download&id=1mo1ffXpeMt-pxnfAaxPsUVRy-QYG3w6K', 'file.pdf', 'test file', viewOnce = true)
        var picked = lodash.filter(availableJobs, { 'name': message.body } );
        let subSel = lodash.filter(subs, { 'name': message.body } );
        //console.log(message.body)
        if (message.mimetype){}
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
          if(subSel.length > 0){
            let kd = subSel[0]
            let url = kd.url
            let nm = kd.name
            let flnm = nm + '.pdf'
            await client.sendFileFromUrl(message.from, url, flnm, nm, viewOnce = true)
          }else{
            let mmsg = message.body.toLowerCase()
            if (message.body.toLowerCase().includes('factor')){
              let factor = 'factor';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/factor${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `factorising *${toQuery}* gives you:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          else if (message.body.toLowerCase().includes('simplify')){
              let factor = 'simplify';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/simplify${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `simplifying *${toQuery}* gives you:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          else if (message.body.toLowerCase().includes('derive')){
              let factor = 'derive';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/derive${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `deriving *${toQuery}* gives you:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          else if (message.body.toLowerCase().includes('integrate')){
              let factor = 'integrate';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/integrate${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `integrating *${toQuery}* gives you:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          else if (message.body.toLowerCase().includes('tangent')){
              let factor = 'tangent';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/tangent${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `the tangent of *${toQuery}* is:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          
          else if (message.body.toLowerCase().includes('area')){
              let factor = 'area';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/area${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `the area under the curve *${toQuery}* is:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          else if (message.body.toLowerCase().includes('log')){
              let factor = 'log';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              await axios.get(`https://newton.now.sh/api/v2/log${toQuery}`
              ).then(async(result1)=>{
                  let res = result1.data;
                  console.log(res);
                  await client.sendText(message.from, `the logarithm of *${toQuery}* is:  *${res.result}*`)
              }).catch((err)=>{console.log(err)})
          }
          
          else if (message.body.toLowerCase().includes('evaluate')){
              let factor = 'evaluate';
              let toQuery = message.body.slice(mmsg.indexOf(factor) + factor.length);
              console.log(toQuery)
              let answer = await evaluate(toQuery);
          
              await client.sendText(message.from, `the result of evaluating *${toQuery}* is:  *${answer}*`);
          
          }
          
          else if (message.body.toLowerCase() === 'help'){
              await client.sendText(message.from, `*Operation:*  Simplifying Algebraic Expressions
          *Example:*  simplify/2^2+2(2)
          *Operation:*  Factorisation
          *Example:*  factor/x^2 + 2x
          *Operation:*  Deriving
          *Example:*  derive/x^2+2x
          *Operation:*  Find Tangent
          *Example:*  tangent/2lx^3
          *Keep in mind:* To find the tangent line of a function at a certain x value, send the request as c|f(x) where c is the given x value and f(x) is the equation of the line, the separator is a vertical bar '|'.
          *Operation:*  Integrating
          *Example:*  integrate/x^2+2x
          *Operation:*  Area Under a Curve
          *Example:*  area/2:4lx^3
          To find the area under a function, send the request as c:d|f(x) where c is the starting x value, d is the ending x value, and f(x) is the function under which you want the curve between the two x values.
          *Operation:*  Logarithm
          *Example:*  log/2l8
          *functions and constants*
          *expressions*
          evaluate12 / (2.3 + 0.7)   // 4
          evaluate12.7 cm to inch    // 5 inch
          evaluatesin(45 deg) ^ 2    // 0.5
          evaluate9 / 3 + 2i         // 3 + 2i
          evaluatedet([-1, 2; 3, 1]) // -7
          
              `)
          }
            else{
              runSample('small-talk-5315f', message.from, message.body)
            }
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
  