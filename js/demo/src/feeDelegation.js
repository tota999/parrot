// ### Fee Delegation Demo (Free Transfer Demo) ### 

const { BN } = require('bn.js');
// this is the client to interact with oax blockchain 
const ParrotInterface = require('parrot-client');
// helper function to get user input 
const askQuestion = require('./util/util.js')

// sleep time between actions
const SLEEP = 6000;

// sleep blocking
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function prettyPrintDelegatedTransfer(dtd, parrot) {
    console.log(`SignedDTD: \n 
    Signature: ${dtd.signature} \n
    Signer: ${dtd.signer} \n
    Transfer: \n
        amount: ${parrot.formatToCurrency(dtd.transfer.amount)} \n
        to: ${dtd.transfer.to} \n
        nonce: ${dtd.transfer.nonce}
        `);
}


async function getAliceBobBalStats(parrot, aliceAddress, bobAddress, charlieAddress) {
    const balAlice = await parrot.getFreeBalance(aliceAddress);
    const balBob = await parrot.getFreeBalance(bobAddress);
    const balCharlie = await parrot.getFreeBalance(charlieAddress);
    console.log(` Balance Summary: \n Alice: ${parrot.formatToCurrency(balAlice)} Bob ${parrot.formatToCurrency(balBob)} Charlie ${parrot.formatToCurrency(balCharlie)}`);
    return [balAlice, balBob, balCharlie];
}

async function balanceDifference(parrot, balAlice, balBob, balCharlie,
    balAliceNew, balBobNew, balCharlieNew) {
    const aliceSpent = balAlice.sub(balAliceNew);
    const bobSpent = balBob.sub(balBobNew);
    const charlieReceived = balCharlieNew.sub(balCharlie);
    console.log(`Alice spent ${parrot.formatToCurrency(aliceSpent)} Bob spent ${parrot.formatToCurrency(bobSpent)} Charlie Received: ${parrot.formatToCurrency(charlieReceived)}`);
}

async function feeDelegationDemo() {
    // Get a new instance of the interface
    const parrot = new ParrotInterface();
    // Init api
    await parrot.initApi();
    // Init keyRings
    await parrot.initKeyRings();
    // get keyRings
    let ALICE; let BOB; let CHARLIE; let
        DAVE;
    [ALICE, BOB, CHARLIE, DAVE] = parrot.keyRingPairs;

    // amount to transfer in each transfer
    const AMOUNT = parrot.DOLLARS.mul(new BN('99'));

    let balAlice; let balBob; let
        balCharlie;
    [balAlice, balBob, balCharlie] = await getAliceBobBalStats(parrot, ALICE.address, BOB.address, CHARLIE.address);

    console.log(`Bob wants to send ${parrot.formatToCurrency(AMOUNT)} to Charlie but does not want to pay fees!`);

    // Bob creates a dtd
    const dtd = await parrot.createDelegatedTransferDetails(BOB.address, CHARLIE.address, AMOUNT);
    // Bob signs it
    const signature = await parrot.signDtd(BOB, dtd);
    // Bob creates a SignedDtd
    const signedDtd = await parrot.createSignedDtd(dtd, signature, BOB.address);
    console.log('Bob has created a signedDelegatedTransferDetails that he can share with a fee delegator');

    prettyPrintDelegatedTransfer(signedDtd, parrot)
    // console.log(` SignedDTD: \n Transfer: ${signedDtd.transfer}\n Signature: ${signedDtd.signature}\n Signer: ${signedDtd.signer}`);

    const ans = await askQuestion('\n \nDo you want to broadcast this manually? Please type Y or N:   ');
    if (ans.toLowerCase() === 'n') {
        console.log('Alice acts as the fee delegator and broadcasts this signedDelegatedTransferDetails since she is willing to fee delegate');
        // Now Bob sends this signedDtd offline to Alice
        // Alice decides to broadcast it since she is willing to do the trade for Bob
        const transferTx = await parrot.api.tx.delegation.delegatedTransfer(signedDtd);
        const hash = await transferTx.signAndSend(ALICE);
        console.log('Delegated transfer sent by Alice with hash', hash.toHex());
        await sleep(SLEEP);
    }
    // if user says Y, wait till user wakes program again 
    else if (ans.toLowerCase() === 'y') {
        const resp = await askQuestion('\n \nPlease type anything, once you have broadcasted the transaction and it has been mined!:   ');
    }

    // Now get the new balances  
    let balAliceNew; let balBobNew; let
        balCharlieNew;
    [balAliceNew, balBobNew, balCharlieNew] = await getAliceBobBalStats(parrot, ALICE.address, BOB.address, CHARLIE.address);
    // print the balance difference 
    await balanceDifference(parrot, balAlice, balBob, balCharlie, balAliceNew, balBobNew, balCharlieNew);
}

async function main() {
    await feeDelegationDemo();
    process.exit(-1);
}

main().catch(console.error);
