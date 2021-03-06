// ### ATOMIC SWAP DEMO for PRC20 TOKENS ###

// this is the client to interact with oax blockchain 
const ParrotInterface = require('parrot-client');
// helper function to get user input 
const askQuestion = require('./util/util.js')

// sleep time between actions
const SLEEP = 6000;

// Simple function to print signedOffer cleanly for the demo 
function prettyPrintSignedOffer(signedOffer) {
    console.log(`SignedOffer: \n 
    Signature: ${signedOffer.signature} \n
    Signer: ${signedOffer.signer} \n
    Offer: \n
        offer_token: ${signedOffer.offer.offer_token} \n
        offer_amount: ${signedOffer.offer.offer_amount} \n
        requested_token: ${signedOffer.offer.requested_token} \n
        requested_amount: ${signedOffer.offer.requested_amount} \n
        nonce: ${signedOffer.offer.nonce}
        `);
}

// this prints token stats for 2 addresses and 2 different tokens,
// useful in making sure that a swap has successfully occurred 
// (only for visual feedback purposes)
async function printAliceBobTokenStats(parrot, aliceAddress, bobAddress, aliceTokenId, bobTokenId) {
    // Alice Bal
    const bal1 = await parrot.getTokenBalance(aliceAddress, aliceTokenId);
    const bal2 = await parrot.getTokenBalance(aliceAddress, bobTokenId);
    // Bob Bal
    const bal3 = await parrot.getTokenBalance(bobAddress, aliceTokenId);
    const bal4 = await parrot.getTokenBalance(bobAddress, bobTokenId);
    // Print stats
    console.log(` Token Balance Summary: \n TokenId: ${aliceTokenId} Alice: ${bal1} Bob: ${bal3} \n TokenId: ${bobTokenId} Alice: ${bal2} Bob: ${bal4}`);
}

// sleep blocking
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// demo for an atomic swap of tokens (this demo creates two new tokens)
async function swapDemo() {
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

    console.log('Creating two new PRC20 tokens!');
    // Alice creates a token
    const tokenIdAlice = await parrot.createToken(ALICE, 1000);
    console.log(`Alice has created Alice Token with tokenId: ${tokenIdAlice}`);
    await sleep(SLEEP);

    // Bob creates a token
    const tokenIdBob = await parrot.createToken(BOB, 500);
    console.log(`Bob has created Bob Token with tokenId: ${tokenIdBob}`);
    await sleep(SLEEP);

    // Print balance stats
    await printAliceBobTokenStats(parrot, ALICE.address, BOB.address, tokenIdAlice, tokenIdBob);

    console.log('Now Bob will create an offer to trade some of his tokens for AliceToken');
    // Bob  creates an offer
    const offer = await parrot.createOffer(BOB.address, tokenIdBob, 100, tokenIdAlice, 200);
    // Bob creates a signature for the offer
    const signature = await parrot.signOffer(BOB, offer);
    // Bob creates a signedOffer
    const signedOffer = await parrot.createSignedOffer(offer, signature, BOB.address);
    console.log('Bob has created a signedOffer that he can share with Alice');
    // print this signedOffer 
    prettyPrintSignedOffer(signedOffer);

    // Now ask user if he wants to manually send this swap or let the demo script do it 
    const ans = await askQuestion(`\n \nDo you want to broadcast this manually? Please type Y or N:    `);

    // If user says N, send it using Alice 
    if (ans.toLowerCase() === 'n') {
        console.log('Alice broadcasts this offer since she is willing to accept the swap terms');
        // Now Bob sends this offer offline to Alice
        // Alice decides to broadcast it since she is willing to take the offer
        await parrot.swap(ALICE, signedOffer);
        await sleep(SLEEP);
    }
    // if user says Y, wait till user wakes program again 
    else if (ans.toLowerCase() === 'y') {
        const resp = await askQuestion(`\n \nPlease type anything once you have broadcasted the transaction and it has been mined!`)
    }

    // Print balance stats
    await printAliceBobTokenStats(parrot, ALICE.address, BOB.address, tokenIdAlice, tokenIdBob);
}

async function main() {
    await swapDemo();
    process.exit(-1);
}

main().catch(console.error);
