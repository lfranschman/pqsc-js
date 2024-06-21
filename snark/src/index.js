const { polySum } = require('./R1CStoQAP_transform');
const galois = require('@guildofweavers/galois');
const math = require('mathjs'); 
const { signProof, verifySignature } = require('./dilithium');
const fetch = require("node-fetch"); 

console.log("Initializing a large field...");
const order = 73n;
const GF = galois.createPrimeField(order);
const q = 8929; 
const t = 73; 
const d = 57;
const delta = BigInt(q) / BigInt(t);

// Polynomial modulus, represented as an array for documentation purposes
const p_q = [1n, ...Array(d - 1).fill(0n), 1n];
console.log("Field initialized");

function setup() {
    const alpha = 54n;
    const sk = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * 2))));
    const a2 = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * Number(q)))));
    const e = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * Number(q)))));
    const neg_a2_sk = GF.negVectorElements(GF.mulPolys(a2, sk));
    const pk_0 = GF.addPolys(neg_a2_sk, e);
    const pk_1 = a2;
    const pk = [pk_0, pk_1];
    const u = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * 2))));
    const e1 = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * Number(q)))));
    const e2 = GF.newVectorFrom(Array.from({ length: d }, () => BigInt(Math.floor(Math.random() * Number(q)))));

    return { alpha, sk, a2, e, pk, u, e1, e2 };
}

function prover(pk, u, e1, alpha, s) {
    const { Ua, Va, Wa, T } = polySum(s);
    console.log('Result Ua: ', Ua);
    console.log('Result Va: ', Va);
    console.log('Result Wa: ', Wa);
    console.log('T: ', T);

    const UaFiltered = Ua.toValues().filter(num => num !== 0n);
    const VaFiltered = Va.toValues().filter(num => num !== 0n);
    const WaFiltered = Wa.toValues().filter(num => num !== 0n);
    const T_rev = T.toValues();

    console.log('Result UaFiltered: ', UaFiltered);
    console.log('Result VaFiltered: ', VaFiltered);
    console.log('Result WaFiltered: ', WaFiltered);
    console.log('T: ', T_rev);

    const H = GF.divPolys(GF.subPolys(GF.mulPolys(Ua, Va), Wa), T);
    console.log("H: ", H);
    const HFiltered = H.toValues().filter(num => num !== 0n);
    console.log("HFiltered: ", HFiltered);
    
    const Left = (GF.evalPolyAt(Ua, alpha) * GF.evalPolyAt(Va, alpha) - GF.evalPolyAt(Wa, alpha)) % order;
    console.log("Left: ", Left);
    const Right = (GF.evalPolyAt(T, alpha) * GF.evalPolyAt(H, alpha)) % order;
    console.log("Right: ", Right);

    const c1 = GF.addPolys(GF.addPolys(GF.mulPolys(pk[0], u), e1), GF.mulPolyByConstant(GF.newVectorFrom([Left]), delta));
    const c2 = GF.addPolys(GF.addPolys(GF.mulPolys(pk[0], u), e1), GF.mulPolyByConstant(GF.newVectorFrom([Right]), delta));

    console.log("c1: ", c1);
    console.log("c2: ", c2);

    return { c1, c2 };
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function verifier(proof, public_key, signature) {
    if (arrayEquals(proof[0], proof[1]) && verifySignature(public_key, proof, signature) == 1){
        return true;
    } else {
        return false;        
    }   
}

const s = [1, 5, 8, 1, 8, 4, 7, 1, 0, 6, 4, 9, 1, 0, 8, 0, 1, 5, 0, 3, 2, 1, 0, 0, 1, 1, 1, 0, 1, 4, 0, 0, 0, 6, 0, 0, 1, 0, 0, 0, 1, 5, 0, 0, 2, 4, 4, 4, 6, 6, 7, 0, 0, 1, 5, 5, 7];

const { alpha, sk, a2, e, pk, u, e1, e2 } = setup();
const { c1, c2 } = prover(pk, u, e1, alpha, s);

const c1Values = c1.toValues().map(Number);
const c2Values = c2.toValues().map(Number);

const proof_response = [c1Values, c2Values];
const signed_proof = signProof(proof_response);
const signedProof_parsed = JSON.parse(signed_proof);
const public_key = signedProof_parsed["publicKey"];
const signature = signedProof_parsed["signature"];

const verification = verifier(proof_response, public_key, signature);
console.log("verification: ", verification);

const url = "http://localhost:2800/checkProof";

const payload_dict = {
    proof: proof_response,
    public_key: public_key,
    signature: signature
};

const payload = JSON.stringify(payload_dict);

const headers = {
    'Content-Type': 'application/json'
};

fetch(url, {
    method: 'POST',
    headers: headers,
    body: payload
})
.then(response => {
    console.log(`Check Proof response status: ${response.status}`);
    return response.json(); // Assuming the response is JSON
})
.then(data => {
    console.log('Check Proof response content:', data);
})
.catch(error => {
    console.error('Error:', error);
});
