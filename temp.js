const  axios = require('axios');


if (message.body.includes('factor')){
    let factor = 'factor';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/factor/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `factorising *${toQuery}* gives you:  *${res.result}*`)
    })
}
if (message.body.includes('simplify')){
    let factor = 'simplify';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/simplify/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `simplifying *${toQuery}* gives you:  *${res.result}*`)
    })
}
if (message.body.includes('derive')){
    let factor = 'derive';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/derive/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `deriving *${toQuery}* gives you:  *${res.result}*`)
    })
}
if (message.body.includes('integrate')){
    let factor = 'integrate';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/integrate/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `integrating *${toQuery}* gives you:  *${res.result}*`)
    })
}
if (message.body.includes('tangent')){
    let factor = 'tangent';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/tangent/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `the tangent of *${toQuery}* is:  *${res.result}*`)
    })
}
if (message.body.includes('area')){
    let factor = 'area';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/area/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `the area under the curve *${toQuery}* is:  *${res.result}*`)
    })
}
if (message.body.includes('log')){
    let factor = 'log';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    axios.get(`https://newton.now.sh/log/${toQuery}`
    ).then((result1)=>{
        let res = result1.data;
        console.log(res);
        client.sendText(message.from, `the logarithm of *${toQuery}* is:  *${res.result}*`)
    })
}

if (message.body.includes('evaluate')){
    let factor = 'evaluate';
    let toQuery = message.body.slice(message.body.indexOf(factor) + factor.length);
    let answer = evaluate(toQuery);

    client.sendText(message.from, `the result of evaluating *${toQuery}* is:  *${answer}*`);

}

if (message.body.toLowerCase() === 'help'){
    client.sendText(message.from, `*Operation:*  Simplifying Algebraic Expressions
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
