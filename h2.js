const childProcess = require('child_process')
const express = require('express')
const bodyParser = require('body-parser')

const app = express();
app.use(bodyParser.json());


app.post("/someBigProcess",async (req,res) => {
    // const forked_child_process = childProcess.fork('./checkIfPrime.js');
    // // send message to the child process
    // forked_child_process.send(parseInt(req.body.number));
    // // listen for a response from the child process
    // forked_child_process.on("message", isTheNumberPrime => res.send(isTheNumberPrime));
    let hj = parseInt(req.body.number)
    function checkIfPrime(number){
        let isPrime = true;
        for (let i = 2; i < number; i++){
            if(number % i === 0){
                isPrime = false;
            }
        }
        return isPrime && number > 1;
    }
    let res1 = await checkIfPrime(hj)
    res.send(res1)
})

app.listen(3000, () => {
    console.log('server started on port 3000');
})