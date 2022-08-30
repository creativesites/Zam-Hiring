const  axios = require('axios');
const newton = require('newtonmath.js');
let msg = 'factor/x^2 + 2x'
let factor = 'factor';
let toQuery = msg.slice(msg.indexOf(factor) + factor.length);
console.log(toQuery)
async function ab(){
    await axios.get(`https://newton.now.sh/factor${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        
    }).catch((err)=>{console.log(err)})
}   
//ab() 
newton.zeroes('x^2+2x', r => console.log(r));
newton.factor('x^2 + 2x', r => console.log(r))
