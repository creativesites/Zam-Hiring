// listen for messages from the parent process
process.on("message", message => {
    let isPrime = checkIfPrime(message);
    // send the results back to the parent process
    process.send(isPrime);
    // kill the child process
    process.exit();
})


function checkIfPrime(number){
    let isPrime = true;
    for (let i = 2; i < number; i++){
        if(number % i === 0){
            isPrime = false;
        }
    }
    return isPrime && number > 1;
}