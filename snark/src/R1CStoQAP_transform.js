const galois = require('@guildofweavers/galois');
const math = require('mathjs');
const { LWEToR1CS_transform } = require('./LWEtoR1CS_transform')

console.log("Initializing a large field...");
const order = 73n;
const GF = galois.createPrimeField(order);
const q = 2741;
const t = 73;
const d = 57;
const delta = Math.floor(q / t);

// Polynomial modulus, represented as an array for documentation purposes
const p_q = [1, ...Array(d - 1).fill(0), 1];
console.log("Field initialized");

function interpolateColumn(col, nb) {
    const xs = GF.newVectorFrom(Array.from({ length: nb }, (_, i) => BigInt(i + 1)));
    const ys = GF.newVectorFrom(col);
    return GF.interpolate(xs, ys);
}

function getPolysOfMatrix(matrix) {
    const polys = [];
    const nbOfRows = matrix.length;
    const nbOfColumns = matrix[0].length;

    for (let colId = 0; colId < nbOfColumns; colId++) {
        const column = [];
        for (let row = 0; row < nbOfRows; row++) {
            column.push(BigInt(matrix[row][colId]));
        }
        polys.push(interpolateColumn(column, nbOfRows));
    }

    return polys;
}

function polySum(s) {
    const { A_matrix: A, B_matrix: B, C_matrix: C } = LWEToR1CS_transform();

    // Ensure s is an array of BigInt
    const sBigInt = s.map(BigInt);
    const sVector = math.matrix(sBigInt);

    // Convert matrices to math.js matrices
    const A_mat = math.matrix(A);
    const B_mat = math.matrix(B);
    const C_mat = math.matrix(C);

    const C_result = math.multiply(C_mat, sVector);
    const AB_result = math.dotMultiply(math.multiply(A_mat, sVector), math.multiply(B_mat, sVector));

    console.log("C_result:", C_result);
    console.log("AB_result:", AB_result);
    console.log("Comparison result:", math.deepEqual(C_result, AB_result));

    const U_polys = getPolysOfMatrix(A);
    const V_polys = getPolysOfMatrix(B);
    const W_polys = getPolysOfMatrix(C);
    console.log("U_polys: ", U_polys.map(poly => poly.toValues()));
//    console.log("V_polys: ", V_polys.map(poly => poly.toValues()));
//    console.log("W_polys: ", W_polys.map(poly => poly.toValues()));

    let Ua = GF.newVectorFrom([0n]);
    sBigInt.forEach((si, i) => { Ua = GF.addPolys(Ua, GF.mulPolyByConstant(U_polys[i], si)); });

    let Va = GF.newVectorFrom([0n]);
    sBigInt.forEach((si, i) => { Va = GF.addPolys(Va, GF.mulPolyByConstant(V_polys[i], si)); });

    let Wa = GF.newVectorFrom([0n]);
    sBigInt.forEach((si, i) => { Wa = GF.addPolys(Wa, GF.mulPolyByConstant(W_polys[i], si)); });

    // Create the vanishing polynomial 
    let T = GF.newVectorFrom([1n, order - 1n]);

    // Multiply T by (x - i) for i from 2 to len(A)
    for (let i = 2; i <= A.length; i++) {
        const poly = GF.newVectorFrom([1n, order - BigInt(i)]);
        T = GF.mulPolys(T, poly);
    }

//    console.log("Ua: ", Ua.toValues());
//    console.log("Vas: ", Va.toValues());
//    console.log("Wa: ", Wa.toValues());
//    console.log("T: ", T.toValues().reverse());
  
    return { Ua, Va, Wa, T };
}

module.exports = { polySum };

// Example usage:
//const s = [1, 5, 8, 1, 8, 4, 7, 1, 0, 6, 4, 9, 1, 0, 8, 0, 1, 5, 0, 3, 2, 1, 0, 0, 1, 1, 1, 0, 1, 4, 0, 0, 0, 6, 0, 0, 1, 0, 0, 0, 1, 5, 0, 0, 2, 4, 4, 4, 6, 6, 7, 0, 0, 1, 5, 5, 7];
//polySum(s);
